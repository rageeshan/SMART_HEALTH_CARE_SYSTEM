import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Clock, Plus, Trash2, Save } from 'lucide-react'
import { patientApi } from '../../api/patientApi.js'
import { doctorApi } from '../../api/doctorApi.js'
import { appointmentApi } from '../../api/appointmentApi.js'
import { telemedicineApi } from '../../api/telemedicineApi.js'
import { getApiErrorMessage, isNotFoundError } from '../../api/error.js'
import { useAuth } from '../../hooks/useAuth.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { getRecentPatients } from '../../utils/doctorRecentPatients.js'
import { getUserDisplayName } from '../../utils/userProfile.js'

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export function DoctorDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [patientId, setPatientId] = useState('')
  const [patients] = useState(() => getRecentPatients())
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [lookupMessage, setLookupMessage] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)

  const [profileLoading, setProfileLoading] = useState(true)
  const [doctorProfile, setDoctorProfile] = useState(null)
  const [availability, setAvailability] = useState([])
  const [availabilityBusy, setAvailabilityBusy] = useState(false)
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '17:00',
  })

  const [appointmentsLoading, setAppointmentsLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [appointmentsBusy, setAppointmentsBusy] = useState(false)
  const [joiningAppointmentId, setJoiningAppointmentId] = useState(null)
  const [endingAppointmentId, setEndingAppointmentId] = useState(null)
  const [rxModal, setRxModal] = useState(null)
  const [rxText, setRxText] = useState('')
  const [nowMs, setNowMs] = useState(() => Date.now())

  const displayName = useMemo(() => {
    return getUserDisplayName(user, 'Doctor')
  }, [user])

  const email = useMemo(() => {
    return (
      user?.email ??
      user?.user?.email ??
      user?.data?.email ??
      null
    )
  }, [user])

  async function loadDoctorProfile() {
    setProfileLoading(true)
    try {
      const res = await doctorApi.getMyProfile()
      setDoctorProfile(res ?? null)
      setAvailability(Array.isArray(res?.availability) ? res.availability : [])
    } catch (err) {
      if (isNotFoundError(err)) {
        setDoctorProfile(null)
        setAvailability([])
      } else {
        toast.error(getApiErrorMessage(err))
      }
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    loadDoctorProfile()
  }, [])

  async function loadAppointments(options = {}) {
    const { silent = false } = options
    setAppointmentsLoading(true)
    try {
      const res = await appointmentApi.getDoctorAppointments()
      const list = res?.data ?? res?.appointments ?? res ?? []
      setAppointments(Array.isArray(list) ? list : [])
    } catch (err) {
      if (!silent) {
        toast.error(getApiErrorMessage(err))
      }
      setAppointments([])
    } finally {
      setAppointmentsLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      loadAppointments({ silent: true })
    }, 10000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  const groupedAvailability = useMemo(() => {
    return DAYS.reduce((acc, day) => {
      acc[day] = availability.filter((s) => s.dayOfWeek === day)
      return acc
    }, {})
  }, [availability])

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients

    return patients.filter((patient) => {
      const haystack = `${patient.fullName ?? ''} ${patient.phone ?? ''} ${
        patient.id ?? ''
      }`.toLowerCase()
      return haystack.includes(q)
    })
  }, [patients, query])

  const PAGE_SIZE = 5
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const visiblePatients = filteredPatients.slice(startIndex, startIndex + PAGE_SIZE)

  async function handlePatientLookup() {
    const term = patientId.trim()
    if (!term) return

    setLookupMessage('')

    const exactIdMatch = patients.find((patient) => patient.id === term)
    if (exactIdMatch) {
      navigate(`/doctor/patients/${encodeURIComponent(exactIdMatch.id)}`)
      return
    }

    const byNameMatches = patients.filter((patient) =>
      String(patient.fullName ?? '').toLowerCase().includes(term.toLowerCase()),
    )

    if (byNameMatches.length === 1) {
      navigate(`/doctor/patients/${encodeURIComponent(byNameMatches[0].id)}`)
      return
    }

    if (byNameMatches.length > 1) {
      setQuery(term)
      setPage(1)
      setLookupMessage(
        `Found ${byNameMatches.length} matches by name. Select the right patient below.`,
      )
      return
    }

    // Validate patient existence before navigation; show popup on miss.
    setIsLookingUp(true)
    try {
      await patientApi.getProfile(term)
      navigate(`/doctor/patients/${encodeURIComponent(term)}`)
    } catch (err) {
      if (isNotFoundError(err)) {
        toast.error('Patient not found.')
      } else {
        toast.error(getApiErrorMessage(err))
      }
    } finally {
      setIsLookingUp(false)
    }
  }

  async function addSlot(e) {
    e?.preventDefault?.()

    if (!newSlot.dayOfWeek || !newSlot.startTime || !newSlot.endTime) {
      toast.error('Please select day, start time and end time.')
      return
    }

    if (newSlot.startTime >= newSlot.endTime) {
      toast.error('End time must be after start time.')
      return
    }

    setAvailabilityBusy(true)
    try {
      // If doctor profile doesn't exist in doctor-service yet, create a minimal one automatically.
      if (!doctorProfile) {
        await doctorApi.createProfile({
          name: displayName,
          specialty: 'General',
          qualifications: [],
          experienceYears: 0,
          contactNumber: '',
          consultationFee: 0,
        })
      }

      await doctorApi.addAvailability(newSlot)
      toast.success('Availability slot added')
      setShowAddSlot(false)
      setNewSlot({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' })
      await loadDoctorProfile()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setAvailabilityBusy(false)
    }
  }

  async function deleteSlot(slotId) {
    setAvailabilityBusy(true)
    try {
      await doctorApi.deleteAvailability(slotId)
      toast.success('Slot removed')
      await loadDoctorProfile()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setAvailabilityBusy(false)
    }
  }

  function statusVariant(status) {
    const s = String(status || '').toUpperCase()
    if (s === 'APPROVED') return 'success'
    if (s === 'REJECTED') return 'danger'
    if (s === 'COMPLETED') return 'info'
    return 'warning'
  }

  function paymentVariant(paymentStatus) {
    const s = String(paymentStatus || 'pending').toLowerCase()
    if (s === 'paid') return 'success'
    if (s === 'failed') return 'danger'
    if (s === 'refunded') return 'info'
    return 'warning'
  }

  function isPatientWaiting(appointment) {
    const requestStatus = String(appointment?.telemedicine?.joinRequestStatus ?? '').toUpperCase()
    if (requestStatus !== 'PENDING') return false

    const patientJoinedAtRaw = appointment?.telemedicine?.patientJoinedAt
    if (!patientJoinedAtRaw) return false

    const patientJoinedAtMs = new Date(patientJoinedAtRaw).getTime()
    if (Number.isNaN(patientJoinedAtMs)) return false

    // Keep "waiting" visible for a short period after patient requests join.
    // If patient does not continue, the UI falls back to normal Join/End actions.
    const WAITING_VISIBILITY_MS = 10 * 60 * 1000
    return nowMs - patientJoinedAtMs <= WAITING_VISIBILITY_MS
  }

  async function setStatus(appointmentId, status) {
    setAppointmentsBusy(true)
    try {
      await appointmentApi.updateStatus(appointmentId, status)
      toast.success(`Appointment ${String(status).toLowerCase()}`)
      await loadAppointments()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setAppointmentsBusy(false)
    }
  }

  async function submitPrescription() {
    if (!rxModal) return
    if (!rxText.trim()) {
      toast.error('Prescription is required')
      return
    }
    setAppointmentsBusy(true)
    try {
      await appointmentApi.issuePrescription(rxModal._id ?? rxModal.id, rxText.trim())
      toast.success('Prescription issued')
      setRxModal(null)
      setRxText('')
      await loadAppointments()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setAppointmentsBusy(false)
    }
  }

  async function joinCall(appointment) {
    const appointmentId = appointment?._id ?? appointment?.id
    if (!appointmentId) return

    setJoiningAppointmentId(appointmentId)
    try {
      await appointmentApi.markDoctorJoin(appointmentId)
      const session = await telemedicineApi.joinSession(appointmentId)
      const meetingUrl =
        session?.meetingUrl ?? appointment?.telemedicine?.meetingUrl ?? null
      if (!meetingUrl) {
        toast.error('Meeting link not available.')
        return
      }
      window.open(meetingUrl, '_blank', 'noopener,noreferrer')
      await loadAppointments()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setJoiningAppointmentId(null)
    }
  }

  async function endCall(appointment) {
    const appointmentId = appointment?._id ?? appointment?.id
    if (!appointmentId) return

    setEndingAppointmentId(appointmentId)
    try {
      await telemedicineApi.endSession(appointmentId)
      toast.success('Call ended')
      await loadAppointments()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setEndingAppointmentId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="text-sm font-semibold text-slate-900">Welcome</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            Dr. {displayName}
          </div>
          {email ? (
            <div className="mt-1 text-sm text-slate-600">{email}</div>
          ) : null}
          <div className="mt-2 text-sm text-slate-600">
            Use patient lookup to view profiles and manage medical history records.
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Appointments</div>
              <div className="text-xs text-slate-500">
                Approve, reject, and issue prescriptions.
              </div>
            </div>
            <Button
              variant="outline"
              onClick={loadAppointments}
              disabled={appointmentsLoading || appointmentsBusy}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {appointmentsLoading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : appointments.length === 0 ? (
            <EmptyState
              title="No appointments yet"
              description="When patients book you, requests will appear here."
            />
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => {
                const id = a._id ?? a.id
                const patientWaiting = isPatientWaiting(a)
                const dateLabel = a.date
                  ? new Date(a.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'

                return (
                  <div
                    key={id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          Patient ID: {a.patientId}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {dateLabel} · {a.timeSlot}
                        </div>
                        {a.symptoms ? (
                          <div className="mt-2 text-sm text-slate-700">
                            <span className="font-semibold">Symptoms:</span> {a.symptoms}
                          </div>
                        ) : null}
                        {a.telemedicine?.meetingUrl ? (
                          String(a.status ?? '').toUpperCase() === 'COMPLETED' ? (
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Call finished
                              </span>
                            </div>
                          ) : (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {patientWaiting ? (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                                  Patient is waiting to join
                                </span>
                              ) : null}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => joinCall(a)}
                                disabled={joiningAppointmentId === id}
                              >
                                {joiningAppointmentId === id
                                  ? 'Joining…'
                                  : patientWaiting
                                    ? 'Accept & join call'
                                    : 'Join call'}
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => endCall(a)}
                                disabled={endingAppointmentId === id}
                              >
                                {endingAppointmentId === id ? 'Ending…' : 'End call'}
                              </Button>
                            </div>
                          )
                        ) : null}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={statusVariant(a.status)}>
                          {String(a.status ?? 'PENDING')}
                        </Badge>
                        <Badge variant={paymentVariant(a.paymentStatus)}>
                          Payment: {String(a.paymentStatus ?? 'pending').toUpperCase()}
                        </Badge>
                        <div className="flex flex-wrap gap-2">
                          {String(a.status ?? '').toUpperCase() === 'PENDING' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setStatus(id, 'APPROVED')}
                                disabled={appointmentsBusy}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setStatus(id, 'REJECTED')}
                                disabled={appointmentsBusy}
                              >
                                Reject
                              </Button>
                            </>
                          ) : null}

                          {String(a.status ?? '').toUpperCase() === 'APPROVED' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRxModal(a)
                                setRxText(a.prescription ?? '')
                              }}
                              disabled={appointmentsBusy}
                            >
                              Issue prescription
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Availability (time slots)
              </div>
              <div className="text-xs text-slate-500">
                Set your weekly schedule so patients can book.
              </div>
            </div>
            <Button
              onClick={() => setShowAddSlot(true)}
              disabled={availabilityBusy || profileLoading}
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add slot
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {profileLoading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : (
            <div className="space-y-4">
              {!doctorProfile ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Your doctor profile is not created in the doctor service yet. When you add your first slot,
                  we’ll create it automatically.
                </div>
              ) : null}
              {availability.length === 0 ? (
                <EmptyState
                  title="No availability yet"
                  description="Add at least one slot (e.g., Monday 09:00–12:00) so patients can book you."
                />
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {DAYS.map((day) => {
                  const slots = groupedAvailability[day] ?? []
                  return (
                    <div
                      key={day}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="text-sm font-semibold text-slate-900">{day}</div>
                      {slots.length === 0 ? (
                        <div className="mt-2 text-sm text-slate-500">No slots</div>
                      ) : (
                        <div className="mt-3 flex flex-col gap-2">
                          {slots.map((slot) => (
                            <div
                              key={slot._id}
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                              <div className="flex items-center gap-2 text-sm text-slate-700">
                                <Clock className="h-4 w-4 text-slate-500" />
                                <span>
                                  {slot.startTime} – {slot.endTime}
                                </span>
                              </div>
                              <button
                                className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/60 disabled:opacity-50"
                                onClick={() => deleteSlot(slot._id)}
                                disabled={availabilityBusy}
                                title="Remove"
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={showAddSlot}
        title="Add availability slot"
        onClose={() => (availabilityBusy ? null : setShowAddSlot(false))}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddSlot(false)}
              disabled={availabilityBusy}
            >
              Cancel
            </Button>
            <Button onClick={addSlot} disabled={availabilityBusy}>
              <span className="inline-flex items-center gap-2">
                <Save className="h-4 w-4" />
                {availabilityBusy ? 'Saving…' : 'Save slot'}
              </span>
            </Button>
          </div>
        }
      >
        <form onSubmit={addSlot} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Day of week
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
              value={newSlot.dayOfWeek}
              onChange={(e) =>
                setNewSlot((s) => ({ ...s, dayOfWeek: e.target.value }))
              }
              disabled={availabilityBusy}
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Start time"
              name="startTime"
              type="time"
              value={newSlot.startTime}
              onChange={(e) =>
                setNewSlot((s) => ({ ...s, startTime: e.target.value }))
              }
              disabled={availabilityBusy}
              required
            />
            <Input
              label="End time"
              name="endTime"
              type="time"
              value={newSlot.endTime}
              onChange={(e) =>
                setNewSlot((s) => ({ ...s, endTime: e.target.value }))
              }
              disabled={availabilityBusy}
              required
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(rxModal)}
        title="Issue prescription"
        onClose={() => (appointmentsBusy ? null : setRxModal(null))}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRxModal(null)}
              disabled={appointmentsBusy}
            >
              Cancel
            </Button>
            <Button onClick={submitPrescription} disabled={appointmentsBusy}>
              {appointmentsBusy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        {rxModal ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-slate-900">
                Appointment · {rxModal.timeSlot}
              </div>
              <div className="text-xs text-slate-600">
                Patient ID: {rxModal.patientId}
              </div>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Prescription
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                rows={4}
                value={rxText}
                onChange={(e) => setRxText(e.target.value)}
                placeholder="Medications, dosage, instructions…"
              />
            </label>
          </div>
        ) : null}
      </Modal>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-slate-900">Patient lookup</div>
          <div className="text-xs text-slate-500">
            Search by patient ID or patient name.
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Input
              label="Patient ID or name"
              name="patientId"
              placeholder="e.g., 66123abc... or Ramesh"
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value)
                setLookupMessage('')
              }}
            />
            <Button
              className="w-full sm:w-auto"
              onClick={handlePatientLookup}
              disabled={isLookingUp}
            >
              {isLookingUp ? 'Searching…' : 'Search'}
            </Button>
          </div>
          {lookupMessage ? (
            <p className="mt-3 text-sm font-medium text-sky-700">{lookupMessage}</p>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Recent patients directory
              </div>
              <div className="text-xs text-slate-500">
                Since the current backend does not expose a doctor patient-list
                endpoint, this list is built from patients you have already
                opened in the doctor workflow.
              </div>
            </div>
            <div className="w-full sm:w-72">
              <Input
                name="patientQuery"
                placeholder="Search by patient name"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {visiblePatients.length === 0 ? (
            <EmptyState
              title={patients.length ? 'No patients match this search' : 'No patients yet'}
              description={
                patients.length
                  ? 'Try a different name or open a patient by ID.'
                  : 'Open a patient by ID once, and they will appear here for quick access.'
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                {visiblePatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">
                          {patient.fullName}
                        </div>
                        {patient.bloodGroup ? (
                          <Badge variant="danger">{patient.bloodGroup}</Badge>
                        ) : null}
                        {patient.gender ? (
                          <Badge variant="info">{patient.gender}</Badge>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Patient ID: {patient.id}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {patient.phone || 'No phone available'}
                      </div>
                    </div>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() =>
                        navigate(`/doctor/patients/${encodeURIComponent(patient.id)}`)
                      }
                    >
                      Open patient
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="text-sm text-slate-600">
                  Showing {visiblePatients.length} of {filteredPatients.length} patients
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {safePage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

