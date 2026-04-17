import { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  SymptomCheckPage,
  SymptomHistoryPage,
} from "./pages/SymptomCheckPage.jsx";

const PAYMENT_API =
  import.meta.env.VITE_PAYMENT_API_URL || "http://localhost:5008/api/payments";

const INITIAL_FORM = {
  appointmentId: "",
  doctorId: "",
  patientId: "",
  amount: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
};

function PaymentForm() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${PAYMENT_API}/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to initialize payment");
      }

      if (!data.checkoutUrl) {
        throw new Error("Stripe checkout URL is not available");
      }

      window.location.href = data.checkoutUrl;
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">
        Pay Consultation Fee
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Fill the details and continue to Stripe checkout.
      </p>

      <form
        className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        {Object.entries(INITIAL_FORM).map(([field]) => (
          <label key={field} className="text-sm font-medium text-slate-700">
            {field
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (s) => s.toUpperCase())}
            <input
              required
              type={
                field === "email"
                  ? "email"
                  : field === "amount"
                  ? "number"
                  : "text"
              }
              step={field === "amount" ? "0.01" : undefined}
              min={field === "amount" ? "0" : undefined}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 transition focus:ring-2"
            />
          </label>
        ))}

        {error ? (
          <p className="md:col-span-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="md:col-span-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Redirecting..." : "Continue to Stripe"}
        </button>
      </form>
    </section>
  );
}

function PaymentResult({ title, tone }) {
  const location = useLocation();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const sessionId = params.get("session_id");
  const isSuccessPage = location.pathname === "/payment/success";
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!isSuccessPage || !sessionId) {
        return;
      }

      try {
        const response = await fetch(
          `${PAYMENT_API}/stripe/session/${encodeURIComponent(
            sessionId
          )}/verify`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to verify payment");
        }

        setVerifyMessage(`Payment status updated: ${data.status}`);
      } catch (error) {
        setVerifyError(error.message);
      }
    };

    verifyPayment();
  }, [isSuccessPage, sessionId]);

  return (
    <section className="mx-auto w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
      <h2 className={`text-2xl font-semibold ${tone}`}>{title}</h2>
      <p className="mt-2 text-sm text-slate-600">
        Session ID:{" "}
        <span className="font-medium">
          {params.get("session_id") || "Unavailable"}
        </span>
      </p>
      <p className="mt-4 text-sm text-slate-600">
        You can now return to payment dashboard and check status.
      </p>
      {verifyMessage ? (
        <p className="mt-3 text-sm text-emerald-700">{verifyMessage}</p>
      ) : null}
      {verifyError ? (
        <p className="mt-3 text-sm text-rose-700">{verifyError}</p>
      ) : null}
      <Link
        to="/"
        className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Back to Payment Form
      </Link>
    </section>
  );
}

function PaymentStatusPage() {
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);

  const fetchPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${PAYMENT_API}/my?patientId=${encodeURIComponent(patientId)}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load payments");
      }
      setPayments(data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-6 w-full max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">
        Check Payment Status
      </h2>
      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          placeholder="Enter patient ID"
          value={patientId}
          onChange={(event) => setPatientId(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring-2"
        />
        <button
          type="button"
          onClick={fetchPayments}
          disabled={!patientId || loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-5 space-y-3">
        {payments.map((payment) => (
          <article
            key={payment._id}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
          >
            <p>
              <span className="font-semibold">Order:</span>{" "}
              {payment.gatewayOrderId}
            </p>
            <p>
              <span className="font-semibold">Amount:</span> LKR{" "}
              {payment.amount.toFixed(2)}
            </p>
            <p>
              <span className="font-semibold">Status:</span> {payment.status}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AppLayout() {
  return (
    <main className="min-h-screen px-4 py-10">
      <nav className="mx-auto mb-6 flex max-w-3xl flex-wrap gap-3 text-sm">
        <Link className="rounded bg-white px-3 py-2 shadow-sm" to="/">
          Payments
        </Link>
        <Link
          className="rounded bg-white px-3 py-2 shadow-sm"
          to="/payment/status"
        >
          Payment status
        </Link>
        <Link className="rounded bg-white px-3 py-2 shadow-sm" to="/symptoms">
          Symptom check
        </Link>
        <Link
          className="rounded bg-white px-3 py-2 shadow-sm"
          to="/symptoms/history"
        >
          Symptom history
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<PaymentForm />} />
        <Route
          path="/payment/success"
          element={
            <PaymentResult title="Payment Successful" tone="text-emerald-600" />
          }
        />
        <Route
          path="/payment/cancel"
          element={
            <PaymentResult title="Payment Cancelled" tone="text-amber-600" />
          }
        />
        <Route path="/payment/status" element={<PaymentStatusPage />} />
        <Route path="/symptoms" element={<SymptomCheckPage />} />
        <Route path="/symptoms/history" element={<SymptomHistoryPage />} />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
