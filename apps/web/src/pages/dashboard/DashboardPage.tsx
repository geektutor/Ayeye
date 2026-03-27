import { Link, useNavigate } from 'react-router-dom'

import { EventCard, type EventCardEvent } from '../../components/EventCard'
import { useAuth } from '../../context/AuthContext'
import { useEvents, type ApiEvent } from '../../hooks/useEvents'

function toEventCardStatus(event: ApiEvent): EventCardEvent['status'] {
  if (event.status === 'LIVE') return 'LIVE'
  if (event.status === 'CLOSED') return 'CLOSED'
  if (event.status === 'DRAFT') return 'DRAFT'
  // PUBLISHED with future date → UPCOMING
  return 'UPCOMING'
}

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { data: events, isLoading, error } = useEvents()
  const navigate = useNavigate()

  return (
    <div className="page">
      <header className="navbar">
        <span className="navbar__brand">Ayeye</span>
        <nav className="navbar__nav">
          <span className="navbar__user">{user?.name}</span>
          <button className="btn btn--ghost btn--sm" onClick={logout}>
            Sign out
          </button>
        </nav>
      </header>

      <main className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Your events</h1>
            <p className="page-subtitle">
              {events && events.length > 0
                ? `${events.length} event${events.length !== 1 ? 's' : ''} · manage registrations and attendance`
                : 'Manage registrations and track attendance'}
            </p>
          </div>
          <Link to="/dashboard/events/new" className="btn btn--primary">
            + Create event
          </Link>
        </div>

        {isLoading && (
          <div className="loading-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        )}

        {error && (
          <div className="alert alert--error">Failed to load events. Please refresh.</div>
        )}

        {events && events.length === 0 && (
          <div className="empty-state">
            <p>No events yet.</p>
            <Link to="/dashboard/events/new" className="btn btn--primary">
              Create your first event
            </Link>
          </div>
        )}

        {events && events.length > 0 && (
          <div className="event-grid">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  id: event.id,
                  name: event.name,
                  date: event.date,
                  venue: event.venue,
                  depositAmount: event.depositAmount,
                  totalRegistrations: event.totalRegistrations ?? 0,
                  totalCheckins: event.totalCheckins ?? 0,
                  status: toEventCardStatus(event),
                }}
                onClick={() => navigate(`/dashboard/events/${event.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
