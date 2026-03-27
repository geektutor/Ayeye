export interface EventCardEvent {
  id: string
  name: string
  date: string
  venue: string
  depositAmount: number // kobo
  totalRegistrations: number
  totalCheckins: number
  status: 'UPCOMING' | 'LIVE' | 'CLOSED' | 'DRAFT'
}

interface EventCardProps {
  event: EventCardEvent
  onClick?: () => void
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-US')}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function attendanceRate(checkins: number, registrations: number) {
  if (registrations === 0) return 0
  return Math.round((checkins / registrations) * 100)
}

const STATUS_LABEL: Record<EventCardEvent['status'], string> = {
  UPCOMING: 'Upcoming',
  LIVE: 'Live',
  CLOSED: 'Closed',
  DRAFT: 'Draft',
}

const STATUS_CLASS: Record<EventCardEvent['status'], string> = {
  UPCOMING: 'badge badge--upcoming',
  LIVE: 'badge badge--live',
  CLOSED: 'badge badge--closed',
  DRAFT: 'badge badge--draft',
}

const CARD_STATUS_CLASS: Record<EventCardEvent['status'], string> = {
  UPCOMING: 'event-card--upcoming',
  LIVE: 'event-card--live',
  CLOSED: 'event-card--closed',
  DRAFT: 'event-card--draft',
}

export function EventCard({ event, onClick }: EventCardProps) {
  const rate = attendanceRate(event.totalCheckins, event.totalRegistrations)

  return (
    <div
      className={`event-card ${CARD_STATUS_CLASS[event.status]}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="event-card__header">
        <h3 className="event-card__name">{event.name}</h3>
        <span className={STATUS_CLASS[event.status]}>{STATUS_LABEL[event.status]}</span>
      </div>

      <p className="event-card__meta">📍 {event.venue}</p>
      <p className="event-card__meta">🗓 {formatDate(event.date)}</p>

      <div className="event-card__stats">
        <div className="stat">
          <span className="stat__value">{event.totalRegistrations}</span>
          <span className="stat__label">Registered</span>
        </div>
        <div className="stat">
          <span className="stat__value">{event.totalCheckins}</span>
          <span className="stat__label">Checked in</span>
        </div>
        <div className="stat">
          <span className="stat__value">{rate}%</span>
          <span className="stat__label">Attendance</span>
        </div>
        <div className="stat">
          <span className="stat__value">{formatNaira(event.depositAmount)}</span>
          <span className="stat__label">Deposit</span>
        </div>
      </div>
    </div>
  )
}
