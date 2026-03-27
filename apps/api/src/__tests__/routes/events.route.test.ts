import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../index'

// ---------------------------------------------------------------------------
// Mock Prisma for route-level integration tests
// (These tests verify HTTP layer: status codes, response shape, validation)
// For DB integration tests with a real DB, see src/__tests__/integration/)
// ---------------------------------------------------------------------------

vi.mock('../../lib/prisma', () => ({
  prisma: {
    event: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    registration: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

// Expose as a controllable vi.fn so individual tests can override the implementation
const mockRequireAuth = vi.fn((_req: any, _res: any, next: any) => next())

vi.mock('../../middleware/auth', () => ({
  requireAuth: (...args: any[]) => mockRequireAuth(...args),
}))

// resetAllMocks in setup.ts clears the implementation — restore the bypass default
beforeEach(() => {
  mockRequireAuth.mockImplementation((_req: any, _res: any, next: any) => next())
})

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validEventPayload = {
  name: 'DevFest Lagos 2026',
  description: 'Annual developer festival in Lagos',
  date: '2026-06-15T09:00:00Z',
  venue: 'Landmark Event Centre, Lagos',
  depositAmount: 200000, // ₦2,000 in kobo
  noShowPolicy: 'CHARITY',
  maxAttendees: 300,
}

const mockCreatedEvent = {
  id: 'evt_xyz789',
  ...validEventPayload,
  organizerId: 'usr_org001',
  registrationLink: 'https://ayeye.app/events/evt_xyz789/register',
  status: 'DRAFT',
  createdAt: new Date().toISOString(),
}

// ---------------------------------------------------------------------------
// POST /api/events
// ---------------------------------------------------------------------------

describe('POST /api/events', () => {
  it('creates an event and returns 201 with the event data', async () => {
    const { prisma } = await import('../../lib/prisma')
    ;(prisma.event.create as any).mockResolvedValue(mockCreatedEvent)

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', 'Bearer test-token')
      .send(validEventPayload)

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({
      id: 'evt_xyz789',
      name: 'DevFest Lagos 2026',
      registrationLink: expect.stringContaining('evt_xyz789'),
    })
  })

  it('returns 400 when depositAmount is missing', async () => {
    const { depositAmount: _, ...payload } = validEventPayload

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', 'Bearer test-token')
      .send(payload)

    expect(res.status).toBe(400)
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'depositAmount' }),
      ])
    )
  })

  it('returns 400 when depositAmount is below ₦500 (50000 kobo)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', 'Bearer test-token')
      .send({ ...validEventPayload, depositAmount: 30000 }) // ₦300 — too low

    expect(res.status).toBe(400)
  })

  it('returns 400 when depositAmount exceeds ₦50,000 (5000000 kobo)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', 'Bearer test-token')
      .send({ ...validEventPayload, depositAmount: 6000000 }) // ₦60,000 — too high

    expect(res.status).toBe(400)
  })

  it('returns 401 when no auth token is provided', async () => {
    // Simulate real auth middleware rejecting the unauthenticated request
    mockRequireAuth.mockImplementationOnce((_req: any, res: any) => {
      res.status(401).json({ success: false, error: 'No token provided' })
    })

    const res = await request(app).post('/api/events').send(validEventPayload)

    expect([401, 403]).toContain(res.status)
  })
})

// ---------------------------------------------------------------------------
// GET /api/events
// ---------------------------------------------------------------------------

describe('GET /api/events', () => {
  it('returns a list of events with registration counts', async () => {
    const { prisma } = await import('../../lib/prisma')
    ;(prisma.event.findMany as any).mockResolvedValue([mockCreatedEvent])
    ;(prisma.registration.count as any).mockResolvedValue(5)

    const res = await request(app)
      .get('/api/events')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].id).toBe('evt_xyz789')
    expect(res.body.data[0].totalRegistrations).toBe(5)
  })

  it('returns empty array when organizer has no events', async () => {
    const { prisma } = await import('../../lib/prisma')
    ;(prisma.event.findMany as any).mockResolvedValue([])

    const res = await request(app)
      .get('/api/events')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// GET /api/events/:id
// ---------------------------------------------------------------------------

describe('GET /api/events/:id', () => {
  it('returns 404 for a non-existent event', async () => {
    const { prisma } = await import('../../lib/prisma')
    ;(prisma.event.findUnique as any).mockResolvedValue(null)

    const res = await request(app)
      .get('/api/events/evt_nonexistent')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/events/:id
// ---------------------------------------------------------------------------

describe('PATCH /api/events/:id', () => {
  it('updates event fields and returns the updated event', async () => {
    const { prisma } = await import('../../lib/prisma')
    const updatedEvent = { ...mockCreatedEvent, name: 'DevFest Lagos 2026 – Updated' }
    ;(prisma.event.findUnique as any).mockResolvedValue(mockCreatedEvent)
    ;(prisma.event.update as any).mockResolvedValue(updatedEvent)

    // Auth mock injects organizerId matching mockCreatedEvent.organizerId
    mockRequireAuth.mockImplementation((req: any, _res: any, next: any) => {
      req.user = { userId: 'usr_org001' }
      next()
    })

    const res = await request(app)
      .patch('/api/events/evt_xyz789')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'DevFest Lagos 2026 – Updated' })

    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('DevFest Lagos 2026 – Updated')
  })

  it('returns 404 when the event does not exist', async () => {
    const { prisma } = await import('../../lib/prisma')
    ;(prisma.event.findUnique as any).mockResolvedValue(null)

    const res = await request(app)
      .patch('/api/events/evt_missing')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'New name' })

    expect(res.status).toBe(404)
  })

  it('returns 403 when the requester is not the event owner', async () => {
    const { prisma } = await import('../../lib/prisma')
    ;(prisma.event.findUnique as any).mockResolvedValue(mockCreatedEvent)

    mockRequireAuth.mockImplementation((req: any, _res: any, next: any) => {
      req.user = { userId: 'usr_different' }
      next()
    })

    const res = await request(app)
      .patch('/api/events/evt_xyz789')
      .set('Authorization', 'Bearer test-token')
      .send({ name: 'Hijacked' })

    expect(res.status).toBe(403)
  })
})

// ---------------------------------------------------------------------------
// POST /api/events/:id/publish
// ---------------------------------------------------------------------------

describe('POST /api/events/:id/publish', () => {
  it('publishes a draft event and returns status PUBLISHED', async () => {
    const { prisma } = await import('../../lib/prisma')
    const publishedEvent = { ...mockCreatedEvent, status: 'PUBLISHED' }
    ;(prisma.event.findUnique as any).mockResolvedValue(mockCreatedEvent)
    ;(prisma.event.update as any).mockResolvedValue(publishedEvent)

    mockRequireAuth.mockImplementation((req: any, _res: any, next: any) => {
      req.user = { userId: 'usr_org001' }
      next()
    })

    const res = await request(app)
      .post('/api/events/evt_xyz789/publish')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('PUBLISHED')
  })

  it('returns 404 when the event does not exist', async () => {
    const { prisma } = await import('../../lib/prisma')
    ;(prisma.event.findUnique as any).mockResolvedValue(null)

    const res = await request(app)
      .post('/api/events/evt_missing/publish')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// GET /api/events/:id/stats
// ---------------------------------------------------------------------------

describe('GET /api/events/:id/stats', () => {
  it('returns registration counts for an event', async () => {
    const { prisma } = await import('../../lib/prisma')
    ;(prisma.event.findUnique as any).mockResolvedValue(mockCreatedEvent)
    ;(prisma.registration.count as any)
      .mockResolvedValueOnce(10) // totalRegistrations
      .mockResolvedValueOnce(7)  // checkedIn
      .mockResolvedValueOnce(5)  // refunded
      .mockResolvedValueOnce(1)  // noShows

    const res = await request(app)
      .get('/api/events/evt_xyz789/stats')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({
      totalRegistrations: 10,
      checkedIn: 7,
      refunded: 5,
      noShows: 1,
    })
  })

  it('returns 404 for a non-existent event', async () => {
    const { prisma } = await import('../../lib/prisma')
    ;(prisma.event.findUnique as any).mockResolvedValue(null)

    const res = await request(app)
      .get('/api/events/evt_missing/stats')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// GET /api/events/:id/registrations
// ---------------------------------------------------------------------------

describe('GET /api/events/:id/registrations', () => {
  it('returns the registration list for an event', async () => {
    const { prisma } = await import('../../lib/prisma')
    const mockRegistrations = [
      {
        id: 'reg_001',
        eventId: 'evt_xyz789',
        status: 'PAID',
        depositAmount: 200000,
        attendee: { name: 'Tunde Adesanya', email: 'tunde@example.com', phone: '08012345678' },
        createdAt: new Date().toISOString(),
      },
    ]
    ;(prisma.event.findUnique as any).mockResolvedValue(mockCreatedEvent)
    ;(prisma.registration.findMany as any).mockResolvedValue(mockRegistrations)

    const res = await request(app)
      .get('/api/events/evt_xyz789/registrations')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].attendee.name).toBe('Tunde Adesanya')
  })

  it('returns 404 for a non-existent event', async () => {
    const { prisma } = await import('../../lib/prisma')
    ;(prisma.event.findUnique as any).mockResolvedValue(null)

    const res = await request(app)
      .get('/api/events/evt_missing/registrations')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(404)
  })
})
