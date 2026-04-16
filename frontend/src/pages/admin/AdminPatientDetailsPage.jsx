import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { PatientProfileForm } from '../../components/patient/PatientProfileForm.jsx'

function normalizeProfile(data) {
  return data?.profile ?? data?.data ?? data ?? null
}

function statusVariant(status) {
  const s = String(status ?? '').toLowerCase()
  if (s === 'resolved') return 'success'
  if (s === 'chronic') return 'warning'
  if (s === 'active') return 'info'
  return 'default'
}

export function AdminPatientDetailsPage() {
  const { patientId } = useParams()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [records, setRecords] = useState([])

  const [savingProfile, setSavingProfile] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [recordForm, setRecordForm] = useState(emptyMedicalRecord)
  const [savingRecord, setSavingRecord] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [p, h] = await Promise.allSettled([
        patientApi.getProfile(patientId),
        patientApi.getMedicalHistory(patientId),
      ])
      if (p.status === 'fulfilled') setProfile(normalizeProfile(p.value))
      else setProfile(null)

      if (h.status === 'fulfilled') {
        const items = h.value?.records ?? h.value?.data ?? h.value ?? []
        setRecords(Array.isArray(items) ? items : [])
      } else {
        setRecords([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  async function saveProfile() {
    if (!profile) return
    if (!profile.fullName?.trim()) {
      toast.error('Full name is required')
      return
    }

    setSavingProfile(true)
    try {
      await patientApi.adminUpdateProfile(patientId, profile)
      toast.success('Patient profile updated')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSavingProfile(false)
    }
  }

  async function deleteProfile() {
    const ok = window.confirm(
      'Delete this patient profile? This action cannot be undone.',
    )
    if (!ok) return

    try {
      await patientApi.adminDeleteProfile(patientId)
      toast.success('Patient profile deleted')
      setProfile(null)
      setRecords([])
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  function openAddRecord() {
    setEditing(null)
    setRecordForm(emptyMedicalRecord)
    setModalOpen(true)
  }

  function openEditRecord(r) {
    setEditing(r)
    setRecordForm({
      condition: r?.condition ?? '',
      diagnosisDate: r?.diagnosisDate ? String(r.diagnosisDate).slice(0, 10) : '',
      treatment: r?.treatment ?? '',
      medications: r?.medications ?? '',
      notes: r?.notes ?? '',
      status: r?.status ?? 'active',
    })
    setModalOpen(true)
  }

  async function saveRecord() {
    if (!recordForm.condition?.trim()) {
      toast.error('Condition is required')
      return
    }
    if (!recordForm.diagnosisDate) {
      toast.error('Diagnosis date is required')
      return
    }

    setSavingRecord(true)
    try {
      if (editing) {
        await patientApi.updateMedicalHistory(
          patientId,
          editing._id ?? editing.id,
          recordForm,
        )
        toast.success('Record updated')
      } else {
        await patientApi.addMedicalHistory(patientId, recordForm)
        toast.success('Record added')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSavingRecord(false)
    }
  }

  async function deleteRecord(r) {
    const ok = window.confirm('Delete this record?')
    if (!ok) return
    try {
      await patientApi.deleteMedicalHistory(patientId, r._id ?? r.id)
      toast.success('Record deleted')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  if (loading) return <LoadingScreen title="Loading patient…" />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Patient management
          </div>
          <div className="text-xs text-slate-500">ID: {patientId}</div>
        </div>
        <Link to="/admin/dashboard">
          <Button variant="outline">Back to admin</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Patient profile
              </div>
              <div className="text-xs text-slate-500">
                Update or delete patient profile (admin endpoints).
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" onClick={deleteProfile} disabled={!profile}>
                Delete profile
              </Button>
              <Button onClick={saveProfile} disabled={!profile || savingProfile}>
                {savingProfile ? 'Saving…' : 'Save profile'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {profile ? (
            <PatientProfileForm value={profile} onChange={setProfile} />
          ) : (
            <EmptyState
              title="Profile not found"
              description="This patient may not have created a profile."
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Medical history
              </div>
              <div className="text-xs text-slate-500">
                View/add/update/delete records (if backend authorizes).
              </div>
            </div>
            <Button onClick={openAddRecord}>Add record</Button>
          </div>
        </CardHeader>
        <CardBody>
          {records.length === 0 ? (
            <EmptyState
              title="No medical records"
              description="Add the first record for this patient."
              actionLabel="Add record"
              onAction={openAddRecord}
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
                          size="sm"
                          variant="outline"
                          onClick={() => openEditRecord(r)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteRecord(r)}
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
            <Button onClick={saveRecord} disabled={savingRecord}>
              {savingRecord ? 'Saving…' : 'Save'}
            </Button>
          </div>
        }
      >
        <MedicalHistoryForm value={recordForm} onChange={setRecordForm} />
      </Modal>
    </div>
  )
}

