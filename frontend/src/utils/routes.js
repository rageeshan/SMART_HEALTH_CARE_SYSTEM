export const ROLE = Object.freeze({
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
})

export const roleHomePath = (role) => {
  switch (role) {
    case ROLE.PATIENT:
      return '/patient/dashboard'
    case ROLE.DOCTOR:
      return '/doctor/dashboard'
    case ROLE.ADMIN:
      return '/admin/dashboard'
    default:
      return '/'
  }
}

