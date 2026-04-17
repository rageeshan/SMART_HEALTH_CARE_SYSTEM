const TOKEN_KEY = 'shcs_token'
const PENDING_EMAIL_KEY = 'shcs_pending_email'
const PENDING_ROLE_KEY = 'shcs_pending_role'

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
}

