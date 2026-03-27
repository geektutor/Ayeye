import { describe, it, expect } from 'vitest'
import { createEventSchema, registerAttendeeSchema, checkInSchema } from '../schemas'

// ---------------------------------------------------------------------------
// Zod schemas in packages/types are the single source of truth for data shape.
// These tests confirm the validation rules match the PRD requirements.
// ---------------------------------------------------------------------------

describe('createEventSchema', () => {
  const validEvent = {
    name: 'DevFest Lagos 2026',
    description: 'Annual developer festival',
    date: '2026-06-15T09:00:00Z',
    venue: 'Landmark Event Centre, Lagos',
    depositAmount: 200000, // ₦2,000 in kobo — within ₦500–₦50,000 range
    noShowPolicy: 'CHARITY' as const,
    maxAttendees: 300,
  }

  it('accepts a valid event payload', () => {
    const result = createEventSchema.safeParse(validEvent)
    expect(result.success).toBe(true)
  })

  it('rejects depositAmount below ₦500 (50,000 kobo)', () => {
    const result = createEventSchema.safeParse({ ...validEvent, depositAmount: 30000 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('depositAmount')
  })

  it('rejects depositAmount above ₦50,000 (5,000,000 kobo)', () => {
    const result = createEventSchema.safeParse({ ...validEvent, depositAmount: 6000000 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('depositAmount')
  })

  it('rejects a past event date', () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      date: '2020-01-01T00:00:00Z',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('date')
  })

  it('rejects an invalid noShowPolicy value', () => {
    const result = createEventSchema.safeParse({ ...validEvent, noShowPolicy: 'KEEP_IT_ALL' })
    expect(result.success).toBe(false)
  })

  it('rejects empty event name', () => {
    const result = createEventSchema.safeParse({ ...validEvent, name: '' })
    expect(result.success).toBe(false)
  })
})

describe('registerAttendeeSchema', () => {
  const validAttendee = {
    name: 'Tunde Adesanya',
    email: 'tunde@example.com',
    phone: '08012345678',
  }

  it('accepts valid attendee data', () => {
    const result = registerAttendeeSchema.safeParse(validAttendee)
    expect(result.success).toBe(true)
  })

  it('accepts phone numbers with country code +234', () => {
    const result = registerAttendeeSchema.safeParse({
      ...validAttendee,
      phone: '+2348012345678',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = registerAttendeeSchema.safeParse({ ...validAttendee, email: 'not-email' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('email')
  })

  it('rejects phone number with fewer than 11 digits', () => {
    const result = registerAttendeeSchema.safeParse({ ...validAttendee, phone: '0801234' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('phone')
  })

  it('rejects empty name', () => {
    const result = registerAttendeeSchema.safeParse({ ...validAttendee, name: '' })
    expect(result.success).toBe(false)
  })
})

describe('checkInSchema', () => {
  it('accepts a valid registration ID', () => {
    const result = checkInSchema.safeParse({ registrationId: 'reg_abc123' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty registration ID', () => {
    const result = checkInSchema.safeParse({ registrationId: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing registrationId field', () => {
    const result = checkInSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
