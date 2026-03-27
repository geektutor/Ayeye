import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'

import { RichTextEditor } from '../../components/RichTextEditor'
import { useEvent, useUpdateEvent } from '../../hooks/useEvents'
import { ApiRequestError } from '../../lib/api'

const editEventFormSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine((val) => new Date(val) > new Date(), { message: 'Event date must be in the future' }),
  venue: z.string().min(1, 'Venue is required'),
  depositAmountNaira: z
    .number({ invalid_type_error: 'Enter a number' })
    .min(500, 'Minimum deposit is ₦500')
    .max(50000, 'Maximum deposit is ₦50,000'),
  noShowPolicy: z.enum(['CHARITY', 'SCHOLARSHIP', 'REDISTRIBUTE', 'EVENT_BUDGET']),
  maxAttendees: z.number().int().positive().optional(),
})

type EditEventFormValues = z.infer<typeof editEventFormSchema>

const NO_SHOW_OPTIONS = [
  { value: 'CHARITY', label: 'Donate to charity' },
  { value: 'SCHOLARSHIP', label: 'Scholarship fund' },
  { value: 'REDISTRIBUTE', label: 'Redistribute to attendees' },
  { value: 'EVENT_BUDGET', label: 'Organiser keeps for future event budget' },
] as const

function toDatetimeLocal(iso: string) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const eventId = id ?? ''
  const navigate = useNavigate()

  const { data: event, isLoading } = useEvent(eventId)
  const updateEvent = useUpdateEvent(eventId)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditEventFormValues>({
    resolver: zodResolver(editEventFormSchema),
    defaultValues: { noShowPolicy: 'CHARITY' },
  })

  // Populate form once event loads
  useEffect(() => {
    if (!event) return
    reset({
      name: event.name,
      description: event.description ?? '',
      date: toDatetimeLocal(event.date),
      venue: event.venue,
      depositAmountNaira: event.depositAmount / 100,
      noShowPolicy: event.noShowPolicy as EditEventFormValues['noShowPolicy'],
      maxAttendees: event.maxAttendees ?? undefined,
    })
  }, [event, reset])

  const onSubmit = async (values: EditEventFormValues) => {
    const { depositAmountNaira, date, ...rest } = values
    await updateEvent.mutateAsync({
      ...rest,
      date: new Date(date).toISOString(),
      depositAmount: depositAmountNaira * 100,
    })
    navigate(`/dashboard/events/${eventId}`)
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

  if (!event) {
    return (
      <div className="page">
        <main className="container container--narrow">
          <div className="alert alert--error">Event not found.</div>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="navbar">
        <span className="navbar__brand">Ayeye</span>
        <nav className="navbar__nav">
          <Link to={`/dashboard/events/${eventId}`} className="link">
            ← Back to event
          </Link>
        </nav>
      </header>

      <main className="container container--narrow">
        <div className="page-header">
          <h1 className="page-title">Edit event</h1>
        </div>

        {updateEvent.isError && (
          <div className="alert alert--error">
            {updateEvent.error instanceof ApiRequestError
              ? updateEvent.error.message
              : 'Failed to update event.'}
          </div>
        )}

        <div className="card">
          <form className="form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form__field">
              <label className="form__label" htmlFor="name">
                Event name
              </label>
              <input
                id="name"
                type="text"
                className={`form__input${errors.name ? ' form__input--error' : ''}`}
                {...register('name')}
              />
              {errors.name && <p className="form__error">{errors.name.message}</p>}
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="description">
                Description <span className="form__optional">(optional)</span>
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Tell attendees what to expect…"
                  />
                )}
              />
            </div>

            <div className="form__row">
              <div className="form__field">
                <label className="form__label" htmlFor="date">
                  Date & time
                </label>
                <input
                  id="date"
                  type="datetime-local"
                  className={`form__input${errors.date ? ' form__input--error' : ''}`}
                  {...register('date')}
                />
                {errors.date && <p className="form__error">{errors.date.message}</p>}
              </div>

              <div className="form__field">
                <label className="form__label" htmlFor="depositAmountNaira">
                  Deposit amount (₦)
                </label>
                <input
                  id="depositAmountNaira"
                  type="number"
                  className={`form__input${errors.depositAmountNaira ? ' form__input--error' : ''}`}
                  min={500}
                  max={50000}
                  {...register('depositAmountNaira', { valueAsNumber: true })}
                />
                {errors.depositAmountNaira && (
                  <p className="form__error">{errors.depositAmountNaira.message}</p>
                )}
              </div>
            </div>

            <div className="form__field">
              <label className="form__label" htmlFor="venue">
                Venue
              </label>
              <input
                id="venue"
                type="text"
                className={`form__input${errors.venue ? ' form__input--error' : ''}`}
                {...register('venue')}
              />
              {errors.venue && <p className="form__error">{errors.venue.message}</p>}
            </div>

            <div className="form__row">
              <div className="form__field">
                <label className="form__label" htmlFor="noShowPolicy">
                  No-show policy
                </label>
                <select
                  id="noShowPolicy"
                  className="form__input form__input--select"
                  {...register('noShowPolicy')}
                >
                  {NO_SHOW_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form__field">
                <label className="form__label" htmlFor="maxAttendees">
                  Max attendees <span className="form__optional">(optional)</span>
                </label>
                <input
                  id="maxAttendees"
                  type="number"
                  className="form__input"
                  placeholder="300"
                  min={1}
                  {...register('maxAttendees', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="form__actions">
              <Link to={`/dashboard/events/${eventId}`} className="btn btn--ghost">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isSubmitting || updateEvent.isPending}
              >
                {isSubmitting || updateEvent.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
