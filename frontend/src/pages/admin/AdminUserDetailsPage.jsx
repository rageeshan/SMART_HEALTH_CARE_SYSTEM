import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../../api/authApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Select } from '../../components/ui/Select.jsx'

import {
  getDoctorVerified,
  getUserActive,
  getUserRole,
  normalizeUpdatedUser,
} from '../../utils/userFlags.js'

function normalizeUser(data) {
  return data?.user ?? data?.data ?? data ?? null
}

const ROLES = ['patient', 'doctor', 'admin']

export function AdminUserDetailsPage() {
  const { userId } = useParams()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [mutating, setMutating] = useState(null)

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', email: '', role: 'patient' })
  const [editErrors, setEditErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await authApi.getUser(userId)
      const u = normalizeUser(res)
      setUser(u)
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

  // Pre-fill form with current user data when edit modal opens
  function openEdit() {
    if (!user) return
    setEditForm({
      fullName: user.fullName ?? user.name ?? '',
      email: user.email ?? '',
      role: getUserRole(user) || 'patient',
    })
    setEditErrors({})
    setEditOpen(true)
  }

  function handleEditChange(e) {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
    setEditErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function validateEdit() {
    const errs = {}
    if (!editForm.fullName.trim()) errs.fullName = 'Full name is required'
    if (!editForm.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim()))
      errs.email = 'Enter a valid email address'
    if (!ROLES.includes(editForm.role)) errs.role = 'Select a valid role'
    return errs
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    const errs = validateEdit()
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs)
      return
    }

    setSaving(true)
    try {
      const res = await authApi.updateUser(userId, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim().toLowerCase(),
        role: editForm.role,
      })
      const updated = normalizeUpdatedUser(res)
      if (updated) setUser((prev) => (prev ? { ...prev, ...updated } : prev))
      toast.success('User updated successfully')
      setEditOpen(false)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">User details</div>
          <div className="text-xs text-slate-500">ID: {userId}</div>
        </div>
        <Link to="/admin/users">
          <Button variant="outline">Back to users</Button>
        </Link>
      </div>

      {/* Detail card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {user.fullName ?? user.name ?? '—'}
              </div>
              <div className="text-xs text-slate-500">{user.email ?? '—'}</div>
            </div>
            {/* Edit button */}
            <Button variant="outline" size="sm" onClick={openEdit}>
              ✏️ Edit user
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-3">
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
                  <span className="text-sm text-slate-500">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={toggleStatus}
              disabled={mutating === `toggle:${userId}`}
            >
              {active ? 'Deactivate account' : 'Activate account'}
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

      {/* ── Edit User Modal ── */}
      <Modal
        open={editOpen}
        title="Edit user"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button form="edit-user-form" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        }
      >
        <form id="edit-user-form" onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Full name"
            name="fullName"
            placeholder="Jane Doe"
            value={editForm.fullName}
            onChange={handleEditChange}
            error={editErrors.fullName}
          />
          <Input
            label="Email address"
            name="email"
            type="email"
            placeholder="jane@example.com"
            value={editForm.email}
            onChange={handleEditChange}
            error={editErrors.email}
          />
          <Select
            label="Role"
            name="role"
            value={editForm.role}
            onChange={handleEditChange}
            error={editErrors.role}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </Select>
          {editForm.role === 'doctor' && getUserRole(user) !== 'doctor' ? (
            <p className="text-xs text-amber-600">
              ⚠️ Changing role to <strong>doctor</strong> will require re-verification of this account.
            </p>
          ) : null}
          {getUserRole(user) === 'doctor' && editForm.role !== 'doctor' ? (
            <p className="text-xs text-rose-600">
              ⚠️ Changing role away from <strong>doctor</strong> will reset their verification status.
            </p>
          ) : null}
        </form>
      </Modal>
    </div>
  )
}
