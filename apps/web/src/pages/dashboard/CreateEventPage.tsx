import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { RichTextEditor } from '../../components/RichTextEditor'
import { ApiRequestError } from '../../lib/api'
import { useCreateEvent } from '../../hooks/useEvents'

// Form schema: depositAmount entered as Naira (number), converted to kobo on submit
const createEventFormSchema = z.object({
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

type CreateEventFormValues = z.infer<typeof createEventFormSchema>

const NO_SHOW_OPTIONS = [
  { value: 'CHARITY', label: 'Donate to charity' },
  { value: 'SCHOLARSHIP', label: 'Scholarship fund' },
  { value: 'REDISTRIBUTE', label: 'Redistribute to attendees' },
  { value: 'EVENT_BUDGET', label: 'Organiser keeps for future event budget' },
] as const

function toDatetimeLocalMin() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

export function CreateEventPage() {
  const navigate = useNavigate()
  const createEvent = useCreateEvent()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: { noShowPolicy: 'CHARITY' },
  })

  const onSubmit = async (values: CreateEventFormValues) => {
    const { depositAmountNaira, date, ...rest } = values
    await createEvent.mutateAsync({
      ...rest,
      date: new Date(date).toISOString(),
      depositAmount: depositAmountNaira * 100, // kobo
    })
    navigate('/dashboard')
  }

  return (
    <div className="page">
      <header className="navbar">
        <span className="navbar__brand">Ayeye</span>
        <nav className="navbar__nav">
          <Link to="/dashboard" className="link">
            ← Dashboard
          </Link>
        </nav>
      </header>

      <main className="container container--narrow">
        <div className="page-header">
          <h1 className="page-title">Create event</h1>
        </div>

        {createEvent.isError && (
          <div className="alert alert--error">
            {createEvent.error instanceof ApiRequestError
              ? createEvent.error.message
              : 'Failed to create event.'}
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
                placeholder="DevFest Lagos 2026"
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
                  min={toDatetimeLocalMin()}
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
                  placeholder="2000"
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
                placeholder="Landmark Event Centre, Lagos"
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
              <Link to="/dashboard" className="btn btn--ghost">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isSubmitting || createEvent.isPending}
              >
                {isSubmitting || createEvent.isPending ? 'Creating…' : 'Create event'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
