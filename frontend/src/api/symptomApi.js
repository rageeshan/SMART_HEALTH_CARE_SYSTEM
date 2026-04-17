import { symptomClient } from './clients.js'

export const symptomApi = {
  async check(payload) {
    const { data } = await symptomClient.post('/check', payload)
    return data
  },
  async getHistory(patientId) {
    const { data } = await symptomClient.get('/history', {
      params: { patientId },
    })
    return data
  },
  async getById(id, patientId) {
    const { data } = await symptomClient.get(`/history/${id}`, {
      params: { patientId },
    })
    return data
  },
}

