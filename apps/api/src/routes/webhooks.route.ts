import { Router } from 'express'

import { verifyWebhookSignature } from '../lib/interswitch'
import { prisma } from '../lib/prisma'
import { qrService } from '../services/qr.service'

const router = Router()

router.post('/payment', async (req, res) => {
  const signature = req.headers['x-interswitch-signature'] as string | undefined

  if (!verifyWebhookSignature(req.body, signature)) {
    res.status(400).json({ success: false, error: 'Invalid webhook signature', statusCode: 400 })
    return
  }

  // Respond 200 immediately — Interswitch retries on non-200
  res.json({ success: true })

  const { event, data } = req.body as {
    event: string
    data: {
      transactionReference: string  // ISW reference
      transactionRef: string        // our txn_ref sent at initiation
      responseCode: string
      amount: number
    }
  }

  // Our txn_ref format: "ayeye_{registrationId}"
  const ourRef = data.transactionRef ?? data.transactionReference ?? ''
  const registrationId = ourRef.replace(/^ayeye_/, '')

  if (!registrationId) return

  const registration = await prisma.registration.findFirst({
    where: { id: registrationId },
  }).catch(() => null)

  if (!registration) return

  if (event === 'TRANSACTION.COMPLETED') {
    // Idempotency guard
    if (registration.status === 'PAID') return

    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: 'PAID',
        transactionReference: data.transactionReference,
        paidAt: new Date(),
      },
    })

    // Fire-and-forget: generate QR and email to attendee
    void qrService.generateAndSend(registrationId).catch((err: unknown) => {
      console.error('QR generation failed for registration', registrationId, err)
    })
  } else if (event === 'TRANSACTION.FAILED') {
    if (registration.status === 'PAYMENT_FAILED') return
    await prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'PAYMENT_FAILED' },
    })
  }
})

export default router
