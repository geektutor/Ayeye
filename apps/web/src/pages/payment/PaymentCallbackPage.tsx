import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export function PaymentCallbackPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'success' | 'failed' | 'unknown'>('unknown')

  useEffect(() => {
    const responseCode = searchParams.get('responseCode')
    if (responseCode === '00') {
      setStatus('success')
    } else if (responseCode) {
      setStatus('failed')
    }
  }, [searchParams])

  return (
    <div className="page">
      <header className="navbar">
        <span className="navbar__brand">Ayeye</span>
      </header>

      <main className="container container--narrow">
        {status === 'success' && (
          <div className="result-card result-card--success">
            <div className="result-card__icon">✓</div>
            <h2>Registration confirmed!</h2>
            <p>
              Your deposit has been received. You'll get your QR code via email shortly.
            </p>
            <p className="text-muted">Show up on the day — your deposit will be refunded instantly.</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="result-card result-card--error">
            <div className="result-card__icon">✕</div>
            <h2>Payment failed</h2>
            <p>Your payment could not be processed. Please try again.</p>
          </div>
        )}

        {status === 'unknown' && (
          <div className="result-card">
            <h2>Checking payment…</h2>
            <p>Verifying your payment status.</p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/" className="link">
            Back to home
          </Link>
        </div>
      </main>
    </div>
  )
}
