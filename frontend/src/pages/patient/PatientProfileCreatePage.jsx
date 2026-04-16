import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { patientApi } from '../../api/patientApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { Button } from '../../components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import {
  PatientProfileForm,
} from '../../components/patient/PatientProfileForm.jsx'
import { emptyPatientProfile } from '../../components/patient/models.js'

export function PatientProfileCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyPatientProfile)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function validate(v) {
    const e = {}
    if (!v.fullName?.trim()) e.fullName = 'Required'
    if (!v.phone?.trim()) e.phone = 'Required'
    if (!v.dob) e.dob = 'Required'
    if (!v.gender) e.gender = 'Required'
    if (!v.address?.trim()) e.address = 'Required'
    if (!v.bloodGroup) e.bloodGroup = 'Required'
    return e
  }

  async function onSubmit(e) {
    e.preventDefault()
    const v = validate(form)
    setErrors(v)
    if (Object.keys(v).length) return

    setSaving(true)
    try {
      await patientApi.createProfile(form)
      toast.success('Profile created')
      navigate('/patient/dashboard', { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="text-sm font-semibold text-slate-900">
          Create patient profile
        </div>
        <div className="text-xs text-slate-500">
          This profile is required to use patient features.
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-5">
          <PatientProfileForm value={form} onChange={setForm} errors={errors} />
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Create profile'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

