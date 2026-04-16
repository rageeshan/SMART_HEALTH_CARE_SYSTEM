export function coerceBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y', 'verified', 'approved'].includes(s)) return true
    if (['false', '0', 'no', 'n', 'unverified', 'pending'].includes(s))
      return false
  }
  return null
}

export function getUserRole(user) {
  return String(user?.role ?? '').toLowerCase()
}

export function getUserActive(user) {
  const direct =
    coerceBoolean(user?.isActive) ??
    coerceBoolean(user?.active) ??
    coerceBoolean(user?.enabled)
  if (direct !== null) return direct

  const status = user?.status
  if (typeof status === 'string') {
    const s = status.toLowerCase()
    if (s.includes('active')) return true
    if (s.includes('inactive') || s.includes('deactivate')) return false
  }

  return true
}

export function getDoctorVerified(user) {
  const direct =
    coerceBoolean(user?.isDoctorVerified) ??
    coerceBoolean(user?.doctorVerified) ??
    coerceBoolean(user?.isVerifiedDoctor) ??
    coerceBoolean(user?.verifiedDoctor) ??
    coerceBoolean(user?.verified) ??
    coerceBoolean(user?.isVerified) ??
    coerceBoolean(user?.doctor?.verified) ??
    coerceBoolean(user?.doctor?.isVerified)

  if (direct !== null) return direct

  const status = user?.status
  if (typeof status === 'string') {
    const s = status.toLowerCase()
    if (s.includes('verified') || s.includes('approved')) return true
    if (s.includes('pending') || s.includes('unverified')) return false
  }

  return false
}

export function normalizeUpdatedUser(res) {
  return res?.user ?? res?.data ?? res?.patient ?? res?.doctor ?? res ?? null
}

