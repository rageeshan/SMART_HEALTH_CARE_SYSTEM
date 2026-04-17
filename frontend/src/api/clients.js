import { createHttpClient } from './http.js'

export const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL ?? '/api/auth'
export const PATIENT_BASE_URL =
  import.meta.env.VITE_PATIENT_BASE_URL ?? '/api/patients'
export const DOCTOR_BASE_URL =
  import.meta.env.VITE_DOCTOR_BASE_URL ?? '/api/doctors'
export const APPOINTMENT_BASE_URL =
  import.meta.env.VITE_APPOINTMENT_BASE_URL ?? '/api/appointments'

export const authClient = createHttpClient(AUTH_BASE_URL)
export const patientClient = createHttpClient(PATIENT_BASE_URL)
export const doctorClient = createHttpClient(DOCTOR_BASE_URL)
export const appointmentClient = createHttpClient(APPOINTMENT_BASE_URL)

