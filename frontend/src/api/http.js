import axios from 'axios'
import toast from 'react-hot-toast'
import { storage } from '../utils/storage.js'
import { isJwtExpired } from '../utils/jwt.js'

function attachAuth(config) {
  const token = storage.getToken()
  if (!token) return config

  if (isJwtExpired(token)) {
    storage.clearToken()
    return config
  }

  config.headers = config.headers ?? {}
  config.headers.Authorization = `Bearer ${token}`
  return config
}

function handleUnauthorizedOnce() {
  storage.clearToken()
  storage.clearPendingEmail()

  // Avoid toast loops on navigation / multiple failing requests.
  if (!window.__shcs_unauthorized_shown) {
    window.__shcs_unauthorized_shown = true
    toast.error('Your session expired. Please sign in again.')
  }

  if (window.location.pathname !== '/login') {
    window.location.assign('/login?reason=session_expired')
  }
}

export function createHttpClient(baseURL) {
  const client = axios.create({
    baseURL,
    timeout: 20000,
    headers: { 'Content-Type': 'application/json' },
  })

  client.interceptors.request.use(attachAuth)

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      const status = err?.response?.status
      if (status === 401) {
        handleUnauthorizedOnce()
      }
      return Promise.reject(err)
    },
  )

  return client
}

