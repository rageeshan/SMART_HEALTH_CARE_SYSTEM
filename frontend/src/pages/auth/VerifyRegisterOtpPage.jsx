import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthShell } from '../../components/auth/AuthShell.jsx'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { storage } from '../../utils/storage.js'

export function VerifyRegisterOtpPage() {
  const { verifyRegisterOtp } = useAuth()
  const navigate = useNavigate()
  const pendingRegisterData = storage.getPendingRegisterData()
  const [form, setForm] = useState(() => ({
    email: storage.getPendingEmail() ?? pendingRegisterData?.email ?? '',
    role: storage.getPendingRole() ?? pendingRegisterData?.role ?? '',
    otp: '',
  }))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email.trim() || !form.otp.trim()) {
      setError('Email and OTP are required.')
      return
    }

    if (
      !pendingRegisterData?.fullName?.trim() ||
      !pendingRegisterData?.password?.trim()
    ) {
      setError('Registration session expired. Please register again.')
      return
    }

    setSubmitting(true)
    const payload = {
      fullName: pendingRegisterData.fullName,
      email: form.email.trim(),
      password: pendingRegisterData.password,
      otp: form.otp.trim(),
    }
    if (form.role) payload.role = String(form.role).toLowerCase()

    const res = await verifyRegisterOtp(payload)
    setSubmitting(false)

    if (!res.ok) {
      setError(res.message)
      return
    }

    toast.success(res.data?.message ?? 'Registration verified. Please login.')
    storage.clearPendingEmail()
    storage.clearPendingRole()
    storage.clearPendingRegisterData()
    navigate('/login', { replace: true })
  }

  return (
    <AuthShell
      title="Verify registration OTP"
      subtitle="Enter the OTP sent to your email to activate your account."
      footer={
        <>
          Back to{' '}
          <Link to="/register" className="font-semibold text-sky-700 hover:text-sky-800">
            Register
          </Link>
        </>
      }
    >
      {error ? (
        <Alert variant="danger" title="Verification failed" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <Input
          label="OTP"
          name="otp"
          inputMode="numeric"
          placeholder="Enter 6-digit OTP"
          value={form.otp}
          onChange={(e) => setForm((f) => ({ ...f, otp: e.target.value }))}
        />
        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="h-4 w-4 border-white/40 border-t-white" />
              Verifying…
            </span>
          ) : (
            'Verify'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}

