import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RefundService } from '../../services/refund.service'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the Interswitch Paycode client — we never hit the real API in unit tests
vi.mock('../../lib/interswitch', () => ({
  interswitchClient: {
    generatePaycode: vi.fn(),
  },
}))

// Mock Prisma — unit tests have no database
vi.mock('../../lib/prisma', () => ({
  prisma: {
    registration: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
  },
}))

// Mock SMS notification — side effect we don't care about in unit tests
vi.mock('../../services/notification.service', () => ({
  notificationService: {
    sendSms: vi.fn().mockResolvedValue(undefined),
  },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockRegistration = {
  id: 'reg_abc123',
  eventId: 'evt_xyz789',
  attendeeId: 'usr_def456',
  status: 'CHECKED_IN', // must be CHECKED_IN for processRefund to proceed
  depositAmount: 200000, // ₦2,000 in kobo
  attendee: {
    phone: '08012345678',
    email: 'tunde@example.com',
    name: 'Tunde Adesanya',
  },
  event: {
    name: 'DevFest Lagos 2026',
    depositAmount: 200000,
  },
}

const mockPaycodeResponse = {
  paycodeId: 'pc_111222333',
  code: '12345678901234',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RefundService', () => {
  let refundService: RefundService
  let prisma: any
  let interswitchClient: any

  beforeEach(async () => {
    // Re-import mocks after vi.mock hoisting
    const { prisma: p } = await import('../../lib/prisma')
    const { interswitchClient: ic } = await import('../../lib/interswitch')
    prisma = p
    interswitchClient = ic
    refundService = new RefundService()
  })

  describe('processRefund', () => {
    it('generates a Paycode and marks registration as REFUNDED on successful check-in', async () => {
      prisma.registration.findUnique.mockResolvedValue(mockRegistration)
      interswitchClient.generatePaycode.mockResolvedValue(mockPaycodeResponse)
      prisma.registration.update.mockResolvedValue({ ...mockRegistration, status: 'REFUNDED' })
      prisma.transaction.create.mockResolvedValue({ id: 'txn_001' })

      const result = await refundService.processRefund('reg_abc123')

      // Paycode was requested for the correct amount
      expect(interswitchClient.generatePaycode).toHaveBeenCalledWith({
        amount: 200000,
        phone: '08012345678',
        reference: expect.stringContaining('reg_abc123'),
      })

      // Registration status updated
      expect(prisma.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg_abc123' },
        data: {
          status: 'REFUNDED',
          paycodeId: mockPaycodeResponse.paycodeId,
          refundedAt: expect.any(Date),
        },
      })

      expect(result.paycode).toBe(mockPaycodeResponse.code)
    })

    it('throws if registration is not found', async () => {
      prisma.registration.findUnique.mockResolvedValue(null)

      await expect(refundService.processRefund('reg_nonexistent')).rejects.toThrow(
        'Registration not found'
      )
      expect(interswitchClient.generatePaycode).not.toHaveBeenCalled()
    })

    it('throws if registration is not in CHECKED_IN status', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        ...mockRegistration,
        status: 'PAID', // not yet checked in
      })

      await expect(refundService.processRefund('reg_abc123')).rejects.toThrow(
        'Registration must be in CHECKED_IN status to process refund'
      )
    })

    it('does not double-refund an already refunded registration', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        ...mockRegistration,
        status: 'REFUNDED',
      })

      await expect(refundService.processRefund('reg_abc123')).rejects.toThrow(
        'Refund already processed'
      )
      expect(interswitchClient.generatePaycode).not.toHaveBeenCalled()
    })

    it('throws and does not update DB if Paycode API call fails', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        ...mockRegistration,
        status: 'CHECKED_IN',
      })
      interswitchClient.generatePaycode.mockRejectedValue(new Error('Interswitch API timeout'))

      await expect(refundService.processRefund('reg_abc123')).rejects.toThrow(
        'Interswitch API timeout'
      )
      expect(prisma.registration.update).not.toHaveBeenCalled()
    })
  })

  describe('processNoShows', () => {
    it('marks all unchecked-in registrations as NO_SHOW after event closes', async () => {
      const eventId = 'evt_xyz789'
      prisma.registration.updateMany.mockResolvedValue({ count: 5 })

      await refundService.processNoShows(eventId)

      expect(prisma.registration.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId, status: 'PAID' },
          data: { status: 'NO_SHOW' },
        })
      )
    })
  })
})
