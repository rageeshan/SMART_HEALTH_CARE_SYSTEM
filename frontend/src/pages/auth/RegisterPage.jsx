import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthShell } from '../../components/auth/AuthShell.jsx'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'patient',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function validate() {
    if (!form.fullName.trim()) return 'Full name is required.'
    if (!form.email.trim()) return 'Email is required.'
    if (!form.password || form.password.length < 6)
      return 'Password must be at least 6 characters.'
    if (!['patient', 'doctor'].includes(form.role))
      return 'Role must be patient or doctor.'
    return ''
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const v = validate()
    if (v) {
      setError(v)
      return
    }

    setSubmitting(true)
    const res = await register({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    })
    setSubmitting(false)

    if (!res.ok) {
      setError(res.message)
      return
    }

    toast.success(res.data?.message ?? 'OTP sent. Verify to complete registration.')
    navigate('/verify-register-otp', { replace: true })
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register as a patient or doctor, then verify OTP."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-sky-700 hover:text-sky-800">
            Sign in
          </Link>
        </>
      }
    >
      {error ? (
        <Alert variant="danger" title="Registration failed" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Full name"
          name="fullName"
          placeholder="Jane Doe"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
        />
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
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          hint="Use at least 6 characters."
        />
        <Select
          label="Role"
          name="role"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </Select>

        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="h-4 w-4 border-white/40 border-t-white" />
              Creating…
            </span>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}

