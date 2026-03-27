import { interswitchClient } from '../lib/interswitch'
import { prisma } from '../lib/prisma'
import { notificationService } from './notification.service'

export class RefundService {
  async processRefund(registrationId: string): Promise<{ paycode: string }> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        attendee: true,
        event: true,
      },
    })

    if (!registration) {
      throw new Error('Registration not found')
    }

    if (registration.status === 'REFUNDED') {
      throw new Error('Refund already processed')
    }

    if (registration.status !== 'CHECKED_IN') {
      throw new Error('Registration must be in CHECKED_IN status to process refund')
    }

    const reference = `refund_${registrationId}_${Date.now()}`

    const result = await interswitchClient.generatePaycode({
      amount: registration.depositAmount,
      email: registration.attendee.email,
      reference,
    })

    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: 'REFUNDED',
        paycodeId: result.paycodeId,
        refundedAt: new Date(),
      },
    })

    await prisma.transaction.create({
      data: {
        registrationId,
        type: 'REFUND',
        amount: registration.depositAmount,
        currency: 'NGN',
        reference,
        interswitchRef: result.paycodeId,
        status: 'SUCCESS',
        metadata: { paycodeId: result.paycodeId, code: result.code },
      },
    })

    await notificationService.sendEmail({
      to: registration.attendee.email,
      subject: `Your refund Paycode for ${registration.event.name}`,
      text: `Your refund Paycode is: ${result.code}. Redeem at any Interswitch ATM or POS terminal — no card needed.`,
      html: `
        <p>Thanks for attending <strong>${registration.event.name}</strong>!</p>
        <p>Your refund Paycode is:</p>
        <h2 style="font-size:2rem;letter-spacing:0.1em;font-family:monospace">${result.code}</h2>
        <p>Redeem at any Interswitch-connected ATM or POS terminal — no card required.</p>
        <p style="color:#6b7280;font-size:0.875rem">Amount: ₦${(registration.depositAmount / 100).toLocaleString('en-NG')}</p>
      `,
    })

    return { paycode: result.code }
  }

  async processNoShows(eventId: string): Promise<void> {
    await prisma.registration.updateMany({
      where: { eventId, status: 'PAID' },
      data: { status: 'NO_SHOW' },
    })
  }
}
