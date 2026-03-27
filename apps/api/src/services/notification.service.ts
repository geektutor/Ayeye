export interface EmailParams {
  to: string
  subject: string
  text: string
  html?: string
}

class NotificationService {
  async sendEmail(params: EmailParams): Promise<void> {
    const apiKey = process.env['SENDGRID_API_KEY']
    const from = process.env['EMAIL_FROM'] ?? 'noreply@ayeye.app'

    if (!apiKey) {
      if (process.env['NODE_ENV'] !== 'test') {
        console.warn(`[Email] No SENDGRID_API_KEY — would send to ${params.to}: ${params.subject}`)
      }
      return
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: from, name: 'Ayeye' },
        subject: params.subject,
        content: [
          { type: 'text/plain', value: params.text },
          ...(params.html ? [{ type: 'text/html', value: params.html }] : []),
        ],
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`SendGrid error: ${response.status} ${body}`)
    }
  }
}

export const notificationService = new NotificationService()
