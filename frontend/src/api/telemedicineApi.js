import { telemedicineClient } from './clients.js'

export const telemedicineApi = {
  async getSession(appointmentId) {
    const { data } = await telemedicineClient.get(`/${appointmentId}`)
    return data
  },
  async joinSession(appointmentId) {
    const { data } = await telemedicineClient.patch(`/${appointmentId}/join`)
    return data
  },
  async endSession(appointmentId) {
    const { data } = await telemedicineClient.patch(`/${appointmentId}/end`)
    return data
  },
}

