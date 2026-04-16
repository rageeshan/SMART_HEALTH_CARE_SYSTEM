import { patientClient } from './clients.js'

export const patientApi = {
  // Patient self
  async createProfile(payload) {
    const { data } = await patientClient.post('/create', payload)
    return data
  },
  async getMyProfile() {
    const { data } = await patientClient.get('/me')
    return data
  },
  async updateMyProfile(payload) {
    const { data } = await patientClient.put('/me', payload)
    return data
  },
  async getMyMedicalHistory() {
    const { data } = await patientClient.get('/me/medical-history')
    return data
  },

  // By patientId (doctor/admin)
  async getProfile(patientId) {
    const { data } = await patientClient.get(`/${patientId}`)
    return data
  },
  async getMedicalHistory(patientId) {
    const { data } = await patientClient.get(`/${patientId}/medical-history`)
    return data
  },
  async addMedicalHistory(patientId, payload) {
    const { data } = await patientClient.post(
      `/${patientId}/medical-history`,
      payload,
    )
    return data
  },
  async updateMedicalHistory(patientId, recordId, payload) {
    const { data } = await patientClient.put(
      `/${patientId}/medical-history/${recordId}`,
      payload,
    )
    return data
  },
  async deleteMedicalHistory(patientId, recordId) {
    const { data } = await patientClient.delete(
      `/${patientId}/medical-history/${recordId}`,
    )
    return data
  },

  // Admin (profile mgmt)
  async adminUpdateProfile(patientId, payload) {
    const { data } = await patientClient.put(`/admin/${patientId}`, payload)
    return data
  },
  async adminDeleteProfile(patientId) {
    const { data } = await patientClient.delete(`/admin/${patientId}`)
    return data
  },
}

