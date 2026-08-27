import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function LoginPage() {
  const { session, loading, isConfigured, isLocalDemo, signIn, enterLocalDemo } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const locationState = location.state as { from?: string } | null
  const from =
    locationState?.from && locationState.from !== '/login' ? locationState.from : '/'

  if (!loading && (session || isLocalDemo)) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await signIn(email.trim(), password)
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    navigate(from, { replace: true })
  }

  function handleLocalDemo() {
    enterLocalDemo()
    navigate(from, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-[var(--color-primary)] uppercase">
          Ekem Pharmacy
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
          Manager Control Centre
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Sign in with your manager account to continue.
        </p>

        {!isConfigured && (
          <div
            className="mt-4 border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-3 py-2 text-sm text-[var(--color-warning-text)]"
            role="status"
          >
            Supabase credentials are not configured. Copy <code>.env.example</code> to{' '}
            <code>.env.local</code> and add your project URL and anon key, or continue in local
            demonstration mode.
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email</span>
            <input
              type="email"
              autoComplete="username"
              required
              disabled={!isConfigured || submitting}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:opacity-60"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              disabled={!isConfigured || submitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)] disabled:opacity-60"
            />
          </label>

          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!isConfigured || submitting}
            className="w-full bg-[var(--color-primary)] px-4 py-2.5 font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {!isConfigured && (
          <button
            type="button"
            onClick={handleLocalDemo}
            className="mt-4 w-full border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)]"
          >
            Continue in local demonstration mode
          </button>
        )}
      </div>
    </div>
  )
}
