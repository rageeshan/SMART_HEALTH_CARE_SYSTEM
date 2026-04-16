import { createHttpClient } from './http.js'

export const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL ?? '/api/auth'
export const PATIENT_BASE_URL =
  import.meta.env.VITE_PATIENT_BASE_URL ?? '/api/patients'

export const authClient = createHttpClient(AUTH_BASE_URL)
export const patientClient = createHttpClient(PATIENT_BASE_URL)

