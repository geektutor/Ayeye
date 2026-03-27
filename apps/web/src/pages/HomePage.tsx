import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export function HomePage() {
  const { token } = useAuth()

  return (
    <div className="home">
      {/* Navbar */}
      <header className="navbar">
        <span className="navbar__brand">Ayeye</span>
        <nav className="navbar__nav">
          <Link to="/discover" className="navbar__link">Discover</Link>
          {token ? (
            <Link to="/dashboard" className="btn btn--ghost btn--sm">Dashboard</Link>
          ) : (
            <Link to="/login" className="btn btn--ghost btn--sm">Sign in</Link>
          )}
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="hero__inner container">
            <div className="hero__tag">Built for the Enyata × Interswitch Buildathon 2026</div>
            <h1 className="hero__title">
              Events worth<br />
              <span className="hero__title--accent">showing up for</span>
            </h1>
            <p className="hero__subtitle">
              Ayeye lets organisers collect a small refundable deposit at registration.
              Attendees who show up get every kobo back instantly via Paycode.
              No-shows? Their deposit funds what the organiser decides.
            </p>
            <div className="hero__actions">
              <Link to={token ? '/dashboard/events/new' : '/register'} className="btn btn--primary hero__cta">
                Create your event
              </Link>
              <Link to="/discover" className="btn btn--ghost hero__cta">
                Browse events
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="steps">
          <div className="container">
            <h2 className="section-title">How it works</h2>
            <div className="steps__grid">
              <div className="step">
                <div className="step__number">1</div>
                <h3 className="step__title">Create & publish</h3>
                <p className="step__body">
                  Set up your event in minutes. Define the deposit amount, venue,
                  date, and what happens to no-show deposits.
                </p>
              </div>
              <div className="step">
                <div className="step__number">2</div>
                <h3 className="step__title">Attendees commit</h3>
                <p className="step__body">
                  Guests register and pay a small refundable deposit via
                  Interswitch. The deposit secures their spot and signals real intent.
                </p>
              </div>
              <div className="step">
                <div className="step__number">3</div>
                <h3 className="step__title">Show up, get paid back</h3>
                <p className="step__body">
                  On the day, scan the QR code at the door. Attendees who check in
                  receive their full deposit back via Paycode within 60 seconds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features">
          <div className="container">
            <h2 className="section-title">Everything you need to run committed events</h2>
            <div className="features__grid">
              {[
                {
                  icon: '⚡',
                  title: 'Instant refunds',
                  body: 'Paycode delivers deposits back to attendees at the door in under 60 seconds.',
                },
                {
                  icon: '📊',
                  title: 'Live attendance tracking',
                  body: 'Watch registrations and check-ins in real time from your organiser dashboard.',
                },
                {
                  icon: '🔗',
                  title: 'One-click registration link',
                  body: 'Share a single link. Attendees register, pay, and receive their QR code — no app needed.',
                },
                {
                  icon: '🛡',
                  title: 'Flexible no-show policy',
                  body: 'Choose what happens to unclaimed deposits: charity, scholarship fund, redistribution, or your event budget.',
                },
                {
                  icon: '📱',
                  title: 'QR check-in',
                  body: 'One-time-use QR codes expire 2 hours after the event ends, keeping check-in secure.',
                },
                {
                  icon: '🇳🇬',
                  title: 'Built for Nigeria',
                  body: 'Naira deposits, Nigerian phone validation, and Interswitch-powered payments — no FX friction.',
                },
              ].map(({ icon, title, body }) => (
                <div key={title} className="feature">
                  <div className="feature__icon">{icon}</div>
                  <h3 className="feature__title">{title}</h3>
                  <p className="feature__body">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="cta-banner">
          <div className="container">
            <h2 className="cta-banner__title">Ready to run a committed event?</h2>
            <p className="cta-banner__sub">
              Free to set up. No hidden fees. Your attendees only pay the deposit you set.
            </p>
            <Link to={token ? '/dashboard/events/new' : '/register'} className="btn btn--primary hero__cta">
              {token ? 'Create an event' : 'Sign up free'}
            </Link>
          </div>
        </section>
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
