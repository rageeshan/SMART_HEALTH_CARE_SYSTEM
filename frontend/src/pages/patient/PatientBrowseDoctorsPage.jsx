import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { authApi } from '../../api/authApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.jsx'

function normalizeDoctors(res) {
  const list = res?.data ?? res?.doctors ?? res ?? []
  return Array.isArray(list) ? list : []
}

export function PatientBrowseDoctorsPage() {
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await authApi.getDoctors()
        setDoctors(normalizeDoctors(res))
      } catch (err) {
        toast.error(getApiErrorMessage(err))
        setDoctors([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return doctors
    return doctors.filter((d) =>
      `${d.fullName ?? ''} ${d.email ?? ''}`.toLowerCase().includes(q),
    )
  }, [doctors, query])

  if (loading) return <LoadingScreen title="Loading doctors…" />

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Browse doctors</div>
              <div className="text-xs text-slate-500">
                All verified, active doctors on the platform.
              </div>
            </div>
            <div className="w-full sm:w-72">
              <Input
                name="query"
                placeholder="Search by name or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {filtered.length === 0 ? (
            <EmptyState
              title="No doctors found"
              description={doctors.length ? 'Try a different search.' : 'No verified doctors are registered yet.'}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d) => {
                const id = d._id ?? d.id
                const initials = (d.fullName ?? 'D')
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()

                return (
                  <div
                    key={id}
                    className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    {/* Avatar */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        Dr. {d.fullName ?? '—'}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        {d.email ?? '—'}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        ✓ Verified
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
