import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { appointmentApi } from '../../api/appointmentApi.js'
import { paymentApi } from '../../api/paymentApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { useAuth } from '../../hooks/useAuth.js'
import { Button } from '../../components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { Input } from '../../components/ui/Input.jsx'

function normalizeAppointments(res) {
  const list = res?.data ?? res?.appointments ?? res ?? []
  return Array.isArray(list) ? list : []
}

export function PatientPaymentsPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [appointments, setAppointments] = useState([])
  const [payments, setPayments] = useState([])
  const [amountMap, setAmountMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState(null)

  const patientId = useMemo(
    () => user?.id ?? user?._id ?? user?.userId ?? null,
    [user],
  )
  const email = useMemo(() => user?.email ?? user?.user?.email ?? '', [user])
  const fullName = useMemo(
    () => user?.fullName ?? user?.name ?? user?.user?.fullName ?? 'Patient',
    [user],
  )
  const targetAppointmentId = searchParams.get('appointmentId')

  async function load() {
    if (!patientId) return
    setLoading(true)
    try {
      const [appointmentsRes, paymentsRes] = await Promise.all([
        appointmentApi.getMyAppointments(),
        paymentApi.getMyPayments(patientId),
      ])
      const appts = normalizeAppointments(appointmentsRes)
      setAppointments(appts)
      setPayments(Array.isArray(paymentsRes) ? paymentsRes : [])
      setAmountMap((prev) => {
        const next = { ...prev }
        appts.forEach((a) => {
          const id = a._id ?? a.id
          if (!(id in next)) next[id] = '2500'
        })
        return next
      })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setAppointments([])
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [patientId])

  function isPaid(appointmentId) {
    return payments.some(
      (p) =>
        String(p.appointmentId) === String(appointmentId) &&
        String(p.status).toLowerCase() === 'completed',
    )
  }

  const sortedAppointments = useMemo(() => {
    const list = [...appointments]
    if (!targetAppointmentId) return list
    return list.sort((a, b) => {
      const aId = String(a?._id ?? a?.id ?? '')
      const bId = String(b?._id ?? b?.id ?? '')
      if (aId === targetAppointmentId) return -1
      if (bId === targetAppointmentId) return 1
      return 0
    })
  }, [appointments, targetAppointmentId])

  async function payNow(appt) {
    const appointmentId = appt._id ?? appt.id
    const amount = Number(amountMap[appointmentId] ?? 0)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid payment amount.')
      return
    }
    if (!patientId || !email) {
      toast.error('Missing user details. Please sign in again.')
      return
    }

    const doctorId = appt.doctorId?._id ?? appt.doctorId
    setPayingId(appointmentId)
    try {
      const payload = {
        appointmentId: String(appointmentId),
        doctorId: String(doctorId),
        patientId: String(patientId),
        amount,
        firstName: fullName.split(' ')[0] || 'Patient',
        lastName: fullName.split(' ').slice(1).join(' ') || 'User',
        email,
        phone: '0000000000',
        address: 'N/A',
        city: 'N/A',
      }
      const res = await paymentApi.createStripeCheckout(payload)
      if (!res?.checkoutUrl) {
        toast.error('Checkout URL not received')
        return
      }
      window.location.assign(res.checkoutUrl)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setPayingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="text-sm text-slate-600">Loading payments…</div>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-slate-900">Payments</div>
          <div className="text-xs text-slate-500">
            Complete appointment payments securely using Stripe checkout.
          </div>
        </CardHeader>
        <CardBody>
          {appointments.length === 0 ? (
            <EmptyState
              title="No appointments yet"
              description="Book appointments first, then pay from here."
            />
          ) : (
            <div className="space-y-3">
              {sortedAppointments.map((a) => {
                const id = a._id ?? a.id
                const paid = isPaid(id)
                return (
                  <div
                    key={id}
                    className={`rounded-2xl border bg-white p-4 shadow-sm ${
                      String(id) === String(targetAppointmentId)
                        ? 'border-sky-300 ring-2 ring-sky-100'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          Appointment {id}
                        </div>
                        <div className="text-xs text-slate-500">
                          {a.date ? new Date(a.date).toLocaleDateString() : '—'} · {a.timeSlot ?? '—'}
                        </div>
                      </div>
                      <div
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          paid
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {paid ? 'Paid' : 'Pending'}
                      </div>
                    </div>

                    {!paid ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-[180px_auto] sm:items-end">
                        <Input
                          label="Amount (LKR)"
                          name={`amount-${id}`}
                          type="number"
                          min="1"
                          value={amountMap[id] ?? ''}
                          onChange={(e) =>
                            setAmountMap((m) => ({ ...m, [id]: e.target.value }))
                          }
                        />
                        <Button
                          onClick={() => payNow(a)}
                          disabled={payingId === id}
                          className="w-full sm:w-auto"
                        >
                          {payingId === id ? 'Redirecting…' : 'Pay now'}
                        </Button>
                      </div>
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

