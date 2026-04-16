import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthShell } from '../../components/auth/AuthShell.jsx'
import { Alert } from '../../components/ui/Alert.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { roleHomePath } from '../../utils/routes.js'
import { storage } from '../../utils/storage.js'

export function VerifyLoginOtpPage() {
  const { verifyLoginOtp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => ({
    email: storage.getPendingEmail() ?? '',
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

    setSubmitting(true)
    const res = await verifyLoginOtp({
      email: form.email.trim(),
      otp: form.otp.trim(),
    })
    setSubmitting(false)

    if (!res.ok) {
      setError(res.message)
      return
    }

    const role = res.session?.role
    toast.success(res.data?.message ?? 'Login verified.')
    storage.clearPendingEmail()
    navigate(roleHomePath(role), { replace: true })
  }

  return (
    <AuthShell
      title="Verify login OTP"
      subtitle="Enter the OTP sent to your email to complete sign in."
      footer={
        <>
          Back to{' '}
          <Link to="/login" className="font-semibold text-sky-700 hover:text-sky-800">
            Login
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
            'Verify and continue'
          )}
        </Button>
      </form>
    </AuthShell>
  )
}

