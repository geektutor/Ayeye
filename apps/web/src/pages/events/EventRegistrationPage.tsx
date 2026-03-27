import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import type { RegisterAttendeeInput } from '@ayeye/types'

import { RegisterForm } from '../../components/RegisterForm'
import { usePublicEvent } from '../../hooks/useEvents'
import { useRegisterAttendee } from '../../hooks/useRegistration'
import { ApiRequestError } from '../../lib/api'

export function EventRegistrationPage() {
  const { registrationLink } = useParams<{ registrationLink: string }>()
  const { data: event, isLoading, error } = usePublicEvent(registrationLink ?? '')
  const registerMutation = useRegisterAttendee(registrationLink ?? '')
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)

  const handleSubmit = async (data: RegisterAttendeeInput) => {
    const res = await registerMutation.mutateAsync(data)
    setPaymentUrl(res.data.paymentUrl)
    // Redirect to Interswitch payment page
    window.location.href = res.data.paymentUrl
  }

  if (isLoading) {
    return (
      <div className="page">
        <main className="container container--narrow">
          <p className="empty-state">Loading event…</p>
        </main>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="page">
        <main className="container container--narrow">
          <div className="alert alert--error">Event not found.</div>
        </main>
      </div>
    )
  }

  if (event.status !== 'PUBLISHED' && event.status !== 'LIVE') {
    return (
      <div className="page">
        <main className="container container--narrow">
          <div className="alert alert--info">This event is not open for registration.</div>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="navbar">
        <Link to="/" className="navbar__brand" style={{ textDecoration: 'none' }}>Ayeye</Link>
      </header>

      <main className="container container--narrow">
        <div className="event-hero">
          <h1 className="event-hero__name">{event.name}</h1>
          <p className="event-hero__meta">
            {new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'UTC',
            })}
          </p>
          <p className="event-hero__meta">{event.venue}</p>
          {event.description && (
            <div
              className="event-hero__description prose"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          )}
        </div>

        <div className="card">
          <div className="card__header">
            <h2>Register</h2>
            <p className="text-muted">
              Pay a{' '}
              <strong>₦{(event.depositAmount / 100).toLocaleString('en-US')} refundable deposit</strong>{' '}
              to secure your spot. Show up and get it back instantly.
            </p>
          </div>

          {registerMutation.isError && (
            <div className="alert alert--error">
              {registerMutation.error instanceof ApiRequestError
                ? registerMutation.error.message
                : 'Registration failed. Please try again.'}
            </div>
          )}

          <RegisterForm event={event} onSubmit={handleSubmit} />
        </div>
      </main>
    </div>
  )
}
