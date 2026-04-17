import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { patientApi } from '../../api/patientApi.js'
import { getApiErrorMessage, isNotFoundError } from '../../api/error.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { LoadingScreen } from '../../components/ui/LoadingScreen.jsx'

export function PatientPrescriptionsPage() {
  const [loading, setLoading] = useState(true)
  const [prescriptions, setPrescriptions] = useState([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await patientApi.getMyPrescriptions()
        const list = res?.data ?? res?.prescriptions ?? res ?? []
        setPrescriptions(Array.isArray(list) ? list : [])
      } catch (err) {
        if (!isNotFoundError(err)) toast.error(getApiErrorMessage(err))
        setPrescriptions([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <LoadingScreen title="Loading prescriptions…" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-slate-900">My prescriptions</div>
          <div className="text-xs text-slate-500">
            Prescriptions issued by your doctors.
          </div>
        </CardHeader>
        <CardBody>
          {prescriptions.length === 0 ? (
            <EmptyState
              title="No prescriptions yet"
              description="When a doctor issues a prescription for you, it will appear here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {prescriptions.map((rx) => (
                <div
                  key={rx._id ?? rx.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-bold text-slate-900 leading-snug">
                      💊 {rx.medication}
                    </div>
                    <Badge variant="info">Rx</Badge>
                  </div>

                  {/* Structured fields (if provided by doctor) */}
                  {(rx.dosage || rx.frequency || rx.duration) ? (
                    <div className="space-y-1.5 text-sm">
                      {rx.dosage ? (
                        <div className="flex items-center gap-2">
                          <span className="w-20 flex-shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">Dosage</span>
                          <span className="text-slate-700">{rx.dosage}</span>
                        </div>
                      ) : null}
                      {rx.frequency ? (
                        <div className="flex items-center gap-2">
                          <span className="w-20 flex-shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">Frequency</span>
                          <span className="text-slate-700">{rx.frequency}</span>
                        </div>
                      ) : null}
                      {rx.duration ? (
                        <div className="flex items-center gap-2">
                          <span className="w-20 flex-shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">Duration</span>
                          <span className="text-slate-700">{rx.duration}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Notes / instructions */}
                  {rx.instructions ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      {rx.instructions}
                    </div>
                  ) : null}

                  {/* Footer */}
                  <div className="mt-auto border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>Dr. {rx.doctorName || 'Your doctor'}</span>
                    {(rx.issuedAt || rx.createdAt)
                      ? <span> · {String(rx.issuedAt ?? rx.createdAt).slice(0, 10)}</span>
                      : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
