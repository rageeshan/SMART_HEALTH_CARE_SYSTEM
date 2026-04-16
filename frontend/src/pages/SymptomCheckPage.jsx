import { useState } from "react";
import { Link } from "react-router-dom";

const SYMPTOM_API =
  import.meta.env.VITE_SYMPTOM_API_URL || "http://localhost:5003/api/symptoms";

export function SymptomCheckPage() {
  const [patientId, setPatientId] = useState("");
  const [symptomsText, setSymptomsText] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const symptoms = symptomsText
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const response = await fetch(`${SYMPTOM_API}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          symptoms,
          additionalNotes: additionalNotes.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Symptom check failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ai = result?.aiResponse;
  const plainText =
    typeof result?.result === "string" ? result.result : null;

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">
        AI symptom check
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Describe your symptoms. This is not a diagnosis — always see a qualified
        doctor.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Patient ID
          <input
            required
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-200 focus:ring-2"
            placeholder="e.g. patient-001"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Symptoms (comma or new line separated)
          <textarea
            required
            rows={4}
            value={symptomsText}
            onChange={(e) => setSymptomsText(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-200 focus:ring-2"
            placeholder="fever, headache, fatigue"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Additional notes (optional)
          <textarea
            rows={2}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-200 focus:ring-2"
          />
        </label>

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Checking…" : "Get suggestions"}
        </button>
      </form>

      {result && plainText && !ai ? (
        <div className="mt-8 space-y-4 border-t border-slate-200 pt-6 text-left text-sm">
          <p className="font-semibold text-slate-800">Suggestion</p>
          <p className="whitespace-pre-wrap text-slate-700">{plainText}</p>
        </div>
      ) : null}

      {result && ai ? (
        <div className="mt-8 space-y-4 border-t border-slate-200 pt-6 text-left text-sm">
          <div>
            <span className="font-semibold text-slate-800">Urgency:</span>{" "}
            <span
              className={
                ai.urgencyLevel === "high"
                  ? "text-rose-600"
                  : ai.urgencyLevel === "medium"
                  ? "text-amber-600"
                  : "text-emerald-600"
              }
            >
              {ai.urgencyLevel || "—"}
            </span>
          </div>

          {Array.isArray(ai.possibleConditions) &&
          ai.possibleConditions.length > 0 ? (
            <div>
              <p className="font-semibold text-slate-800">
                Possible conditions (informational)
              </p>
              <ul className="mt-1 list-inside list-disc text-slate-700">
                {ai.possibleConditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {Array.isArray(ai.recommendedSpecialties) &&
          ai.recommendedSpecialties.length > 0 ? (
            <div>
              <p className="font-semibold text-slate-800">
                Suggested specialties
              </p>
              <ul className="mt-1 list-inside list-disc text-slate-700">
                {ai.recommendedSpecialties.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {ai.advice ? (
            <p className="text-slate-700">
              <span className="font-semibold text-slate-800">Advice:</span>{" "}
              {ai.advice}
            </p>
          ) : null}

          {ai.disclaimer ? (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
              {ai.disclaimer}
            </p>
          ) : null}

          {result.checkId ? (
            <p className="text-xs text-slate-500">Check ID: {String(result.checkId)}</p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-6 text-center">
        <Link
          to="/symptoms/history"
          className="text-sm font-medium text-teal-700 underline"
        >
          View past checks
        </Link>
      </p>
    </section>
  );
}

export function SymptomHistoryPage() {
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${SYMPTOM_API}/history?patientId=${encodeURIComponent(patientId)}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load history");
      }
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">
        Symptom check history
      </h1>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-200 focus:ring-2"
        />
        <button
          type="button"
          onClick={load}
          disabled={!patientId || loading}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      <ul className="mt-6 space-y-3">
        {items.map((row) => (
          <li
            key={row._id}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700"
          >
            <p className="font-medium text-slate-900">
              {new Date(row.createdAt).toLocaleString()}
            </p>
            <p className="mt-1">
              <span className="text-slate-500">Symptoms:</span>{" "}
              {(row.symptoms || []).join(", ")}
            </p>
            {row.aiResponse?.urgencyLevel ? (
              <p className="mt-1 text-xs">
                Urgency:{" "}
                <span className="font-medium">
                  {row.aiResponse.urgencyLevel}
                </span>
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center">
        <Link
          to="/symptoms"
          className="text-sm font-medium text-teal-700 underline"
        >
          New check
        </Link>
      </p>
    </section>
  );
}
