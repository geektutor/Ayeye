import { Link, useParams } from 'react-router-dom'

import { useCloseEvent, useEvent, useEventRegistrations, useEventStats, usePublishEvent } from '../../hooks/useEvents'
import { ApiRequestError } from '../../lib/api'

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge--draft',
  PUBLISHED: 'badge--upcoming',
  LIVE: 'badge--live',
  CLOSED: 'badge--closed',
}

const REG_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CHECKED_IN: 'Checked in',
  REFUNDED: 'Refunded',
  NO_SHOW: 'No-show',
  PAYMENT_FAILED: 'Failed',
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const eventId = id ?? ''

  const { data: event, isLoading: eventLoading } = useEvent(eventId)
  const isLive = event?.status === 'LIVE' || event?.status === 'PUBLISHED'
  const { data: stats } = useEventStats(eventId, isLive)
  const { data: registrations, isLoading: regsLoading } = useEventRegistrations(eventId, isLive)
  const publishMutation = usePublishEvent()
  const closeMutation = useCloseEvent()

  if (eventLoading) {
    return (
      <div className="page">
        <main className="container"><p className="empty-state">Loading…</p></main>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="page">
        <main className="container">
          <div className="alert alert--error">Event not found.</div>
        </main>
      </div>
    )
  }

  const depositNaira = `₦${(event.depositAmount / 100).toLocaleString('en-US')}`
  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })

  return (
    <div className="page">
      <header className="navbar">
        <span className="navbar__brand">Ayeye</span>
        <nav className="navbar__nav">
          <Link to="/dashboard" className="link">← Dashboard</Link>
        </nav>
      </header>

      <main className="container">
        {/* Event header */}
        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 className="page-title" style={{ marginBottom: 0 }}>{event.name}</h1>
              <span className={`badge ${STATUS_BADGE[event.status] ?? 'badge--closed'}`}>
                {event.status}
              </span>
            </div>
            <p className="page-subtitle">{eventDate} · {event.venue}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, flexWrap: 'wrap' }}>
            {event.status === 'DRAFT' && (
              <button
                className="btn btn--primary"
                disabled={publishMutation.isPending}
                onClick={() => publishMutation.mutate(eventId)}
              >
                {publishMutation.isPending ? 'Publishing…' : 'Publish event'}
              </button>
            )}
            {(event.status === 'PUBLISHED' || event.status === 'LIVE') && (
              <button
                className="btn btn--ghost"
                disabled={closeMutation.isPending}
                onClick={() => {
                  if (confirm('Close this event? All remaining paid registrations will be marked as no-shows.')) {
                    closeMutation.mutate(eventId)
                  }
                }}
              >
                {closeMutation.isPending ? 'Closing…' : 'Close event'}
              </button>
            )}
            {event.status !== 'CLOSED' && (
              <Link to={`/dashboard/events/${eventId}/edit`} className="btn btn--ghost">Edit event</Link>
            )}
            <Link to="/checkin" className="btn btn--ghost">Check in attendees</Link>
          </div>
        </div>

        {publishMutation.isError && (
          <div className="alert alert--error">
            {publishMutation.error instanceof ApiRequestError
              ? publishMutation.error.message
              : 'Failed to publish. Please try again.'}
          </div>
        )}

        {closeMutation.isError && (
          <div className="alert alert--error">
            {closeMutation.error instanceof ApiRequestError
              ? closeMutation.error.message
              : 'Failed to close event. Please try again.'}
          </div>
        )}

        {closeMutation.isSuccess && (
          <div className="alert alert--info">
            Event closed. Remaining paid registrations have been marked as no-shows.
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Registered', value: stats?.totalRegistrations ?? 0 },
            { label: 'Checked in', value: stats?.checkedIn ?? 0 },
            { label: 'Refunded', value: stats?.refunded ?? 0 },
            { label: 'No-shows', value: stats?.noShows ?? 0 },
            { label: 'Deposit', value: depositNaira },
          ].map(({ label, value }) => (
            <div key={label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <span style={{ display: 'block', fontSize: '1.75rem', fontWeight: 700 }}>{value}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Registration link */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '0.375rem' }}>Registration link</p>
          <code style={{ wordBreak: 'break-all' }}>
            {window.location.origin}/events/{event.registrationLink}/register
          </code>
        </div>

        {/* Registrations table */}
        <div className="card">
          <div className="card__header">
            <h2>Registrations {registrations ? `(${registrations.length})` : ''}</h2>
          </div>

          {regsLoading && <p className="text-muted">Loading…</p>}

          {registrations && registrations.length === 0 && (
            <p className="text-muted">No registrations yet.</p>
          )}

          {registrations && registrations.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Name', 'Email', 'Phone', 'Status', 'Registered'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--color-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr key={reg.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.625rem 0.75rem' }}>{reg.attendee.name}</td>
                      <td style={{ padding: '0.625rem 0.75rem' }}>{reg.attendee.email}</td>
                      <td style={{ padding: '0.625rem 0.75rem' }}>{reg.attendee.phone ?? '—'}</td>
                      <td style={{ padding: '0.625rem 0.75rem' }}>
                        <span className={`badge ${
                          reg.status === 'CHECKED_IN' || reg.status === 'REFUNDED' ? 'badge--live' :
                          reg.status === 'PAID' ? 'badge--upcoming' :
                          reg.status === 'NO_SHOW' ? 'badge--closed' : 'badge--draft'
                        }`}>
                          {REG_STATUS_LABEL[reg.status] ?? reg.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-muted)' }}>
                        {new Date(reg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
