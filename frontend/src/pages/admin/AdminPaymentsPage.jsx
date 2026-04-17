import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { paymentApi } from '../../api/paymentApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.jsx'
import { Table, TBody, TD, TH, THead, TR } from '../../components/ui/Table.jsx'

function asArray(data) {
  return Array.isArray(data) ? data : []
}

function statusVariant(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'completed') return 'success'
  if (s === 'failed') return 'danger'
  if (s === 'refunded') return 'info'
  return 'warning'
}

export function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [payments, setPayments] = useState([])
  const [query, setQuery] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [summaryRes, allRes] = await Promise.all([
        paymentApi.getFinancialSummary(),
        paymentApi.getAllPayments(),
      ])
      setSummary(summaryRes ?? null)
      setPayments(asArray(allRes))
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setSummary(null)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return payments
    return payments.filter((p) =>
      `${p._id ?? ''} ${p.appointmentId ?? ''} ${p.patientId ?? ''} ${p.doctorId ?? ''} ${p.status ?? ''} ${p.currency ?? ''}`
        .toLowerCase()
        .includes(q),
    )
  }, [payments, query])

  if (loading) return <LoadingScreen title="Loading payment details…" />

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total revenue
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              LKR {Number(summary?.totalRevenue ?? 0).toFixed(2)}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Completed transactions
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {summary?.totalTransactions ?? 0}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total payment records
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {payments.length}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Payment details</div>
              <div className="text-xs text-slate-500">
                Every payment attempted by patients.
              </div>
            </div>
            <div className="w-full sm:w-80">
              <Input
                name="paymentQuery"
                placeholder="Search by payment/appointment/patient/doctor/status..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {filtered.length === 0 ? (
            <EmptyState
              title="No payments found"
              description="Try a different search query."
            />
          ) : (
            <Table>
              <THead>
                <TH>Payment ID</TH>
                <TH>Appointment ID</TH>
                <TH>Patient ID</TH>
                <TH>Doctor ID</TH>
                <TH>Amount</TH>
                <TH>Status</TH>
                <TH>Gateway</TH>
                <TH>Created</TH>
              </THead>
              <TBody>
                {filtered.map((p) => (
                  <TR key={p._id ?? p.id}>
                    <TD className="max-w-[12rem] truncate font-medium text-slate-900">
                      {p._id ?? '—'}
                    </TD>
                    <TD className="max-w-[12rem] truncate">{p.appointmentId ?? '—'}</TD>
                    <TD className="max-w-[12rem] truncate">{p.patientId ?? '—'}</TD>
                    <TD className="max-w-[12rem] truncate">{p.doctorId ?? '—'}</TD>
                    <TD>
                      {p.currency ?? 'LKR'} {Number(p.amount ?? 0).toFixed(2)}
                    </TD>
                    <TD>
                      <Badge variant={statusVariant(p.status)}>{p.status ?? 'pending'}</Badge>
                    </TD>
                    <TD>{p.gateway ?? '—'}</TD>
                    <TD>{p.createdAt ? String(p.createdAt).slice(0, 19).replace('T', ' ') : '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

