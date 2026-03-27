import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EventCard } from '../../components/EventCard'

// ---------------------------------------------------------------------------
// EventCard renders a summary of an event on the organizer dashboard
// and the public event listing page.
// ---------------------------------------------------------------------------

const mockEvent = {
  id: 'evt_xyz789',
  name: 'DevFest Lagos 2026',
  date: '2026-06-15T09:00:00Z',
  venue: 'Landmark Event Centre, Lagos',
  depositAmount: 200000, // kobo
  totalRegistrations: 150,
  totalCheckins: 89,
  status: 'UPCOMING' as const,
}

describe('EventCard', () => {
  it('renders event name, venue, and date', () => {
    render(<EventCard event={mockEvent} />)

    expect(screen.getByText('DevFest Lagos 2026')).toBeInTheDocument()
    expect(screen.getByText(/Landmark Event Centre/)).toBeInTheDocument()
    // Date formatted for Nigerian locale
    expect(screen.getByText(/June 15, 2026/)).toBeInTheDocument()
  })

  it('displays deposit amount formatted as Naira', () => {
    render(<EventCard event={mockEvent} />)

    // ₦200,000 kobo → ₦2,000
    expect(screen.getByText('₦2,000')).toBeInTheDocument()
  })

  it('shows registration and check-in counts', () => {
    render(<EventCard event={mockEvent} />)

    expect(screen.getByText('150')).toBeInTheDocument() // registrations
    expect(screen.getByText('89')).toBeInTheDocument()  // check-ins
  })

  it('shows UPCOMING badge for future events', () => {
    render(<EventCard event={mockEvent} />)

    expect(screen.getByText('Upcoming')).toBeInTheDocument()
  })

  it('shows LIVE badge for events happening today', () => {
    render(<EventCard event={{ ...mockEvent, status: 'LIVE' }} />)

    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('shows attendance rate percentage', () => {
    render(<EventCard event={mockEvent} />)

    // 89/150 ≈ 59%
    expect(screen.getByText(/59%/)).toBeInTheDocument()
  })

  it('shows 0% attendance when there are no registrations', () => {
    render(<EventCard event={{ ...mockEvent, totalRegistrations: 0, totalCheckins: 0 }} />)

    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})
