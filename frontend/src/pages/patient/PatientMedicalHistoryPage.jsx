import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { patientApi } from '../../api/patientApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.jsx'
import { Table, TBody, TD, TH, THead, TR } from '../../components/ui/Table.jsx'

function statusVariant(status) {
  const s = String(status ?? '').toLowerCase()
  if (s === 'resolved') return 'success'
  if (s === 'chronic') return 'warning'
  if (s === 'active') return 'info'
  return 'default'
}

export function PatientMedicalHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])

  async function load() {
    setLoading(true)
    try {
      const res = await patientApi.getMyMedicalHistory()
      const items = res?.records ?? res?.data ?? res ?? []
      setRecords(Array.isArray(items) ? items : [])
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <LoadingScreen title="Loading medical history…" />

  return (
    <Card>
      <CardHeader>
        <div className="text-sm font-semibold text-slate-900">Medical history</div>
        <div className="text-xs text-slate-500">
          View your recorded conditions, treatments, and notes.
        </div>
      </CardHeader>
      <CardBody>
        {records.length === 0 ? (
          <EmptyState
            title="No medical history records"
            description="When a clinician adds records, they’ll show up here."
          />
        ) : (
          <Table>
            <THead>
              <TH>Condition</TH>
              <TH>Diagnosis date</TH>
              <TH>Status</TH>
              <TH>Medications</TH>
            </THead>
            <TBody>
              {records.map((r) => (
                <TR key={r._id ?? r.id ?? `${r.condition}-${r.diagnosisDate}`}>
                  <TD className="font-medium text-slate-900">
                    {r.condition ?? '—'}
                  </TD>
                  <TD>{r.diagnosisDate ? String(r.diagnosisDate).slice(0, 10) : '—'}</TD>
                  <TD>
                    <Badge variant={statusVariant(r.status)}>
                      {String(r.status ?? 'unknown')}
                    </Badge>
                  </TD>
                  <TD className="max-w-[22rem] truncate">
                    {r.medications ?? '—'}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardBody>
    </Card>
  )
}

