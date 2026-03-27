import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { registerAttendeeSchema, type RegisterAttendeeInput } from '@ayeye/types'

interface RegisterFormEvent {
  id: string
  name: string
  depositAmount: number // kobo
}

interface RegisterFormProps {
  event: RegisterFormEvent
  onSubmit: (data: RegisterAttendeeInput) => Promise<void> | void
}

export function RegisterForm({ event, onSubmit }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterAttendeeInput>({
    resolver: zodResolver(registerAttendeeSchema),
  })

  const depositNaira = `₦${(event.depositAmount / 100).toLocaleString('en-US')}`

  return (
    <form className="form" onSubmit={handleSubmit((data) => onSubmit(data))}>
      <div className="form__field">
        <label className="form__label" htmlFor="name">
          Full Name
        </label>
        <input
          id="name"
          className={`form__input${errors.name ? ' form__input--error' : ''}`}
          type="text"
          placeholder="Tunde Adesanya"
          {...register('name')}
        />
        {errors.name && <p className="form__error">{errors.name.message}</p>}
      </div>

      <div className="form__field">
        <label className="form__label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className={`form__input${errors.email ? ' form__input--error' : ''}`}
          type="text"
          placeholder="tunde@example.com"
          {...register('email')}
        />
        {errors.email && <p className="form__error">{errors.email.message}</p>}
      </div>

      <div className="form__field">
        <label className="form__label" htmlFor="phone">
          Phone Number
        </label>
        <input
          id="phone"
          className={`form__input${errors.phone ? ' form__input--error' : ''}`}
          type="tel"
          placeholder="08012345678"
          {...register('phone')}
        />
        {errors.phone && <p className="form__error">{errors.phone.message}</p>}
      </div>

      <button className="btn btn--primary btn--full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? `Pay ${depositNaira}…` : `Pay ${depositNaira} deposit`}
      </button>
    </form>
  )
}
