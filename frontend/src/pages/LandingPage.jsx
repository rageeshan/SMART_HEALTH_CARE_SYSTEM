import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Card, CardBody } from '../components/ui/Card.jsx'
import { Logo } from '../components/layout/Logo.jsx'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Create account</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              OTP-gated access
              <span className="rounded-full bg-white px-2 py-0.5 text-slate-700">
                JWT session
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Smart Health Care System Portal
            </h1>

            <p className="mt-4 max-w-xl text-base text-slate-600">
              Register and log in through OTP verification. After OTP success, a
              JWT token is attached automatically to auth/patient API calls, and
              the UI protects routes by your role (patient, doctor, admin).
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg">Create account</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Continue with login
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Card className="h-full">
                <CardBody>
                  <div className="text-sm font-semibold text-slate-900">
                    OTP steps that match the backend
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    OTP for registration activation and OTP for login
                    verification are separate screens, so you can track progress
                    without guessing.
                  </div>
                </CardBody>
              </Card>

              <Card className="h-full">
                <CardBody>
                  <div className="text-sm font-semibold text-slate-900">
                    Session safety built into the UI
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    When the token expires (401), the client clears local
                    storage and redirects to login. You do not get stuck on a
                    protected route.
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Role quick actions</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Patient
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Profile + medical history
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Create/edit profile and view your own records.
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Doctor
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Patient lookup by ID
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Open a patient, review history, add/update/delete records.
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Admin
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Governance controls
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Activate/deactivate users, verify doctors, and manage patient profiles.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-tr from-sky-200/40 via-emerald-200/20 to-transparent blur-2xl" />

            <div className="relative rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">
                Clinician workflow preview
              </div>
              <div className="mt-1 text-sm text-slate-600">
                The doctor dashboard is organized around patient ID → profile → history
                → record actions.
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    1. Lookup
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Search patient by ID and open their page
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    The UI fetches profile and medical history for that ID.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    2. Review
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Read history with clear status badges
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Records are listed in a table and formatted consistently for quick scanning.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    3. Act
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    Add / update / delete medical history records
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Mutations are routed through the patient-service API layer.
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Card>
                  <CardBody>
                    <div className="text-sm font-semibold text-slate-900">Patient path</div>
                    <div className="mt-2 text-sm text-slate-600">
                      If no profile exists, the patient dashboard shows a create profile
                      form instead of an empty screen.
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="text-sm font-semibold text-slate-900">Admin path</div>
                    <div className="mt-2 text-sm text-slate-600">
                      Admin user management includes actions for activation state and doctor verification.
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-500">
          Built to integrate with `auth-service` and `patient-service` using a centralized Axios layer, protected routes,
          role-aware dashboards, and responsive UI components designed for real workflows.
        </footer>
      </main>
    </div>
  )
}

