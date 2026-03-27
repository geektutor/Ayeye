import { Router } from 'express'

import { createEventSchema, updateEventSchema } from '@ayeye/types'
import type { Event } from '@prisma/client'

import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { RefundService } from '../services/refund.service'

const refundService = new RefundService()

const router = Router()

router.post('/', requireAuth, validate(createEventSchema), async (req, res) => {
  try {
    const organizerId = req.user?.userId ?? ''

    const event = await prisma.event.create({
      data: {
        ...req.body,
        date: new Date(req.body.date as string),
        organizerId,
      },
    })

    res.status(201).json({ success: true, data: event })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create event', statusCode: 500 })
  }
})

router.get('/', requireAuth, async (req, res) => {
  try {
    const organizerId = req.user?.userId ?? ''

    const events = await prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: 'desc' },
    })

    const eventsWithCounts = await Promise.all(
      events.map(async (event: Event) => {
        const [totalRegistrations, totalCheckins] = await Promise.all([
          prisma.registration.count({ where: { eventId: event.id, status: { not: 'PAYMENT_FAILED' } } }),
          prisma.registration.count({ where: { eventId: event.id, status: 'CHECKED_IN' } }),
        ])
        return { ...event, totalRegistrations, totalCheckins }
      }),
    )

    res.json({ success: true, data: eventsWithCounts })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch events', statusCode: 500 })
  }
})

// Public endpoint — no auth: list all published/live events for discovery
router.get('/public', async (_req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: { in: ['PUBLISHED', 'LIVE'] } },
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        venue: true,
        depositAmount: true,
        status: true,
        registrationLink: true,
        maxAttendees: true,
      },
      orderBy: { date: 'asc' },
    })
    res.json({ success: true, data: events })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch events', statusCode: 500 })
  }
})

// Public endpoint — no auth: fetch event details by registrationLink for attendee registration page
router.get('/public/:registrationLink', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { registrationLink: req.params['registrationLink'] },
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        venue: true,
        depositAmount: true,
        noShowPolicy: true,
        maxAttendees: true,
        status: true,
        registrationLink: true,
      },
    })

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found', statusCode: 404 })
      return
    }

    res.json({ success: true, data: event })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch event', statusCode: 500 })
  }
})

router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const id = req.params['id'] ?? ''
    const event = await prisma.event.findUnique({ where: { id } })

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found', statusCode: 404 })
      return
    }

    const [totalRegistrations, checkedIn, refunded, noShows] = await Promise.all([
      prisma.registration.count({ where: { eventId: id, status: { not: 'PAYMENT_FAILED' } } }),
      prisma.registration.count({ where: { eventId: id, status: 'CHECKED_IN' } }),
      prisma.registration.count({ where: { eventId: id, status: 'REFUNDED' } }),
      prisma.registration.count({ where: { eventId: id, status: 'NO_SHOW' } }),
    ])

    res.json({ success: true, data: { totalRegistrations, checkedIn, refunded, noShows } })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch event stats', statusCode: 500 })
  }
})

router.get('/:id/registrations', requireAuth, async (req, res) => {
  try {
    const id = req.params['id'] ?? ''
    const event = await prisma.event.findUnique({ where: { id } })

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found', statusCode: 404 })
      return
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId: id },
      include: { attendee: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: registrations })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch registrations', statusCode: 500 })
  }
})

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params['id'] ?? ''
    const event = await prisma.event.findUnique({ where: { id } })

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found', statusCode: 404 })
      return
    }

    res.json({ success: true, data: event })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch event', statusCode: 500 })
  }
})

router.patch('/:id', requireAuth, validate(updateEventSchema), async (req, res) => {
  try {
    const id = req.params['id'] ?? ''
    const organizerId = req.user?.userId ?? ''
    const event = await prisma.event.findUnique({ where: { id } })

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found', statusCode: 404 })
      return
    }

    if (event.organizerId !== organizerId) {
      res.status(403).json({ success: false, error: 'Forbidden', statusCode: 403 })
      return
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...req.body,
        ...(req.body.date && { date: new Date(req.body.date as string) }),
      },
    })

    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update event', statusCode: 500 })
  }
})

router.post('/:id/close', requireAuth, async (req, res) => {
  try {
    const id = req.params['id'] ?? ''
    const organizerId = req.user?.userId ?? ''
    const event = await prisma.event.findUnique({ where: { id } })

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found', statusCode: 404 })
      return
    }

    if (event.organizerId !== organizerId) {
      res.status(403).json({ success: false, error: 'Forbidden', statusCode: 403 })
      return
    }

    if (event.status === 'CLOSED') {
      res.status(400).json({ success: false, error: 'Event is already closed', statusCode: 400 })
      return
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: 'CLOSED' },
    })

    await refundService.processNoShows(id)

    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to close event', statusCode: 500 })
  }
})

router.post('/:id/publish', requireAuth, async (req, res) => {
  try {
    const id = req.params['id'] ?? ''
    const organizerId = req.user?.userId ?? ''
    const event = await prisma.event.findUnique({ where: { id } })

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found', statusCode: 404 })
      return
    }

    if (event.organizerId !== organizerId) {
      res.status(403).json({ success: false, error: 'Forbidden', statusCode: 403 })
      return
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    })

    res.json({ success: true, data: updated })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to publish event', statusCode: 500 })
  }
})

export default router
