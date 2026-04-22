import { appointmentClient } from './clients.js'

export const appointmentApi = {
  async book(payload) {
    const { data } = await appointmentClient.post('/', payload)
    return data
  },
  async getMyAppointments() {
    const { data } = await appointmentClient.get('/patient')
    return data
  },
  async getDoctorAppointments() {
    const { data } = await appointmentClient.get('/doctor')
    return data
  },
  async updateStatus(appointmentId, status) {
    const { data } = await appointmentClient.patch(`/${appointmentId}/status`, { status })
    return data
  },
  async issuePrescription(appointmentId, prescription) {
    const { data } = await appointmentClient.patch(`/${appointmentId}/prescription`, { prescription })
    return data
  },
  async requestPatientJoin(appointmentId) {
    const { data } = await appointmentClient.patch(`/${appointmentId}/telemedicine/patient-join-request`)
    return data
  },
  async markDoctorJoin(appointmentId) {
    const { data } = await appointmentClient.patch(`/${appointmentId}/telemedicine/doctor-join`)
    return data
  },
}

