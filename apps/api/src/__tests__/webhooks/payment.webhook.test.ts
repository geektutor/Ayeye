import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../index'

// ---------------------------------------------------------------------------
// Interswitch Payment Gateway sends a webhook to /api/webhooks/payment
// when a deposit transaction is completed or failed.
// These tests verify the webhook handler correctly updates registration status
// and triggers QR code generation on successful payment.
// ---------------------------------------------------------------------------

vi.mock('../../lib/prisma', () => ({
  prisma: {
    registration: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../../services/qr.service', () => ({
  qrService: {
    generateAndSend: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../lib/interswitch', () => ({
  verifyWebhookSignature: vi.fn().mockReturnValue(true),
}))

// Re-import the mock at module scope so beforeEach can restore the default
import { verifyWebhookSignature } from '../../lib/interswitch'

// ---------------------------------------------------------------------------
// Fixtures — match the actual shape of Interswitch Payment Gateway webhooks
// ---------------------------------------------------------------------------

const successWebhookPayload = {
  event: 'payment.completed',
  data: {
    transactionReference: 'ISW_TXN_001',
    merchantReference: 'ayeye_reg_abc123', // encodes our registration ID
    amount: 200000,
    currency: 'NGN',
    status: 'COMPLETED',
    paymentMethod: 'CARD',
    cardScheme: 'VERVE',
  },
}

const failedWebhookPayload = {
  event: 'payment.failed',
  data: {
    transactionReference: 'ISW_TXN_002',
    merchantReference: 'ayeye_reg_abc123',
    amount: 200000,
    currency: 'NGN',
    status: 'FAILED',
  },
}

const mockRegistration = {
  id: 'reg_abc123',
  status: 'PENDING',
  depositAmount: 200000,
  attendee: { phone: '08012345678', email: 'tunde@example.com' },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// resetAllMocks (in setup.ts) clears implementations after each test, so restore
// the default valid-signature behaviour before each webhook test.
beforeEach(() => {
  vi.mocked(verifyWebhookSignature).mockReturnValue(true)
})

describe('POST /api/webhooks/payment', () => {
  it('marks registration as PAID and triggers QR generation on payment.completed', async () => {
    const { prisma } = await import('../../lib/prisma')
    const { qrService } = await import('../../services/qr.service')
    ;(prisma.registration.findFirst as any).mockResolvedValue(mockRegistration)
    ;(prisma.registration.update as any).mockResolvedValue({ ...mockRegistration, status: 'PAID' })

    const res = await request(app)
      .post('/api/webhooks/payment')
      .set('x-interswitch-signature', 'valid-signature')
      .send(successWebhookPayload)

    expect(res.status).toBe(200)
    expect(prisma.registration.update).toHaveBeenCalledWith({
      where: { id: 'reg_abc123' },
      data: {
        status: 'PAID',
        transactionReference: 'ISW_TXN_001',
        paidAt: expect.any(Date),
      },
    })
    expect(qrService.generateAndSend).toHaveBeenCalledWith('reg_abc123')
  })

  it('marks registration as PAYMENT_FAILED on payment.failed', async () => {
    const { prisma } = await import('../../lib/prisma')
    ;(prisma.registration.findFirst as any).mockResolvedValue(mockRegistration)
    ;(prisma.registration.update as any).mockResolvedValue({
      ...mockRegistration,
      status: 'PAYMENT_FAILED',
    })

    const res = await request(app)
      .post('/api/webhooks/payment')
      .set('x-interswitch-signature', 'valid-signature')
      .send(failedWebhookPayload)

    expect(res.status).toBe(200)
    expect(prisma.registration.update).toHaveBeenCalledWith({
      where: { id: 'reg_abc123' },
      data: { status: 'PAYMENT_FAILED' },
    })
  })

  it('returns 400 when webhook signature is invalid', async () => {
    const { verifyWebhookSignature } = await import('../../lib/interswitch')
    ;(verifyWebhookSignature as any).mockReturnValue(false)

    const res = await request(app)
      .post('/api/webhooks/payment')
      .set('x-interswitch-signature', 'bad-signature')
      .send(successWebhookPayload)

    expect(res.status).toBe(400)
  })

  it('returns 200 (idempotent) when registration is already PAID', async () => {
    const { prisma } = await import('../../lib/prisma')
    ;(prisma.registration.findFirst as any).mockResolvedValue({
      ...mockRegistration,
      status: 'PAID',
    })

    const res = await request(app)
      .post('/api/webhooks/payment')
      .set('x-interswitch-signature', 'valid-signature')
      .send(successWebhookPayload)

    // Must be idempotent — Interswitch may retry webhooks
    expect(res.status).toBe(200)
    expect(prisma.registration.update).not.toHaveBeenCalled()
  })
})
