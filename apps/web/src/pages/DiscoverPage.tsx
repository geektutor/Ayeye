import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { usePublicEvents } from '../hooks/useEvents'

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-US')}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function DiscoverPage() {
  const { token } = useAuth()
  const { data: events, isLoading, error } = usePublicEvents()

  const count = events?.length ?? 0

  return (
    <div className="home">
      <header className="navbar">
        <Link to="/" className="navbar__brand" style={{ textDecoration: 'none' }}>Ayeye</Link>
        <nav className="navbar__nav">
          <Link to="/discover" className="navbar__link navbar__link--active">Discover</Link>
          {token ? (
            <Link to="/dashboard" className="btn btn--ghost btn--sm">Dashboard</Link>
          ) : (
            <Link to="/login" className="btn btn--ghost btn--sm">Sign in</Link>
          )}
        </nav>
      </header>

      {/* Page banner */}
      <div className="discover-banner">
        <div className="container discover-banner__inner">
          <div>
            <h1 className="discover-banner__title">Discover events</h1>
            <p className="discover-banner__sub">
              Register, pay a refundable deposit, show up — get every kobo back instantly.
            </p>
          </div>
          {token && (
            <Link to="/dashboard/events/new" className="btn btn--primary">+ Create event</Link>
          )}
        </div>
      </div>

      <main className="container discover-main">
        {/* Result count */}
        {!isLoading && !error && events && (
          <p className="discover-count">
            {count === 0 ? 'No upcoming events' : `${count} upcoming event${count !== 1 ? 's' : ''}`}
          </p>
        )}

        {isLoading && (
          <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        )}

        {error && (
          <div className="alert alert--error">Failed to load events. Please try again.</div>
        )}

        {events && events.length === 0 && (
          <div className="discover-empty">
            <div className="discover-empty__graphic">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="8" y="16" width="64" height="56" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2"/>
                <rect x="8" y="16" width="64" height="16" rx="6" fill="#dbeafe" stroke="#bfdbfe" strokeWidth="2"/>
                <rect x="24" y="8" width="6" height="14" rx="3" fill="#3b82f6"/>
                <rect x="50" y="8" width="6" height="14" rx="3" fill="#3b82f6"/>
                <circle cx="40" cy="52" r="12" fill="#fff" stroke="#bfdbfe" strokeWidth="2"/>
                <path d="M35 52l4 4 7-7" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="discover-empty__title">No events scheduled yet</h2>
            <p className="discover-empty__body">
              Be the first to create a committed event on Ayeye.<br />
              Set a refundable deposit — only serious attendees will register.
            </p>
            <div className="discover-empty__actions">
              {token ? (
                <Link to="/dashboard/events/new" className="btn btn--primary">Create the first event</Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn--primary">Create an event</Link>
                  <Link to="/login" className="btn btn--ghost">Sign in</Link>
                </>
              )}
            </div>
          </div>
        )}

        {events && events.length > 0 && (
          <div className="discover-grid">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.registrationLink}/register`}
                className="discover-card"
              >
                <div className="discover-card__header">
                  <span className={`badge ${event.status === 'LIVE' ? 'badge--live' : 'badge--upcoming'}`}>
                    {event.status === 'LIVE' ? 'Live' : 'Upcoming'}
                  </span>
                  <span className="discover-card__deposit">{formatNaira(event.depositAmount)} deposit</span>
                </div>
                <h3 className="discover-card__name">{event.name}</h3>
                <p className="discover-card__meta">📍 {event.venue}</p>
                <p className="discover-card__meta">🗓 {formatDate(event.date)}</p>
                <div className="discover-card__footer">
                  <span className="discover-card__cta">Register →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="home-footer">
        <div className="container">
          <span className="navbar__brand">Ayeye</span>
          <p className="home-footer__copy">© 2026 Ayeye. Built for the Enyata × Interswitch Buildathon.</p>
        </div>
      </footer>
    </div>
  )
}
