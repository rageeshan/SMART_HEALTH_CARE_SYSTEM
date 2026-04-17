const TOKEN_KEY = 'shcs_token'
const USER_KEY = 'shcs_user'
const PENDING_EMAIL_KEY = 'shcs_pending_email'
const PENDING_ROLE_KEY = 'shcs_pending_role'
const PENDING_REGISTER_DATA_KEY = 'shcs_pending_register_data'

export const storage = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY)
  },
  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  },
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clearUser() {
    localStorage.removeItem(USER_KEY)
  },
  getPendingEmail() {
    return localStorage.getItem(PENDING_EMAIL_KEY)
  },
  setPendingEmail(email) {
    localStorage.setItem(PENDING_EMAIL_KEY, email)
  },
  clearPendingEmail() {
    localStorage.removeItem(PENDING_EMAIL_KEY)
  },
  getPendingRole() {
    return localStorage.getItem(PENDING_ROLE_KEY)
  },
  setPendingRole(role) {
    localStorage.setItem(PENDING_ROLE_KEY, role)
  },
  clearPendingRole() {
    localStorage.removeItem(PENDING_ROLE_KEY)
  },
  getPendingRegisterData() {
    try {
      const raw = sessionStorage.getItem(PENDING_REGISTER_DATA_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  },
  setPendingRegisterData(data) {
    sessionStorage.setItem(PENDING_REGISTER_DATA_KEY, JSON.stringify(data))
  },
  clearPendingRegisterData() {
    sessionStorage.removeItem(PENDING_REGISTER_DATA_KEY)
  },
}

