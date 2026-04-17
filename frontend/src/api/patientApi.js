import { patientClient } from './clients.js'

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeProfilePayload(payload = {}) {
  const normalized = { ...payload }
  if ('allergies' in normalized) {
    normalized.allergies = toStringArray(normalized.allergies)
  }
  return normalized
}

function normalizeMedicalHistoryPayload(payload = {}) {
  const normalized = { ...payload }
  if ('medications' in normalized) {
    normalized.medications = toStringArray(normalized.medications)
  }
  return normalized
}

export const patientApi = {
  // Patient self
  async createProfile(payload) {
    const { data } = await patientClient.post(
      '/create',
      normalizeProfilePayload(payload),
    )
    return data
  },
  async getMyProfile() {
    const { data } = await patientClient.get('/me')
    return data
  },
  async updateMyProfile(payload) {
    const { data } = await patientClient.put(
      '/me',
      normalizeProfilePayload(payload),
    )
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
      normalizeMedicalHistoryPayload(payload),
    )
    return data
  },
  async updateMedicalHistory(patientId, recordId, payload) {
    const { data } = await patientClient.put(
      `/${patientId}/medical-history/${recordId}`,
      normalizeMedicalHistoryPayload(payload),
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
    const { data } = await patientClient.put(
      `/admin/${patientId}`,
      normalizeProfilePayload(payload),
    )
    return data
  },
  async adminDeleteProfile(patientId) {
    const { data } = await patientClient.delete(`/admin/${patientId}`)
    return data
  },

  // Reports (patient uploads)
  async uploadReport(payload) {
    const { data } = await patientClient.post('/me/reports', payload)
    return data
  },
  async getMyReports() {
    const { data } = await patientClient.get('/me/reports')
    return data
  },
  async getReport(reportId) {
    const { data } = await patientClient.get(`/me/reports/${reportId}`)
    return data
  },
  async deleteReport(reportId) {
    const { data } = await patientClient.delete(`/me/reports/${reportId}`)
    return data
  },

  // Prescriptions
  async getMyPrescriptions() {
    const { data } = await patientClient.get('/me/prescriptions')
    return data
  },
  async addPrescription(patientId, payload) {
    const { data } = await patientClient.post(`/${patientId}/prescriptions`, payload)
    return data
  },
  async getPatientPrescriptions(patientId) {
    const { data } = await patientClient.get(`/${patientId}/prescriptions`)
    return data
  },
}

