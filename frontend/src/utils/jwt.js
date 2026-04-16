import { jwtDecode } from 'jwt-decode'

export function decodeJwt(token) {
  try {
    return jwtDecode(token)
  } catch {
    return null
  }
}

export function isJwtExpired(token) {
  const payload = decodeJwt(token)
  if (!payload?.exp) return false
  return Date.now() >= payload.exp * 1000
}

