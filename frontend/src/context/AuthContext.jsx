import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { authApi } from '../api/authApi.js'
import { getApiErrorMessage } from '../api/error.js'
import { decodeJwt, isJwtExpired } from '../utils/jwt.js'
import { storage } from '../utils/storage.js'
import { ROLE } from '../utils/routes.js'
import { AuthContext } from './authContext.js'

function extractToken(payload) {
  return (
    payload?.token ??
    payload?.accessToken ??
    payload?.jwt ??
    payload?.data?.token ??
    payload?.data?.accessToken ??
    null
  )
}

function extractRole(payload, token) {
  const direct =
    payload?.role ??
    payload?.user?.role ??
    payload?.data?.role ??
    payload?.data?.user?.role
  if (direct) return String(direct).toLowerCase()

  const decoded = token ? decodeJwt(token) : null
  const fromJwt = decoded?.role ?? decoded?.user?.role ?? decoded?.userRole
  return fromJwt ? String(fromJwt).toLowerCase() : null
}

function normalizeRole(role) {
  if (!role) return null
  const r = String(role).toLowerCase()
  if (r === ROLE.ADMIN) return ROLE.ADMIN
  if (r === ROLE.DOCTOR) return ROLE.DOCTOR
  if (r === ROLE.PATIENT) return ROLE.PATIENT
  return r
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const existing = storage.getToken()
    if (!existing) return null
    if (isJwtExpired(existing)) {
      storage.clearToken()
      storage.clearUser()
      return null
    }
    return existing
  })

  const [role, setRole] = useState(() => {
    if (!token) return null
    const decoded = decodeJwt(token)
    return normalizeRole(decoded?.role ?? decoded?.user?.role)
  })

  const [user, setUser] = useState(() => {
    if (!token) return null
    const storedUser = storage.getUser()
    if (storedUser) return storedUser
    const decoded = decodeJwt(token)
    return decoded?.user ?? decoded ?? null
  })

  const [isBootstrapping] = useState(false)

  const setSessionFromAuthResponse = useCallback((payload) => {
    const nextToken = extractToken(payload)
    if (!nextToken) return { ok: false, reason: 'missing_token' }

    storage.setToken(nextToken)
    setToken(nextToken)

    const nextRole = normalizeRole(extractRole(payload, nextToken))
    setRole(nextRole)

    const decoded = decodeJwt(nextToken)
    const nextUser =
      payload?.user ?? payload?.data?.user ?? decoded?.user ?? decoded ?? null
    setUser(nextUser)
    if (nextUser) storage.setUser(nextUser)

    return { ok: true, token: nextToken, role: nextRole }
  }, [])

  const logout = useCallback((message) => {
    storage.clearToken()
    storage.clearUser()
    storage.clearPendingEmail()
    storage.clearPendingRole()
    storage.clearPendingRegisterData()
    setToken(null)
    setRole(null)
    setUser(null)
    if (message) toast.success(message)
  }, [])

  const register = useCallback(async (payload) => {
    try {
      const res = await authApi.register(payload)
      storage.setPendingEmail(payload?.email ?? res?.email ?? '')
      if (payload?.role) storage.setPendingRole(String(payload.role).toLowerCase())
      storage.setPendingRegisterData({
        fullName: payload?.fullName ?? '',
        email: payload?.email ?? '',
        password: payload?.password ?? '',
        role: payload?.role ?? '',
      })
      return { ok: true, data: res }
    } catch (err) {
      return { ok: false, message: getApiErrorMessage(err) }
    }
  }, [])

  const verifyRegisterOtp = useCallback(async (payload) => {
    try {
      const res = await authApi.verifyRegisterOtp(payload)
      return { ok: true, data: res }
    } catch (err) {
      return { ok: false, message: getApiErrorMessage(err) }
    }
  }, [])

  const login = useCallback(async (payload) => {
    try {
      const res = await authApi.login(payload)
      storage.setPendingEmail(payload?.email ?? res?.email ?? '')
      return { ok: true, data: res }
    } catch (err) {
      return { ok: false, message: getApiErrorMessage(err) }
    }
  }, [])

  const verifyLoginOtp = useCallback(
    async (payload) => {
      try {
        const res = await authApi.verifyLoginOtp(payload)
        const session = setSessionFromAuthResponse(res)
        if (!session.ok) {
          return { ok: false, message: 'Login succeeded but token missing.' }
        }
        return { ok: true, data: res, session }
      } catch (err) {
        return { ok: false, message: getApiErrorMessage(err) }
      }
    },
    [setSessionFromAuthResponse],
  )

  const value = useMemo(
    () => ({
      token,
      role,
      user,
      isAuthenticated: Boolean(token),
      isBootstrapping,
      register,
      verifyRegisterOtp,
      login,
      verifyLoginOtp,
      setSessionFromAuthResponse,
      logout,
    }),
    [
      token,
      role,
      user,
      isBootstrapping,
      register,
      verifyRegisterOtp,
      login,
      verifyLoginOtp,
      setSessionFromAuthResponse,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

