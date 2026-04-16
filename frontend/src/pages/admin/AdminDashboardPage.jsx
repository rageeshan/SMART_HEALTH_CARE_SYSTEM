import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../../api/authApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { getDoctorVerified, getUserActive, getUserRole } from '../../utils/userFlags.js'

function normalizeUsers(data) {
  const users = data?.users ?? data?.data ?? data ?? []
  return Array.isArray(users) ? users : []
}

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [patientId, setPatientId] = useState('')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await authApi.getUsers()
        setUsers(normalizeUsers(res))
      } catch (err) {
        toast.error(getApiErrorMessage(err))
        setUsers([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const stats = useMemo(() => {
    const total = users.length
    const byRole = users.reduce(
      (acc, u) => {
        const r = getUserRole(u)
        acc[r] = (acc[r] ?? 0) + 1
        return acc
      },
      { patient: 0, doctor: 0, admin: 0 },
    )

    const active = users.filter((u) => getUserActive(u)).length
    const doctorsVerified = users.filter((u) => getDoctorVerified(u)).length
    return { total, active, byRole, doctorsVerified }
  }, [users])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total users
            </div>
            {loading ? <Skeleton className="mt-3 h-8 w-20" /> : <div className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</div>}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active users
            </div>
            {loading ? <Skeleton className="mt-3 h-8 w-20" /> : <div className="mt-2 text-3xl font-bold text-slate-900">{stats.active}</div>}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Doctors
            </div>
            {loading ? <Skeleton className="mt-3 h-8 w-20" /> : <div className="mt-2 text-3xl font-bold text-slate-900">{stats.byRole.doctor ?? 0}</div>}
            {!loading ? (
              <div className="mt-1 text-sm text-slate-600">
                Verified: {stats.doctorsVerified}
              </div>
            ) : null}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Patients
            </div>
            {loading ? <Skeleton className="mt-3 h-8 w-20" /> : <div className="mt-2 text-3xl font-bold text-slate-900">{stats.byRole.patient ?? 0}</div>}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-slate-900">Quick actions</div>
          <div className="text-xs text-slate-500">
            Manage users (auth-service) and patient profiles (patient-service).
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                User management
              </div>
              <div className="mt-1 text-sm text-slate-600">
                View users, activate/deactivate, and verify doctor accounts.
              </div>
              <div className="mt-4">
                <Link to="/admin/users">
                  <Button>Open users</Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                Patient management
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Open a patient profile by ID to view/update/delete.
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <Input
                  label="Patient ID"
                  name="patientId"
                  placeholder="e.g., 66123abc..."
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                />
                <Link
                  to={
                    patientId.trim()
                      ? `/admin/patients/${encodeURIComponent(patientId.trim())}`
                      : '#'
                  }
                >
                  <Button className="w-full sm:w-auto" disabled={!patientId.trim()}>
                    Open
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

