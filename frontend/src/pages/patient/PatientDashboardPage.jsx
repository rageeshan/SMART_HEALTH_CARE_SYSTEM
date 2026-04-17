import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { patientApi } from '../../api/patientApi.js'
import { getApiErrorMessage, isNotFoundError } from '../../api/error.js'
import { useAuth } from '../../hooks/useAuth.js'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import {
  PatientProfileForm,
} from '../../components/patient/PatientProfileForm.jsx'
import { emptyPatientProfile } from '../../components/patient/models.js'
import { getUserDisplayName } from '../../utils/userProfile.js'

function normalizeProfile(data) {
  return data?.profile ?? data?.data ?? data ?? null
}

function normalizeMedicalHistory(data) {
  const items =
    data?.records ??
    data?.medicalHistory ??
    data?.data?.medicalHistory ??
    data?.data ??
    []
  return Array.isArray(items) ? items : []
}

export function PatientDashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [history, setHistory] = useState([])
  const [createForm, setCreateForm] = useState(emptyPatientProfile)
  const [createErrors, setCreateErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const displayName = useMemo(() => {
    return getUserDisplayName(user, 'Patient')
  }, [user])

  async function load() {
    setLoading(true)
    try {
      const profileRes = await patientApi.getMyProfile()
      const nextProfile = normalizeProfile(profileRes)
      setProfile(nextProfile)

      if (nextProfile) {
        const historyRes = await patientApi.getMyMedicalHistory()
        setHistory(normalizeMedicalHistory(historyRes))
      } else {
        setHistory([])
      }
    } catch (err) {
      // 404 here means profile doesn't exist yet; show create-profile UI instead.
      if (isNotFoundError(err)) {
        setProfile(null)
        setHistory([])
      } else {
        toast.error(getApiErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function validateCreate(v) {
    const e = {}
    if (!v.fullName?.trim()) e.fullName = 'Required'
    if (!v.phone?.trim()) e.phone = 'Required'
    if (!v.dob) e.dob = 'Required'
    if (!v.gender) e.gender = 'Required'
    if (!v.address?.trim()) e.address = 'Required'
    if (!v.bloodGroup) e.bloodGroup = 'Required'
    return e
  }

  async function submitCreate() {
    const e = validateCreate(createForm)
    setCreateErrors(e)
    if (Object.keys(e).length) return

    setSaving(true)
    try {
      await patientApi.createProfile(createForm)
      toast.success('Profile created')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Stats row ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="text-sm font-semibold text-slate-900">
              Welcome back
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {displayName}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Manage your profile, browse doctors, and view your medical history securely.
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Medical records
            </div>
            {loading ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {history.length}
                </div>
                <div className="text-sm text-slate-600">Total records</div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Quick actions ── */}
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-slate-900">Quick actions</div>
          <div className="text-xs text-slate-500">Everything you need at a glance.</div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Browse Doctors */}
            <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div className="text-2xl">🩺</div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Browse doctors</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  View all verified doctors on the platform.
                </div>
              </div>
              <Link to="/patient/doctors" className="mt-auto">
                <Button className="w-full" id="btn-browse-doctors">Browse doctors</Button>
              </Link>
            </div>

            {/* Medical Reports */}
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-2xl">📋</div>
              <div>
                <div className="text-sm font-semibold text-slate-900">My reports</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  Upload and manage your medical reports.
                </div>
              </div>
              <Link to="/patient/reports" className="mt-auto">
                <Button className="w-full" id="btn-my-reports">View reports</Button>
              </Link>
            </div>

            {/* Prescriptions */}
            <div className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <div className="text-2xl">💊</div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Prescriptions</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  View prescriptions issued by your doctors.
                </div>
              </div>
              <Link to="/patient/prescriptions" className="mt-auto">
                <Button className="w-full" id="btn-prescriptions">View prescriptions</Button>
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Profile summary ── */}
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-slate-900">
            Profile summary
          </div>
          <div className="text-xs text-slate-500">
            {profile ? 'Your profile is active.' : 'No profile found yet.'}
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : profile ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs text-slate-500">Full name</div>
                <div className="text-sm font-semibold text-slate-900">
                  {profile.fullName}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs text-slate-500">Phone</div>
                <div className="text-sm font-semibold text-slate-900">
                  {profile.phone}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs text-slate-500">Blood group</div>
                <div className="text-sm font-semibold text-slate-900">
                  {profile.bloodGroup}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs text-slate-500">Address</div>
                <div className="text-sm font-semibold text-slate-900">
                  {profile.address}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Create your patient profile"
              description="Complete your profile to access all patient features."
              actionLabel="Start now"
              onAction={() =>
                document
                  .getElementById('create-profile-card')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            />
          )}
        </CardBody>
      </Card>

      {!loading && !profile ? (
        <Card id="create-profile-card">
          <CardHeader>
            <div className="text-sm font-semibold text-slate-900">
              Create profile
            </div>
            <div className="text-xs text-slate-500">
              These details will be used by clinicians when you visit.
            </div>
          </CardHeader>
          <CardBody>
            <PatientProfileForm
              value={createForm}
              onChange={setCreateForm}
              errors={createErrors}
            />
            <div className="mt-5 flex justify-end">
              <Button onClick={submitCreate} disabled={saving}>
                {saving ? 'Saving…' : 'Create profile'}
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  )
}
