import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthShell } from '../../components/auth/AuthShell.jsx'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { roleHomePath } from '../../utils/routes.js'

export function LoginPage() {
  const { login, setSessionFromAuthResponse } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const reason = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('reason')
  }, [location.search])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Please enter email and password.')
      return
    }

    setSubmitting(true)
    const res = await login({ email: form.email.trim(), password: form.password })
    setSubmitting(false)

    if (!res.ok) {
      setError(res.message)
      return
    }

    // If backend returns token directly, finalize session here.
    const session = setSessionFromAuthResponse(res.data)
    if (session.ok) {
      toast.success('Welcome back!')
      navigate(roleHomePath(session.role), { replace: true })
      return
    }

    toast.success(res.data?.message ?? 'OTP sent. Please verify to continue.')
    navigate('/verify-login-otp', { replace: true })
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Login with your credentials, then verify OTP."
      footer={
        <>
          Don’t have an account?{' '}
          <Link to="/register" className="font-semibold text-sky-700 hover:text-sky-800">
            Create one
          </Link>
        </>
      }
    >
      {reason === 'session_expired' ? (
        <Alert variant="warning" title="Session expired" className="mb-4">
          Please sign in again.
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="danger" title="Login failed" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />

        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="h-4 w-4 border-white/40 border-t-white" />
              Signing in…
            </span>
          ) : (
            'Continue'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}

