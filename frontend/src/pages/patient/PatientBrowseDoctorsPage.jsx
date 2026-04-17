import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { doctorApi } from '../../api/doctorApi.js'
import { appointmentApi } from '../../api/appointmentApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'

function normalizeDoctors(res) {
  const list = res?.data ?? res?.doctors ?? res ?? []
  return Array.isArray(list) ? list : []
}

export function PatientBrowseDoctorsPage() {
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [booking, setBooking] = useState({
    date: '',
    timeSlot: '',
    symptoms: '',
  })
  const [bookingBusy, setBookingBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await doctorApi.getDoctors()
        setDoctors(normalizeDoctors(res))
      } catch (err) {
        toast.error(getApiErrorMessage(err))
        setDoctors([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return doctors
    return doctors.filter((d) =>
      `${d.name ?? ''} ${d.specialty ?? ''}`.toLowerCase().includes(q),
    )
  }, [doctors, query])

  async function submitBooking() {
    if (!selected) return
    if (!booking.date || !booking.timeSlot || !booking.symptoms.trim()) {
      toast.error('Please select date, time, and symptoms.')
      return
    }
    setBookingBusy(true)
    try {
      await appointmentApi.book({
        doctorId: selected._id ?? selected.id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        symptoms: booking.symptoms,
      })
      toast.success('Appointment request submitted')
      setSelected(null)
      setBooking({ date: '', timeSlot: '', symptoms: '' })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBookingBusy(false)
    }
  }

  if (loading) return <LoadingScreen title="Loading doctors…" />

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Browse doctors</div>
              <div className="text-xs text-slate-500">
                All verified, active doctors on the platform.
              </div>
            </div>
            <div className="w-full sm:w-72">
              <Input
                name="query"
                placeholder="Search by name or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {filtered.length === 0 ? (
            <EmptyState
              title="No doctors found"
              description={doctors.length ? 'Try a different search.' : 'No doctors are registered yet.'}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d) => {
                const id = d._id ?? d.id
                const initials = (d.name ?? 'D')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()

                return (
                  <div
                    key={id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          Dr. {d.name ?? '—'}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">
                          {d.specialty ?? '—'}
                        </div>
                        {typeof d.consultationFee === 'number' ? (
                          <div className="mt-2 text-xs text-slate-600">
                            Fee: <span className="font-semibold">LKR {d.consultationFee}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <Button onClick={() => setSelected(d)} className="w-full">
                      Book appointment
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={Boolean(selected)}
        title="Book appointment"
        onClose={() => (bookingBusy ? null : setSelected(null))}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelected(null)} disabled={bookingBusy}>
              Cancel
            </Button>
            <Button onClick={submitBooking} disabled={bookingBusy}>
              {bookingBusy ? 'Booking…' : 'Confirm'}
            </Button>
          </div>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-slate-900">Dr. {selected.name}</div>
              <div className="text-xs text-slate-600">{selected.specialty}</div>
            </div>

            <Input
              label="Date"
              name="date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={booking.date}
              onChange={(e) => setBooking((b) => ({ ...b, date: e.target.value }))}
            />

            <label className="block text-sm font-medium text-slate-700">
              Time slot
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                value={booking.timeSlot}
                onChange={(e) => setBooking((b) => ({ ...b, timeSlot: e.target.value }))}
              >
                <option value="">Select a time slot</option>
                <option value="08:00 - 08:30">08:00 – 08:30</option>
                <option value="08:30 - 09:00">08:30 – 09:00</option>
                <option value="09:00 - 09:30">09:00 – 09:30</option>
                <option value="09:30 - 10:00">09:30 – 10:00</option>
                <option value="10:00 - 10:30">10:00 – 10:30</option>
                <option value="10:30 - 11:00">10:30 – 11:00</option>
                <option value="14:00 - 14:30">14:00 – 14:30</option>
                <option value="14:30 - 15:00">14:30 – 15:00</option>
                <option value="15:00 - 15:30">15:00 – 15:30</option>
                <option value="15:30 - 16:00">15:30 – 16:00</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Symptoms
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                rows={3}
                value={booking.symptoms}
                onChange={(e) => setBooking((b) => ({ ...b, symptoms: e.target.value }))}
                placeholder="Briefly describe your symptoms…"
              />
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
