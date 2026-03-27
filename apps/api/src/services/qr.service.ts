import QRCode from 'qrcode'

import { prisma } from '../lib/prisma'
import { notificationService } from './notification.service'

class QrService {
  async generateAndSend(registrationId: string): Promise<void> {
    const qrDataUrl = await QRCode.toDataURL(registrationId, {
      errorCorrectionLevel: 'H',
      width: 300,
    })

    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { qrCode: qrDataUrl },
      include: {
        attendee: true,
        event: true,
      },
    })

    await notificationService.sendEmail({
      to: registration.attendee.email,
      subject: `Your QR Code for ${registration.event.name}`,
      text: `Registration confirmed! Show your QR code at the event to check in and receive your refund.`,
      html: `
        <p>Registration confirmed!</p>
        <p>Show this QR code at <strong>${registration.event.name}</strong> to check in and receive your ₦${(registration.depositAmount / 100).toLocaleString('en-NG')} refund instantly.</p>
        <img src="${qrDataUrl}" alt="Check-in QR Code" style="width:300px;height:300px" />
      `,
    })
  }
}

export const qrService = new QrService()
