const STORAGE_KEY = 'shcs_doctor_recent_patients'

function readPatients() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writePatients(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getRecentPatients() {
  return readPatients()
}

export function saveRecentPatient(profile, patientId) {
  if (!patientId || !profile) return

  const next = {
    id: patientId,
    fullName: profile.fullName ?? 'Unknown patient',
    phone: profile.phone ?? '',
    bloodGroup: profile.bloodGroup ?? '',
    gender: profile.gender ?? '',
    updatedAt: new Date().toISOString(),
  }

  const items = readPatients().filter((item) => item.id !== patientId)
  items.unshift(next)
  writePatients(items)
}

