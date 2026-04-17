import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { ROLE } from '../../utils/routes.js'
import { cn } from '../../utils/cn.js'
import { Logo } from './Logo.jsx'

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition',
          isActive
            ? 'bg-sky-600 text-white shadow-sm'
            : 'text-slate-700 hover:bg-slate-100',
        )
      }
      end
    >
      <span>{label}</span>
    </NavLink>
  )
}

export function Sidebar({ onClose }) {
  const { role } = useAuth()

  const isPatient = role === ROLE.PATIENT
  const isDoctor = role === ROLE.DOCTOR
  const isAdmin = role === ROLE.ADMIN

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between px-5 py-4">
        <Logo />
        <button
          className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="px-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">
          Signed in as <span className="font-semibold">{role}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        {isPatient ? (
          <div className="space-y-2">
            <div className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Patient
            </div>
            <NavItem to="/patient/dashboard" label="Dashboard" />
            <NavItem to="/patient/doctors" label="Browse doctors" />
            <NavItem to="/patient/appointments" label="My appointments" />
            <NavItem to="/patient/profile/create" label="Create profile" />
            <NavItem to="/patient/profile/edit" label="Edit profile" />
            <NavItem to="/patient/medical-history" label="Medical history" />
            <NavItem to="/patient/reports" label="My reports" />
            <NavItem to="/patient/prescriptions" label="Prescriptions" />
          </div>
        ) : null}

        {isDoctor ? (
          <div className="space-y-2">
            <div className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Doctor
            </div>
            <NavItem to="/doctor/dashboard" label="Dashboard" />
          </div>
        ) : null}

        {isAdmin ? (
          <div className="space-y-2">
            <div className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admin
            </div>
            <NavItem to="/admin/dashboard" label="Dashboard" />
            <NavItem to="/admin/users" label="Users" />
          </div>
        ) : null}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4 text-xs text-slate-500">
        Smart Health Care System © {new Date().getFullYear()}
      </div>
    </aside>
  )
}

