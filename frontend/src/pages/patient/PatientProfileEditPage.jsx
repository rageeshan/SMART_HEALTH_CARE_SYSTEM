import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { patientApi } from '../../api/patientApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { Button } from '../../components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { PatientProfileForm } from '../../components/patient/PatientProfileForm.jsx'

function normalizeProfile(data) {
  return data?.profile ?? data?.data ?? data ?? null
}

export function PatientProfileEditPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await patientApi.getMyProfile()
        setProfile(normalizeProfile(res))
      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function validate(v) {
    const e = {}
    if (!v?.fullName?.trim()) e.fullName = 'Required'
    if (!v?.phone?.trim()) e.phone = 'Required'
    if (!v?.dob) e.dob = 'Required'
    if (!v?.gender) e.gender = 'Required'
    if (!v?.address?.trim()) e.address = 'Required'
    if (!v?.bloodGroup) e.bloodGroup = 'Required'
    return e
  }

  async function onSubmit(e) {
    e.preventDefault()
    const v = validate(profile)
    setErrors(v)
    if (Object.keys(v).length) return

    setSaving(true)
    try {
      await patientApi.updateMyProfile(profile)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingScreen />

  if (!profile) {
    return (
      <EmptyState
        title="No profile found"
        description="Create your patient profile to continue."
        actionLabel="Create profile"
        onAction={() => (window.location.href = '/patient/profile/create')}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="text-sm font-semibold text-slate-900">Edit profile</div>
        <div className="text-xs text-slate-500">
          Update your personal and emergency contact information.
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-5">
          <PatientProfileForm value={profile} onChange={setProfile} errors={errors} />
          <div className="flex flex-wrap justify-end gap-3">
            <Link to="/patient/dashboard" className="inline-flex">
              <Button variant="outline" type="button">
                Back
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

