export function getUserDisplayName(user, fallback = 'User') {
  const direct =
    user?.fullName ??
    user?.name ??
    user?.username ??
    user?.userName ??
    user?.displayName ??
    user?.full_name ??
    user?.user?.fullName ??
    user?.user?.name ??
    user?.profile?.fullName ??
    user?.profile?.name

  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim()
  }

  const firstName = user?.firstName ?? user?.first_name
  const lastName = user?.lastName ?? user?.last_name
  const joined = [firstName, lastName].filter(Boolean).join(' ').trim()
  if (joined) return joined

  return fallback
}

