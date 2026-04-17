import { useNavigate } from 'react-router-dom'

export function PaymentCancelPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white shadow-xl p-8 text-center">
          {/* Cancel icon */}
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Payment Cancelled</h1>
          <p className="mt-2 text-sm text-slate-500">
            You cancelled the payment. Your appointment is still pending — you can complete payment anytime from your payments page.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => navigate('/patient/payments')}
              className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
            >
              Complete payment
            </button>
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
