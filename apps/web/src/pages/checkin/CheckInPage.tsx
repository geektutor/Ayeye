import { zodResolver } from '@hookform/resolvers/zod'
import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { checkInSchema, type CheckInInput } from '@ayeye/types'

import { useCheckIn } from '../../hooks/useRegistration'
import { ApiRequestError } from '../../lib/api'

interface CheckInResult {
  registrationId: string
  paycode: string
  message: string
}

type Mode = 'scan' | 'manual'

export function CheckInPage() {
  const [mode, setMode] = useState<Mode>('scan')
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const checkInMutation = useCheckIn()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckInInput>({ resolver: zodResolver(checkInSchema) })

  const handleCheckIn = async (registrationId: string) => {
    const res = await checkInMutation.mutateAsync(registrationId)
    setResult(res.data)
    reset()
  }

  const onSubmit = async (data: CheckInInput) => {
    await handleCheckIn(data.registrationId)
  }

  // Start QR scanner
  useEffect(() => {
    if (mode !== 'scan') return

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner
    setScanning(true)
    setScanError(null)

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop()
          setScanning(false)
          try {
            await handleCheckIn(decodedText)
          } catch {
            // error handled by mutation state
          }
        },
        undefined,
      )
      .catch(() => {
        setScanError('Camera access denied. Use manual entry instead.')
        setScanning(false)
      })

    return () => {
      if (scannerRef.current?.isScanning) {
        void scannerRef.current.stop().catch(() => {})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const resetAll = () => {
    setResult(null)
    setScanError(null)
    checkInMutation.reset()
    setMode('scan')
  }

  return (
    <div className="page">
      <header className="navbar">
        <span className="navbar__brand">Ayeye</span>
        <nav className="navbar__nav">
          <Link to="/dashboard" className="link">← Dashboard</Link>
        </nav>
      </header>

      <main className="container container--narrow">
        <div className="page-header">
          <div>
            <h1 className="page-title">Check in attendee</h1>
            <p className="page-subtitle">Scan the attendee's QR code or enter their registration ID</p>
          </div>
        </div>

        {result && (
          <div className="result-card result-card--success" style={{ marginBottom: '1.5rem' }}>
            <div className="result-card__icon">✓</div>
            <h2>Checked in!</h2>
            <p>Paycode sent to attendee's email.</p>
            <p style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.1em', margin: '0.75rem 0' }}>
              {result.paycode}
            </p>
            <button className="btn btn--primary" onClick={resetAll}>
              Check in another
            </button>
          </div>
        )}

        {!result && (
          <>
            {/* Mode tabs */}
            <div className="checkin-tabs">
              <button
                className={`checkin-tab${mode === 'scan' ? ' checkin-tab--active' : ''}`}
                onClick={() => setMode('scan')}
              >
                📷 Scan QR
              </button>
              <button
                className={`checkin-tab${mode === 'manual' ? ' checkin-tab--active' : ''}`}
                onClick={() => setMode('manual')}
              >
                ⌨️ Manual entry
              </button>
            </div>

            {checkInMutation.isError && (
              <div className="alert alert--error" style={{ marginBottom: '1rem' }}>
                {checkInMutation.error instanceof ApiRequestError
                  ? checkInMutation.error.message
                  : 'Check-in failed. Please try again.'}
              </div>
            )}

            {mode === 'scan' && (
              <div className="card">
                {scanError ? (
                  <div className="alert alert--error">{scanError}</div>
                ) : (
                  <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                    {scanning ? 'Point camera at attendee QR code…' : 'Starting camera…'}
                  </p>
                )}
                <div id="qr-reader" style={{ width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden' }} />
              </div>
            )}

            {mode === 'manual' && (
              <div className="card">
                <form className="form" onSubmit={handleSubmit(onSubmit)}>
                  <div className="form__field">
                    <label className="form__label" htmlFor="registrationId">
                      Registration ID
                    </label>
                    <input
                      id="registrationId"
                      type="text"
                      className={`form__input${errors.registrationId ? ' form__input--error' : ''}`}
                      placeholder="e.g. clxyz123abc"
                      {...register('registrationId')}
                    />
                    {errors.registrationId && (
                      <p className="form__error">{errors.registrationId.message}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn btn--primary btn--full"
                    disabled={isSubmitting || checkInMutation.isPending}
                  >
                    {isSubmitting || checkInMutation.isPending ? 'Processing…' : 'Check in & issue refund'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
