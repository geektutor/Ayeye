import { Router } from 'express'

import { checkInSchema, registerAttendeeSchema } from '@ayeye/types'

import { interswitchClient } from '../lib/interswitch'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { RefundService } from '../services/refund.service'

const router = Router()
const refundService = new RefundService()

// POST /api/events/:id/register — public: attendee registers and gets a payment URL
router.post('/events/:id/register', validate(registerAttendeeSchema), async (req, res) => {
  try {
    const eventId = req.params['id'] ?? ''
    const { name, email, phone } = req.body as { name: string; email: string; phone: string }

    const event = await prisma.event.findUnique({ where: { registrationLink: eventId } })
    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found', statusCode: 404 })
      return
    }

    if (event.status !== 'PUBLISHED' && event.status !== 'LIVE') {
      res
        .status(400)
        .json({ success: false, error: 'Event is not open for registration', statusCode: 400 })
      return
    }

    // Upsert attendee (no auth required for registration)
    let attendee = await prisma.user.findUnique({ where: { email } })
    if (!attendee) {
      attendee = await prisma.user.create({
        data: { name, email, phone, role: 'ATTENDEE', passwordHash: '' },
      })
    }

    // Guard against duplicate registration
    const existing = await prisma.registration.findFirst({
      where: { eventId: event.id, attendeeId: attendee.id },
    })
    if (existing) {
      res
        .status(409)
        .json({ success: false, error: 'Already registered for this event', statusCode: 409 })
      return
    }

    const registration = await prisma.registration.create({
      data: {
        eventId: event.id,
        attendeeId: attendee.id,
        depositAmount: event.depositAmount,
        status: 'PENDING',
      },
    })

    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173'
    const paymentResult = interswitchClient.initiatePayment({
      amount: event.depositAmount,
      customerEmail: email,
      customerName: name,
      reference: `ayeye_${registration.id}`,
      redirectUrl: `${frontendUrl}/payment/callback`,
    })

    res.status(201).json({
      success: true,
      data: {
        registrationId: registration.id,
        paymentUrl: paymentResult.paymentUrl,
        depositAmount: event.depositAmount,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed'
    res.status(500).json({ success: false, error: message, statusCode: 500 })
  }
})

// POST /api/checkin — organizer auth required: scan QR and trigger refund
router.post('/checkin', requireAuth, validate(checkInSchema), async (req, res) => {
  try {
    const { registrationId } = req.body as { registrationId: string }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    })

    if (!registration) {
      res
        .status(404)
        .json({ success: false, error: 'Registration not found', statusCode: 404 })
      return
    }

    if (registration.status !== 'PAID') {
      res.status(400).json({
        success: false,
        error: `Cannot check in: registration status is ${registration.status}`,
        statusCode: 400,
      })
      return
    }

    // Mark checked in first so RefundService sees CHECKED_IN status
    await prisma.registration.update({
      where: { id: registrationId },
      data: { status: 'CHECKED_IN', checkedInAt: new Date() },
    })

    const { paycode } = await refundService.processRefund(registrationId)

    res.json({
      success: true,
      data: {
        registrationId,
        paycode,
        message: 'Checked in successfully. Paycode sent via email.',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Check-in failed'
    res.status(500).json({ success: false, error: message, statusCode: 500 })
  }
})

export default router
