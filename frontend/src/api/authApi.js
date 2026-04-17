import { authClient } from './clients.js'

export const authApi = {
  async register(payload) {
    const { data } = await authClient.post('/register', payload)
    return data
  },
  async verifyRegisterOtp(payload) {
    const { data } = await authClient.post('/verify-register-otp', payload)
    return data
  },
  async login(payload) {
    const { data } = await authClient.post('/login', payload)
    return data
  },
  async verifyLoginOtp(payload) {
    const { data } = await authClient.post('/verify-login-otp', payload)
    return data
  },

  // Admin
  async getUsers() {
    const { data } = await authClient.get('/admin/users')
    return data
  },
  async getUser(userId) {
    const { data } = await authClient.get(`/admin/users/${userId}`)
    return data
  },
  async toggleUserStatus(userId) {
    const { data } = await authClient.patch(`/admin/users/${userId}/toggle-status`)
    return data
  },
  async verifyDoctor(userId) {
    const { data } = await authClient.patch(`/admin/users/${userId}/verify-doctor`)
    return data
  },
  async updateUser(userId, payload) {
    const { data } = await authClient.put(`/admin/users/${userId}`, payload)
    return data
  },
  // Patient-accessible
  async getDoctors() {
    const { data } = await authClient.get('/doctors')
    return data
  },
}

