import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { appointmentApi } from '../../api/appointmentApi.js'
import { telemedicineApi } from '../../api/telemedicineApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.jsx'
import { Button } from '../../components/ui/Button.jsx'

function normalizeAppointments(res) {
  const list = res?.data ?? res?.appointments ?? res ?? []
  return Array.isArray(list) ? list : []
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

export function PatientAppointmentsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [joiningId, setJoiningId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await appointmentApi.getMyAppointments()
      setAppointments(normalizeAppointments(res))
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function joinCall(appointment) {
    const appointmentId = appointment?._id ?? appointment?.id
    if (!appointmentId) return

    setJoiningId(appointmentId)
    try {
      await appointmentApi.requestPatientJoin(appointmentId)
      const session = await telemedicineApi.joinSession(appointmentId)
      const meetingUrl =
        session?.meetingUrl ?? appointment?.telemedicine?.meetingUrl ?? null

      if (!meetingUrl) {
        toast.error('Meeting link not available yet.')
        return
      }

      window.open(meetingUrl, '_blank', 'noopener,noreferrer')
      toast.success('Join request sent to doctor.')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setJoiningId(null)
    }
  }

  const sorted = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const da = new Date(a?.date ?? 0).getTime()
      const db = new Date(b?.date ?? 0).getTime()
      return db - da
    })
  }, [appointments])

  if (loading) return <LoadingScreen title="Loading appointments…" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-slate-900">My appointments</div>
          <div className="text-xs text-slate-500">
            Track bookings, approvals, and telemedicine links.
          </div>
        </CardHeader>
        <CardBody>
          {sorted.length === 0 ? (
            <EmptyState
              title="No appointments yet"
              description="Book your first appointment from Browse doctors."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((a) => {
                const id = a._id ?? a.id
                const dateLabel = a.date
                  ? new Date(a.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'

                const doctorName =
                  a?.doctorId?.name ?? a?.doctor?.name ?? 'Doctor'
                const doctorEmail =
                  a?.doctorId?.email ?? a?.doctor?.email ?? null
                const isSessionEnded =
                  String(a?.status ?? '').toUpperCase() === 'COMPLETED' ||
                  String(a?.telemedicine?.status ?? '').toLowerCase() === 'ended'

                return (
                  <div
                    key={id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {doctorName}
                        </div>
                        {doctorEmail ? (
                          <div className="truncate text-xs text-slate-500">
                            {doctorEmail}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={statusVariant(a.status)}>
                          {String(a.status ?? 'PENDING')}
                        </Badge>
                        <Badge variant={paymentVariant(a.paymentStatus)}>
                          Payment: {String(a.paymentStatus ?? 'pending').toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-slate-700">
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Date
                        </span>
                        <div className="font-medium text-slate-900">{dateLabel}</div>
                      </div>
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Time
                        </span>
                        <div className="font-medium text-slate-900">
                          {a.timeSlot ?? '—'}
                        </div>
                      </div>
                      {a.symptoms ? (
                        <div className="pt-1 text-sm text-slate-600">
                          <span className="font-semibold">Symptoms:</span> {a.symptoms}
                        </div>
                      ) : null}
                    </div>

                    {/* Pay now shortcut for pending-payment appointments */}
                    {String(a.paymentStatus ?? 'pending').toLowerCase() !== 'paid' &&
                     String(a.status ?? '').toUpperCase() !== 'REJECTED' &&
                     String(a.status ?? '').toUpperCase() !== 'CANCELLED' ? (
                      <button
                        onClick={() => navigate(`/patient/payments?appointmentId=${encodeURIComponent(id)}`)}
                        className="mt-1 w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                      >
                        💳 Complete payment
                      </button>
                    ) : null}

                    {a?.telemedicine?.meetingUrl && isSessionEnded ? (
                      <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                        Session ended
                      </div>
                    ) : null}

                    {a?.telemedicine?.meetingUrl && !isSessionEnded ? (
                      <Button
                        className="mt-auto"
                        onClick={() => joinCall(a)}
                        disabled={joiningId === id}
                      >
                        {joiningId === id ? 'Joining…' : 'Join telemedicine'}
                      </Button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

