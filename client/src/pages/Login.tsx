
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../features/auth/hooks/useAuth'
import { getApiErrorMessage } from '../services/api'

const Login = () => {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login({ email: email.trim(), password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to sign in. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen bg-[#F8F9F5]">
      <section className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="mb-12 inline-flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#174D38] text-xl font-bold text-white">
              D
            </span>
            <span className="text-2xl font-bold tracking-tight text-[#173D2D]">
              DevTrack
            </span>
          </Link>

          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#6A8B70]">
              Welcome back
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[#173D2D] sm:text-4xl">
              Sign in to your workspace
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#718075]">
              Pick up where your team left off.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#34483A]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#DCE4DA] bg-white px-4 py-3 text-sm text-[#24382B] outline-none transition placeholder:text-[#A1ADA2] focus:border-[#477B58] focus:ring-4 focus:ring-[#477B58]/10"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#34483A]">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-[#DCE4DA] bg-white px-4 py-3 text-sm text-[#24382B] outline-none transition placeholder:text-[#A1ADA2] focus:border-[#477B58] focus:ring-4 focus:ring-[#477B58]/10"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#174D38] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#103D2C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
              {!submitting && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#718075]">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#246443] hover:text-[#174D38]">
              Create one
            </Link>
          </p>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-[#174D38] px-12 py-16 text-white lg:flex lg:w-1/2 lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-40 -left-20 size-120 rounded-full border border-white/10" />

        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C5E78B]">
            Work in sync
          </p>
        </div>

        <div className="relative max-w-lg">
          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Good work happens when everyone moves together.
          </h2>
          <p className="mt-6 max-w-md text-base leading-8 text-white/70">
            Bring projects, tasks and people into one focused workspace.
            Keep your team aligned from the first idea to the final delivery.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm font-medium text-[#D7E9D8]">
            <CheckCircle2 size={19} className="text-[#C5E78B]" />
            One workspace. Clear priorities. Better progress.
          </div>
        </div>

        <p className="relative text-xs text-white/50">
          DevTrack · Teamwork made clearer
        </p>
      </aside>
    </main>
  )
}

export default Login
