import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { patientApi } from '../../api/patientApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Table, TBody, TD, TH, THead, TR } from '../../components/ui/Table.jsx'
import {
  MedicalHistoryForm,
} from '../../components/patient/MedicalHistoryForm.jsx'
import { emptyMedicalRecord } from '../../components/patient/models.js'
import { saveRecentPatient } from '../../utils/doctorRecentPatients.js'
import { Alert } from '../../components/ui/Alert.jsx'

function statusVariant(status) {
  const s = String(status ?? '').toLowerCase()
  if (s === 'resolved') return 'success'
  if (s === 'chronic') return 'warning'
  if (s === 'active') return 'info'
  return 'default'
}

function normalizeProfile(data) {
  return data?.profile ?? data?.data ?? data ?? null
}

export function DoctorPatientPage() {
  const { patientId } = useParams()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [records, setRecords] = useState([])
  const [fetchError, setFetchError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // record or null
  const [form, setForm] = useState(emptyMedicalRecord)
  const [saving, setSaving] = useState(false)

  const patientLabel = useMemo(() => patientId, [patientId])

  async function load() {
    setLoading(true)
    setFetchError('')
    try {
      const [p, h] = await Promise.allSettled([
        patientApi.getProfile(patientId),
        patientApi.getMedicalHistory(patientId),
      ])

      if (p.status === 'fulfilled') {
        const nextProfile = normalizeProfile(p.value)
        setProfile(nextProfile)
        if (nextProfile) saveRecentPatient(nextProfile, patientId)
      } else {
        setProfile(null)
      }

      if (h.status === 'fulfilled') {
        const items =
          h.value?.records ??
          h.value?.medicalHistory ??
          h.value?.data?.medicalHistory ??
          h.value?.data ??
          []
        setRecords(Array.isArray(items) ? items : [])
      } else {
        setRecords([])
      }

      if (p.status === 'rejected' && h.status === 'rejected') {
        const message = getApiErrorMessage(
          p.reason,
          getApiErrorMessage(h.reason, 'Unable to fetch patient data'),
        )
        setFetchError(message)
        toast.error(message)
      } else if (p.status === 'rejected') {
        const message = getApiErrorMessage(p.reason)
        setFetchError(message)
      } else if (h.status === 'rejected') {
        // Allow profile to remain visible if only history fails.
        const message = getApiErrorMessage(h.reason)
        setFetchError(`Profile loaded, but history failed: ${message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  function openAdd() {
    setEditing(null)
    setForm(emptyMedicalRecord)
    setModalOpen(true)
  }

  function openEdit(record) {
    setEditing(record)
    setForm({
      condition: record?.condition ?? '',
      diagnosisDate: record?.diagnosisDate
        ? String(record.diagnosisDate).slice(0, 10)
        : '',
      treatment: record?.treatment ?? '',
      medications: record?.medications ?? '',
      notes: record?.notes ?? '',
      status: record?.status ?? 'active',
    })
    setModalOpen(true)
  }

  async function saveRecord() {
    if (!form.condition?.trim()) {
      toast.error('Condition is required')
      return
    }
    if (!form.diagnosisDate) {
      toast.error('Diagnosis date is required')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await patientApi.updateMedicalHistory(
          patientId,
          editing._id ?? editing.id,
          form,
        )
        toast.success('Record updated')
      } else {
        await patientApi.addMedicalHistory(patientId, form)
        toast.success('Record added')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function removeRecord(record) {
    const ok = window.confirm('Delete this medical history record?')
    if (!ok) return

    try {
      await patientApi.deleteMedicalHistory(patientId, record._id ?? record.id)
      toast.success('Record deleted')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  if (loading) return <LoadingScreen title="Loading patient…" />

  return (
    <div className="space-y-6">
      {fetchError ? (
        <Alert variant="warning" title="Fetch warning">
          {fetchError}
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="text-sm font-semibold text-slate-900">Patient</div>
            <div className="text-xs text-slate-500">ID: {patientLabel}</div>
          </CardHeader>
          <CardBody>
            {profile ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs text-slate-500">Full name</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {profile.fullName ?? '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs text-slate-500">Phone</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {profile.phone ?? '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs text-slate-500">Blood group</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {profile.bloodGroup ?? '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs text-slate-500">Address</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {profile.address ?? '—'}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Profile not found"
                description="This patient may not have created a profile yet."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Medical history
            </div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {records.length}
            </div>
            <div className="text-sm text-slate-600">Records</div>
            <div className="mt-4">
              <Button className="w-full" onClick={openAdd}>
                Add record
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-slate-900">
            Medical history records
          </div>
          <div className="text-xs text-slate-500">
            Add, update, or delete records (patient-service).
          </div>
        </CardHeader>
        <CardBody>
          {records.length === 0 ? (
            <EmptyState
              title="No records"
              description="Add the first medical history record for this patient."
              actionLabel="Add record"
              onAction={openAdd}
            />
          ) : (
            <Table>
              <THead>
                <TH>Condition</TH>
                <TH>Diagnosis date</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
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
                    <TD className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(r)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeRecord(r)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit medical record' : 'Add medical record'}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRecord} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <MedicalHistoryForm value={form} onChange={setForm} />
      </Modal>
    </div>
  )
}

