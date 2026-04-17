import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { symptomApi } from '../../api/symptomApi.js'
import { getApiErrorMessage } from '../../api/error.js'
import { useAuth } from '../../hooks/useAuth.js'
import { Button } from '../../components/ui/Button.jsx'
import { Card, CardBody, CardHeader } from '../../components/ui/Card.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Badge } from '../../components/ui/Badge.jsx'

export function PatientSymptomPredictorPage() {
  const { user } = useAuth()
  const [symptomsText, setSymptomsText] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const patientId = useMemo(
    () => user?.id ?? user?._id ?? user?.userId ?? null,
    [user],
  )

  async function runCheck(e) {
    e.preventDefault()
    if (!patientId) {
      toast.error('Patient identity not found. Please sign in again.')
      return
    }

    const symptoms = symptomsText
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean)

    if (symptoms.length === 0) {
      toast.error('Please enter at least one symptom.')
      return
    }

    setChecking(true)
    try {
      const data = await symptomApi.check({
        patientId,
        symptoms,
        additionalNotes: additionalNotes.trim() || undefined,
      })
      setResult(data)
      toast.success('Symptom check completed')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setChecking(false)
    }
  }

  async function loadHistory() {
    if (!patientId) return
    setLoadingHistory(true)
    try {
      const data = await symptomApi.getHistory(patientId)
      setHistory(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const ai = result?.aiResponse

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-slate-900">AI Symptom Predictor</div>
          <div className="text-xs text-slate-500">
            Informational only, not a final diagnosis.
          </div>
        </CardHeader>
        <CardBody>
          <form className="space-y-4" onSubmit={runCheck}>
            <label className="block text-sm font-medium text-slate-700">
              Symptoms (comma/new line separated)
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                rows={4}
                value={symptomsText}
                onChange={(e) => setSymptomsText(e.target.value)}
                placeholder="fever, sore throat, body ache"
              />
            </label>
            <Input
              label="Additional notes (optional)"
              name="additionalNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Anything else you feel..."
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={checking}>
                {checking ? 'Checking…' : 'Get suggestion'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {ai ? (
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold text-slate-900">Latest result</div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-slate-800">Urgency: </span>
                <Badge
                  variant={
                    ai.urgencyLevel === 'high'
                      ? 'danger'
                      : ai.urgencyLevel === 'medium'
                        ? 'warning'
                        : 'success'
                  }
                >
                  {ai.urgencyLevel ?? '—'}
                </Badge>
              </div>

              {Array.isArray(ai.possibleConditions) && ai.possibleConditions.length > 0 ? (
                <div>
                  <div className="font-semibold text-slate-800">Possible conditions</div>
                  <ul className="mt-1 list-inside list-disc text-slate-700">
                    {ai.possibleConditions.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {Array.isArray(ai.recommendedSpecialties) && ai.recommendedSpecialties.length > 0 ? (
                <div>
                  <div className="font-semibold text-slate-800">Recommended specialties</div>
                  <ul className="mt-1 list-inside list-disc text-slate-700">
                    {ai.recommendedSpecialties.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {ai.advice ? (
                <div className="text-slate-700">
                  <span className="font-semibold text-slate-800">Advice: </span>
                  {ai.advice}
                </div>
              ) : null}
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-900">My symptom history</div>
            <Button size="sm" variant="outline" onClick={loadHistory} disabled={loadingHistory}>
              {loadingHistory ? 'Loading…' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {history.length === 0 ? (
            <div className="text-sm text-slate-500">
              No symptom checks yet. Run your first check above.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <div className="font-medium text-slate-900">
                    {new Date(h.createdAt).toLocaleString()}
                  </div>
                  <div className="text-slate-600">
                    Symptoms: {(h.symptoms ?? []).join(', ')}
                  </div>
                  {h?.aiResponse?.urgencyLevel ? (
                    <div className="text-xs text-slate-500">
                      Urgency: {h.aiResponse.urgencyLevel}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

