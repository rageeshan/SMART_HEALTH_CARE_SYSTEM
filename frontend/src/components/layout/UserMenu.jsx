import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { Button } from '../ui/Button.jsx'
import { Badge } from '../ui/Badge.jsx'
import { getUserDisplayName } from '../../utils/userProfile.js'

function initials(nameOrEmail) {
  const s = String(nameOrEmail ?? '').trim()
  if (!s) return 'U'
  const parts = s.split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase()).join('')
}

export function UserMenu() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const displayName = useMemo(() => {
    return getUserDisplayName(user, user?.email ?? user?.sub ?? 'User')
  }, [user])

  const avatarText = initials(displayName)

  return (
    <div className="relative">
      <button
        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm hover:bg-slate-50"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
          {avatarText}
        </div>
        <div className="hidden text-left sm:block">
          <div className="text-sm font-semibold text-slate-900">
            {displayName}
          </div>
          <div className="text-xs text-slate-500">
            <Badge variant="info">{String(role ?? 'user')}</Badge>
          </div>
        </div>
      </button>

      {open ? (
        <>
          <button
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">
                {displayName}
              </div>
              <div className="text-xs text-slate-500">
                {user?.email ?? user?.sub ?? ''}
              </div>
            </div>
            <div className="border-t border-slate-200 p-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false)
                  navigate('/')
                }}
              >
                Landing page
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-rose-700 hover:bg-rose-50"
                onClick={() => {
                  setOpen(false)
                  logout('Logged out')
                  navigate('/login')
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

