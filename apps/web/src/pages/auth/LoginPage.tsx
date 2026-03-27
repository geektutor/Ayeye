import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { loginSchema, type LoginInput } from '@ayeye/types'

import { useLogin } from '../../hooks/useAuthMutations'
import { ApiRequestError } from '../../lib/api'

export function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const loginMutation = useLogin()

  const onSubmit = async (data: LoginInput) => {
    await loginMutation.mutateAsync(data)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">
          <h1>Ayeye</h1>
          <p>Commitment-fee event platform</p>
        </div>

        <h2 className="auth-card__title">Sign in as organizer</h2>

        {loginMutation.isError && (
          <div className="alert alert--error">
            {loginMutation.error instanceof ApiRequestError
              ? loginMutation.error.message
              : 'Login failed. Please try again.'}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit(onSubmit)}>
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
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && <p className="form__error">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={isSubmitting || loginMutation.isPending}
          >
            {isSubmitting || loginMutation.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-card__footer">
          No account?{' '}
          <Link to="/register" className="link">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
