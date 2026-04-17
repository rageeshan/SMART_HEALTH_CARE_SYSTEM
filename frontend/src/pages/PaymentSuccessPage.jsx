import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { paymentApi } from '../api/paymentApi.js'

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [payment, setPayment] = useState(null)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }

    ;(async () => {
      try {
        const res = await paymentApi.verifyStripeSession(sessionId)
        setPayment(res?.payment ?? null)
        setStatus(res?.status === 'completed' ? 'success' : 'error')
      } catch {
        setStatus('error')
      }
    })()
  }, [sessionId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {status === 'verifying' && (
          <div className="rounded-3xl bg-white shadow-xl p-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-sky-100 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Verifying your payment…</h1>
            <p className="mt-2 text-sm text-slate-500">Please wait while we confirm your transaction.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="rounded-3xl bg-white shadow-xl p-8 text-center">
            {/* Success icon */}
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">Payment Successful!</h1>
            <p className="mt-2 text-sm text-slate-500">
              Your appointment has been confirmed. A receipt has been sent to your email.
            </p>

            {payment && (
              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount paid</span>
                  <span className="font-semibold text-slate-900">
                    {payment.currency ?? 'LKR'} {Number(payment.amount ?? 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment ID</span>
                  <span className="font-mono text-xs text-slate-700 truncate max-w-[180px]">{payment._id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Completed
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => navigate('/patient/appointments')}
                className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                View my appointments
              </button>
              <button
                onClick={() => navigate('/patient/payments')}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View payment history
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-3xl bg-white shadow-xl p-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Payment Verification Failed</h1>
            <p className="mt-2 text-sm text-slate-500">
              We couldn't verify your payment. If money was deducted, it will be refunded within 3–5 business days.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => navigate('/patient/payments')}
                className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
              >
                Try payment again
              </button>
              <button
                onClick={() => navigate('/patient/dashboard')}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Go to dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
