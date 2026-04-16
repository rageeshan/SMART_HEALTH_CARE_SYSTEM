import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { roleHomePath } from '../utils/routes.js'
import { LoadingScreen } from '../components/ui/LoadingScreen.jsx'

export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) return <LoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function PublicRoute() {
  const { isAuthenticated, role, isBootstrapping } = useAuth()
  if (isBootstrapping) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to={roleHomePath(role)} replace />
  return <Outlet />
}

export function RoleProtectedRoute({ allowedRoles = [] }) {
  const { role, isBootstrapping, isAuthenticated } = useAuth()

  if (isBootstrapping) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  const allowed = allowedRoles.map((r) => String(r).toLowerCase())
  if (allowed.length && !allowed.includes(String(role ?? '').toLowerCase())) {
    return <Navigate to={roleHomePath(role)} replace />
  }

  return <Outlet />
}

