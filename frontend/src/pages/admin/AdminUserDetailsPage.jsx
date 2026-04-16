import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../../api/authApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.jsx'

import {
  getDoctorVerified,
  getUserActive,
  getUserRole,
  normalizeUpdatedUser,
} from '../../utils/userFlags.js'

function normalizeUser(data) {
  return data?.user ?? data?.data ?? data ?? null
}

export function AdminUserDetailsPage() {
  const { userId } = useParams()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [mutating, setMutating] = useState(null) // e.g. "toggle:123"

  async function load() {
    setLoading(true)
    try {
      const res = await authApi.getUser(userId)
      setUser(normalizeUser(res))
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function toggleStatus() {
    try {
      if (!userId) return
      setMutating(`toggle:${userId}`)
      const res = await authApi.toggleUserStatus(userId)
      const updated = normalizeUpdatedUser(res)
      if (updated) setUser((prev) => (prev ? { ...prev, ...updated } : prev))

      toast.success('User status updated')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setMutating(null)
    }
  }

  async function verifyDoctor() {
    try {
      if (!userId) return
      setMutating(`verify:${userId}`)
      const res = await authApi.verifyDoctor(userId)
      const updated = normalizeUpdatedUser(res)
      if (updated) setUser((prev) => (prev ? { ...prev, ...updated } : prev))

      toast.success('Doctor verified')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setMutating(null)
    }
  }

  if (loading) return <LoadingScreen title="Loading user…" />
  if (!user) return <div className="text-sm text-slate-600">User not found.</div>

  const role = getUserRole(user)
  const active = getUserActive(user)
  const verified = getDoctorVerified(user)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">User details</div>
          <div className="text-xs text-slate-500">ID: {userId}</div>
        </div>
        <Link to="/admin/users">
          <Button variant="outline">Back to users</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-slate-900">
            {user.fullName ?? user.name ?? '—'}
          </div>
          <div className="text-xs text-slate-500">{user.email ?? '—'}</div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">Role</div>
              <div className="mt-1">
                <Badge variant="info">{role || 'user'}</Badge>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">Status</div>
              <div className="mt-1">
                {active ? (
                  <Badge variant="success">active</Badge>
                ) : (
                  <Badge variant="danger">inactive</Badge>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">Doctor verification</div>
              <div className="mt-1">
                {role === 'doctor' ? (
                  verified ? (
                    <Badge variant="success">verified</Badge>
                  ) : (
                    <Badge variant="warning">pending</Badge>
                  )
                ) : (
                  <span className="text-sm text-slate-600">Not a doctor</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={toggleStatus}
              disabled={mutating === `toggle:${userId}`}
            >
              {active ? 'Deactivate' : 'Activate'}
            </Button>
            {role === 'doctor' && !verified ? (
              <Button
                onClick={verifyDoctor}
                disabled={mutating === `verify:${userId}`}
              >
                Verify doctor
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

