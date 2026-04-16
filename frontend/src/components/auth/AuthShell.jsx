import { Link } from 'react-router-dom'
import { Logo } from '../layout/Logo.jsx'

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-700 via-sky-600 to-emerald-500" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center justify-between">
              <Logo compact />
              <Link to="/" className="text-sm font-medium text-white/90 hover:text-white">
                Back to landing
              </Link>
            </div>
            <div>
              <div className="text-3xl font-bold">Healthcare, simplified.</div>
              <div className="mt-3 max-w-md text-sm text-white/90">
                Secure OTP-based login, role-based dashboards, and patient history
                management — built like a real production portal.
              </div>
            </div>
            <div className="text-xs text-white/80">
              © {new Date().getFullYear()} Smart Health Care System
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <div className="lg:hidden">
                <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                  <span>←</span> Back to landing
                </Link>
              </div>
              <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
            </div>
            {children}
            {footer ? <div className="mt-6 text-sm text-slate-600">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

