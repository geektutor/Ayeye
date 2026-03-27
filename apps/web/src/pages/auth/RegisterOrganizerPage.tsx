import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { createOrganizerSchema, type CreateOrganizerInput } from '@ayeye/types'

import { useRegisterOrganizer } from '../../hooks/useAuthMutations'
import { ApiRequestError } from '../../lib/api'

export function RegisterOrganizerPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrganizerInput>({ resolver: zodResolver(createOrganizerSchema) })

  const registerMutation = useRegisterOrganizer()

  const onSubmit = async (data: CreateOrganizerInput) => {
    await registerMutation.mutateAsync(data)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">
          <h1>Ayeye</h1>
          <p>Commitment-fee event platform</p>
        </div>

        <h2 className="auth-card__title">Create organizer account</h2>

        {registerMutation.isError && (
          <div className="alert alert--error">
            {registerMutation.error instanceof ApiRequestError
              ? registerMutation.error.message
              : 'Registration failed. Please try again.'}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form__field">
            <label className="form__label" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              className={`form__input${errors.name ? ' form__input--error' : ''}`}
              placeholder="Chisom Okafor"
              {...register('name')}
            />
            {errors.name && <p className="form__error">{errors.name.message}</p>}
          </div>

          <div className="form__field">
            <label className="form__label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className={`form__input${errors.email ? ' form__input--error' : ''}`}
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && <p className="form__error">{errors.email.message}</p>}
          </div>

          <div className="form__field">
            <label className="form__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`form__input${errors.password ? ' form__input--error' : ''}`}
              placeholder="At least 8 characters"
              {...register('password')}
            />
            {errors.password && <p className="form__error">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={isSubmitting || registerMutation.isPending}
          >
            {isSubmitting || registerMutation.isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
