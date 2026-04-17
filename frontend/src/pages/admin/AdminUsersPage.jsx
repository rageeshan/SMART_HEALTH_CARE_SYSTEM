import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../../api/authApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Select } from '../../components/ui/Select.jsx'
import { Table, TBody, TD, TH, THead, TR } from '../../components/ui/Table.jsx'
import {
  getDoctorVerified,
  getUserActive,
  getUserRole,
  normalizeUpdatedUser,
} from '../../utils/userFlags.js'

function normalizeUsers(data) {
  const users = data?.users ?? data?.data ?? data ?? []
  return Array.isArray(users) ? users : []
}

const ROLES = ['patient', 'doctor', 'admin']

export function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [mutating, setMutating] = useState(null)

  // Edit modal state
  const [editTarget, setEditTarget] = useState(null) // the user being edited
  const [editForm, setEditForm] = useState({ fullName: '', email: '', role: 'patient' })
  const [editErrors, setEditErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function load() {
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
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      const hay = `${u.fullName ?? ''} ${u.email ?? ''} ${u.role ?? ''} ${u._id ?? u.id ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [users, query])

  // ── Status toggle ──
  async function toggleStatus(userId) {
    if (!userId) { toast.error('User id missing'); return }
    try {
      setMutating(`toggle:${userId}`)
      const res = await authApi.toggleUserStatus(userId)
      const updated = normalizeUpdatedUser(res)
      if (updated) {
        const updatedId = updated._id ?? updated.id ?? userId
        setUsers((prev) =>
          prev.map((u) => ((u._id ?? u.id) === updatedId ? { ...u, ...updated } : u)),
        )
      }
      toast.success('User status updated')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setMutating(null)
    }
  }

  // ── Doctor verify ──
  async function verifyDoctor(userId) {
    if (!userId) { toast.error('User id missing'); return }
    try {
      setMutating(`verify:${userId}`)
      const res = await authApi.verifyDoctor(userId)
      const updated = normalizeUpdatedUser(res)
      if (updated) {
        const updatedId = updated._id ?? updated.id ?? userId
        setUsers((prev) =>
          prev.map((u) => ((u._id ?? u.id) === updatedId ? { ...u, ...updated } : u)),
        )
      }
      toast.success('Doctor verified')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setMutating(null)
    }
  }

  // ── Edit modal helpers ──
  function openEdit(u) {
    setEditTarget(u)
    setEditForm({
      fullName: u.fullName ?? u.name ?? '',
      email: u.email ?? '',
      role: getUserRole(u) || 'patient',
    })
    setEditErrors({})
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
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return }

    const userId = editTarget?._id ?? editTarget?.id
    setSaving(true)
    try {
      const res = await authApi.updateUser(userId, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim().toLowerCase(),
        role: editForm.role,
      })
      const updated = normalizeUpdatedUser(res)
      if (updated) {
        setUsers((prev) =>
          prev.map((u) => ((u._id ?? u.id) === userId ? { ...u, ...updated } : u)),
        )
      }
      toast.success('User updated successfully')
      setEditTarget(null)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingScreen title="Loading users…" />

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Users management</div>
              <div className="text-xs text-slate-500">
                View users, edit details, change roles, activate/deactivate, and verify doctors.
              </div>
            </div>
            <div className="w-full sm:w-72">
              <Input
                name="query"
                placeholder="Search by name / email / role / id…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {filtered.length === 0 ? (
            <EmptyState
              title="No users found"
              description="Try a different search query."
            />
          ) : (
            <Table>
              <THead>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH>Doctor verified</TH>
                <TH className="text-right">Actions</TH>
              </THead>
              <TBody>
                {filtered.map((u) => {
                  const id = u._id ?? u.id
                  const active = getUserActive(u)
                  const verified = getDoctorVerified(u)
                  const role = getUserRole(u)
                  return (
                    <TR key={id ?? u.email}>
                      <TD className="font-medium text-slate-900">
                        <Link
                          to={id ? `/admin/users/${encodeURIComponent(id)}` : '#'}
                          className="hover:underline"
                        >
                          {u.fullName ?? u.name ?? '—'}
                        </Link>
                      </TD>
                      <TD className="max-w-[18rem] truncate">{u.email ?? '—'}</TD>
                      <TD>
                        <Badge variant="info">{role || 'user'}</Badge>
                      </TD>
                      <TD>
                        {active ? (
                          <Badge variant="success">active</Badge>
                        ) : (
                          <Badge variant="danger">inactive</Badge>
                        )}
                      </TD>
                      <TD>
                        {role === 'doctor' ? (
                          verified ? (
                            <Badge variant="success">verified</Badge>
                          ) : (
                            <Badge variant="warning">pending</Badge>
                          )
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          {/* ── Edit button ── */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(u)}
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus(id)}
                            disabled={mutating === `toggle:${id}`}
                          >
                            {active ? 'Deactivate' : 'Activate'}
                          </Button>

                          {role === 'doctor' && !verified ? (
                            <Button
                              size="sm"
                              onClick={() => verifyDoctor(id)}
                              disabled={mutating === `verify:${id}`}
                            >
                              Verify doctor
                            </Button>
                          ) : null}
                        </div>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* ── Edit User Modal ── */}
      <Modal
        open={Boolean(editTarget)}
        title={`Edit user — ${editTarget?.fullName ?? editTarget?.name ?? ''}`}
        onClose={() => setEditTarget(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>
              Cancel
            </Button>
            <Button form="edit-user-form-list" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        }
      >
        <form id="edit-user-form-list" onSubmit={handleEditSubmit} className="space-y-4">
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
          {editTarget && getUserRole(editTarget) === 'doctor' && editForm.role !== 'doctor' ? (
            <p className="text-xs text-rose-600">
              ⚠️ Changing role away from <strong>doctor</strong> will reset their verification status.
            </p>
          ) : null}
          {editTarget && getUserRole(editTarget) !== 'doctor' && editForm.role === 'doctor' ? (
            <p className="text-xs text-amber-600">
              ⚠️ Changing role to <strong>doctor</strong> will require admin verification before this user can log in as a doctor.
            </p>
          ) : null}
        </form>
      </Modal>
    </>
  )
}
