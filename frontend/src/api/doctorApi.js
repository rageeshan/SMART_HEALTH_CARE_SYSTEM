import { doctorClient } from './clients.js'

export const doctorApi = {
  async getDoctors(params = {}) {
    const { data } = await doctorClient.get('/', { params })
    return data
  },
  async getDoctor(doctorId) {
    const { data } = await doctorClient.get(`/${doctorId}`)
    return data
  },
  async getMyProfile() {
    const { data } = await doctorClient.get('/me')
    return data
  },
  async updateMyProfile(payload) {
    const { data } = await doctorClient.put('/me', payload)
    return data
  },
  async createProfile(payload) {
    const { data } = await doctorClient.post('/', payload)
    return data
  },
  async addAvailability(payload) {
    const { data } = await doctorClient.post('/availability', payload)
    return data
  },
  async deleteAvailability(slotId) {
    const { data } = await doctorClient.delete(`/availability/${slotId}`)
    return data
  },
}

