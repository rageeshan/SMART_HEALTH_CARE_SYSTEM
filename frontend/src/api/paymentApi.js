import { paymentClient } from './clients.js'

export const paymentApi = {
  async createStripeCheckout(payload) {
    const { data } = await paymentClient.post('/stripe/checkout', payload)
    return data
  },
  async verifyStripeSession(sessionId) {
    const { data } = await paymentClient.get(`/stripe/session/${sessionId}/verify`)
    return data
  },
  async getMyPayments(patientId) {
    const { data } = await paymentClient.get('/my', {
      params: { patientId },
    })
    return data
  },
  async getAllPayments() {
    const { data } = await paymentClient.get('/')
    return data
  },
  async getFinancialSummary() {
    const { data } = await paymentClient.get('/admin/summary')
    return data
  },
}

