import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { getRecentPatients } from '../../utils/doctorRecentPatients.js'
import { getUserDisplayName } from '../../utils/userProfile.js'

export function DoctorDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [patientId, setPatientId] = useState('')
  const [patients] = useState(() => getRecentPatients())
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const displayName = useMemo(() => {
    return getUserDisplayName(user, 'Doctor')
  }, [user])

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients

    return patients.filter((patient) => {
      const haystack = `${patient.fullName ?? ''} ${patient.phone ?? ''} ${
        patient.id ?? ''
      }`.toLowerCase()
      return haystack.includes(q)
    })
  }, [patients, query])

  const PAGE_SIZE = 5
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const visiblePatients = filteredPatients.slice(startIndex, startIndex + PAGE_SIZE)

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="text-sm font-semibold text-slate-900">Welcome</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            Dr. {displayName}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Use patient lookup to view profiles and manage medical history records.
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-slate-900">Patient lookup</div>
          <div className="text-xs text-slate-500">
            Enter a patient ID to open their profile.
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Input
              label="Patient ID"
              name="patientId"
              placeholder="e.g., 66123abc..."
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                const id = patientId.trim()
                if (id) navigate(`/doctor/patients/${encodeURIComponent(id)}`)
              }}
            >
              Search
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Recent patients directory
              </div>
              <div className="text-xs text-slate-500">
                Since the current backend does not expose a doctor patient-list
                endpoint, this list is built from patients you have already
                opened in the doctor workflow.
              </div>
            </div>
            <div className="w-full sm:w-72">
              <Input
                name="patientQuery"
                placeholder="Search by patient name"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {visiblePatients.length === 0 ? (
            <EmptyState
              title={patients.length ? 'No patients match this search' : 'No patients yet'}
              description={
                patients.length
                  ? 'Try a different name or open a patient by ID.'
                  : 'Open a patient by ID once, and they will appear here for quick access.'
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                {visiblePatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">
                          {patient.fullName}
                        </div>
                        {patient.bloodGroup ? (
                          <Badge variant="danger">{patient.bloodGroup}</Badge>
                        ) : null}
                        {patient.gender ? (
                          <Badge variant="info">{patient.gender}</Badge>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Patient ID: {patient.id}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {patient.phone || 'No phone available'}
                      </div>
                    </div>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() =>
                        navigate(`/doctor/patients/${encodeURIComponent(patient.id)}`)
                      }
                    >
                      Open patient
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="text-sm text-slate-600">
                  Showing {visiblePatients.length} of {filteredPatients.length} patients
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {safePage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

