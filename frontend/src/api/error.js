export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message ??
    fallback

  if (Array.isArray(msg)) return msg.join(', ')
  if (typeof msg === 'string') return msg
  return fallback
}

