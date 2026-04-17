import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const telemedicineBase =
  import.meta.env.VITE_TELEMEDICINE_API || "http://localhost:5003";
const notificationBase =
  import.meta.env.VITE_NOTIFICATION_API || "http://localhost:5004";

const telemedicineApi = axios.create({ baseURL: telemedicineBase });
const notificationApi = axios.create({ baseURL: notificationBase });

const initialSessionForm = {
  appointmentId: "",
  doctorId: "",
  patientId: ""
};

const initialNotificationForm = {
  appointmentId: "",
  userId: "",
  email: "",
  phone: "",
  message: ""
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

function StatusCard({ title, subtitle, status, detail }) {
  return (
    <div className="status-card">
      <div className="status-card__top">
        <div>
          <p className="eyebrow">{title}</p>
          <h3>{subtitle}</h3>
        </div>
        <span className={`badge badge--${status}`}>{status}</span>
      </div>
      <p className="muted">{detail}</p>
    </div>
  );
}

function App() {
  const [serviceStatus, setServiceStatus] = useState({
    telemedicine: { state: "loading", detail: "Checking telemedicine service..." },
    notification: { state: "loading", detail: "Checking notification service..." }
  });
  const [sessionForm, setSessionForm] = useState(initialSessionForm);
  const [notificationForm, setNotificationForm] = useState(initialNotificationForm);
  const [sessionLookupId, setSessionLookupId] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [uiMessage, setUiMessage] = useState({
    type: "info",
    text: "Use this dashboard to manage video consultations and notification testing."
  });
  const [loading, setLoading] = useState({
    health: false,
    session: false,
    notification: false,
    logs: false
  });

  const stats = useMemo(() => {
    const sentCount = notificationLogs.filter((log) => log.status === "sent").length;
    const failedCount = notificationLogs.filter((log) => log.status === "failed").length;
    return {
      totalLogs: notificationLogs.length,
      sentCount,
      failedCount
    };
  }, [notificationLogs]);

  const updateMessage = (type, text) => {
    setUiMessage({ type, text });
  };

  const loadHealth = async () => {
    setLoading((prev) => ({ ...prev, health: true }));
    try {
      const [telemedicineResponse, notificationResponse] = await Promise.allSettled([
        telemedicineApi.get("/health"),
        notificationApi.get("/health")
      ]);

      setServiceStatus({
        telemedicine:
          telemedicineResponse.status === "fulfilled"
            ? { state: "online", detail: telemedicineResponse.value.data.service }
            : { state: "offline", detail: getErrorMessage(telemedicineResponse.reason) },
        notification:
          notificationResponse.status === "fulfilled"
            ? { state: "online", detail: notificationResponse.value.data.service }
            : { state: "offline", detail: getErrorMessage(notificationResponse.reason) }
      });
    } finally {
      setLoading((prev) => ({ ...prev, health: false }));
    }
  };

  const loadLogs = async () => {
    setLoading((prev) => ({ ...prev, logs: true }));
    try {
      const response = await notificationApi.get("/api/notifications/logs");
      setNotificationLogs(response.data);
    } catch (error) {
      updateMessage("error", `Unable to load logs. ${getErrorMessage(error)}`);
    } finally {
      setLoading((prev) => ({ ...prev, logs: false }));
    }
  };

  useEffect(() => {
    loadHealth();
    loadLogs();
  }, []);

  const handleSessionInput = (event) => {
    const { name, value } = event.target;
    setSessionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationInput = (event) => {
    const { name, value } = event.target;
    setNotificationForm((prev) => ({ ...prev, [name]: value }));
  };

  const createSession = async (event) => {
    event.preventDefault();
    setLoading((prev) => ({ ...prev, session: true }));

    try {
      const response = await telemedicineApi.post("/api/sessions/create", sessionForm);
      setActiveSession(response.data);
      setSessionLookupId(response.data.appointmentId);
      updateMessage("success", "Session created successfully. Meeting room is ready.");
    } catch (error) {
      updateMessage("error", `Create session failed. ${getErrorMessage(error)}`);
    } finally {
      setLoading((prev) => ({ ...prev, session: false }));
    }
  };

  const fetchSession = async () => {
    if (!sessionLookupId.trim()) {
      updateMessage("warning", "Enter an appointment ID to fetch a session.");
      return;
    }

    setLoading((prev) => ({ ...prev, session: true }));
    try {
      const response = await telemedicineApi.get(`/api/sessions/${sessionLookupId.trim()}`);
      setActiveSession(response.data);
      updateMessage("success", "Session fetched successfully.");
    } catch (error) {
      updateMessage("error", `Fetch session failed. ${getErrorMessage(error)}`);
    } finally {
      setLoading((prev) => ({ ...prev, session: false }));
    }
  };

  const changeSessionState = async (action) => {
    if (!activeSession?.appointmentId) {
      updateMessage("warning", "Create or fetch a session first.");
      return;
    }

    setLoading((prev) => ({ ...prev, session: true }));
    try {
      const response = await telemedicineApi.patch(
        `/api/sessions/${activeSession.appointmentId}/${action}`
      );
      setActiveSession(response.data);
      updateMessage(
        "success",
        action === "join"
          ? "Session marked as joined."
          : "Session marked as ended."
      );
    } catch (error) {
      updateMessage("error", `${action} session failed. ${getErrorMessage(error)}`);
    } finally {
      setLoading((prev) => ({ ...prev, session: false }));
    }
  };

  const sendNotification = async (event) => {
    event.preventDefault();
    setLoading((prev) => ({ ...prev, notification: true }));

    try {
      await notificationApi.post("/api/notifications/send-test", notificationForm);
      updateMessage("success", "Notification request processed. Check logs below.");
      await loadLogs();
    } catch (error) {
      updateMessage("error", `Notification send failed. ${getErrorMessage(error)}`);
    } finally {
      setLoading((prev) => ({ ...prev, notification: false }));
    }
  };

  return (
    <div className="page-shell">
      <div className="app-frame">
        <aside className="sidebar">
          <div className="brand-block">
            <div className="brand-icon">+</div>
            <div>
              <strong>Balance Care</strong>
              <span>Telemedicine Suite</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button className="nav-item nav-item--active">Overview</button>
            <button className="nav-item">Telemedicine</button>
            <button className="nav-item">Notifications</button>
            <button className="nav-item">Session Logs</button>
            <button className="nav-item">Monitoring</button>
          </nav>

          <div className="sidebar-footer">
            <p className="sidebar-footer__label">Quick Status</p>
            <div className="mini-status">
              <span>Telemedicine</span>
              <strong>{serviceStatus.telemedicine.state}</strong>
            </div>
            <div className="mini-status">
              <span>Notifications</span>
              <strong>{serviceStatus.notification.state}</strong>
            </div>
          </div>
        </aside>

        <div className="content-shell">
          <header className="topbar">
            <div>
              <p className="eyebrow">Dashboard</p>
              <h1>Telemedicine and Notification Command Center</h1>
            </div>
            <div className="topbar-actions">
              <div className="search-chip">Search</div>
              <button className="button button--secondary" onClick={loadHealth}>
                Refresh Status
              </button>
            </div>
          </header>

          <section className="hero-panel">
            <div className="hero-copy">
              <p className="eyebrow">Smart Health Care System</p>
              <h2>Welcome back, Pasindu</h2>
              <p className="hero-text">
                Manage secure consultation rooms, test message delivery, and
                monitor service activity from one healthcare dashboard.
              </p>
              <div className="hero-actions">
                <button className="button button--primary" onClick={loadHealth}>
                  Refresh Service Status
                </button>
                <button className="button button--secondary" onClick={loadLogs}>
                  Refresh Logs
                </button>
              </div>
            </div>

            <div className="hero-visual">
              <div className="doctor-card">
                <div className="doctor-avatar">DR</div>
                <div>
                  <p className="doctor-name">Virtual Care Room</p>
                  <span className="doctor-role">Telemedicine Workspace</span>
                </div>
              </div>
              <div className="wave-card">
                <span>Active Monitoring</span>
                <strong>{stats.totalLogs + 86} bpm</strong>
                <div className="wave-line" />
              </div>
            </div>
          </section>

          <section className="summary-grid">
            <div className="metric-card">
              <span>Total Logs</span>
              <strong>{stats.totalLogs}</strong>
            </div>
            <div className="metric-card">
              <span>Sent</span>
              <strong>{stats.sentCount}</strong>
            </div>
            <div className="metric-card">
              <span>Failed</span>
              <strong>{stats.failedCount}</strong>
            </div>
            <div className="metric-card">
              <span>Meeting Ready</span>
              <strong>{activeSession?.roomId ? "Yes" : "No"}</strong>
            </div>
          </section>

          <section className="status-grid">
            <StatusCard
              title="Telemedicine Service"
              subtitle="Video session lifecycle"
              status={serviceStatus.telemedicine.state}
              detail={serviceStatus.telemedicine.detail}
            />
            <StatusCard
              title="Notification Service"
              subtitle="Email, SMS and delivery logs"
              status={serviceStatus.notification.state}
              detail={serviceStatus.notification.detail}
            />
            <StatusCard
              title="Backend URLs"
              subtitle="API endpoints in use"
              status="connected"
              detail={`${telemedicineBase} | ${notificationBase}`}
            />
          </section>

          <section className={`alert-banner alert-banner--${uiMessage.type}`}>
            {uiMessage.text}
          </section>

          <main className="dashboard-grid">
            <section className="panel">
              <div className="panel__header">
                <div>
                  <p className="eyebrow">Telemedicine</p>
                  <h2>Create and control sessions</h2>
                </div>
              </div>

              <form className="form-grid" onSubmit={createSession}>
                <label>
                  Appointment ID
                  <input
                    name="appointmentId"
                    value={sessionForm.appointmentId}
                    onChange={handleSessionInput}
                    placeholder="APT_1001"
                    required
                  />
                </label>
                <label>
                  Doctor ID
                  <input
                    name="doctorId"
                    value={sessionForm.doctorId}
                    onChange={handleSessionInput}
                    placeholder="DOC_1"
                    required
                  />
                </label>
                <label>
                  Patient ID
                  <input
                    name="patientId"
                    value={sessionForm.patientId}
                    onChange={handleSessionInput}
                    placeholder="PAT_1"
                    required
                  />
                </label>
                <button className="button button--primary" type="submit" disabled={loading.session}>
                  {loading.session ? "Processing..." : "Create Session"}
                </button>
              </form>

              <div className="inline-tools">
                <input
                  value={sessionLookupId}
                  onChange={(event) => setSessionLookupId(event.target.value)}
                  placeholder="Enter appointment ID to fetch"
                />
                <button className="button button--secondary" onClick={fetchSession}>
                  Fetch Session
                </button>
              </div>

              <div className="action-row">
                <button
                  className="button button--secondary"
                  onClick={() => changeSessionState("join")}
                  disabled={loading.session}
                >
                  Join Session
                </button>
                <button
                  className="button button--danger"
                  onClick={() => changeSessionState("end")}
                  disabled={loading.session}
                >
                  End Session
                </button>
                {activeSession?.meetingUrl ? (
                  <a
                    className="button button--ghost"
                    href={activeSession.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Meeting Link
                  </a>
                ) : null}
              </div>

              <div className="session-card">
                <div className="session-card__header">
                  <h3>Current Session Snapshot</h3>
                  <span className={`badge badge--${activeSession?.status || "idle"}`}>
                    {activeSession?.status || "idle"}
                  </span>
                </div>
                {activeSession ? (
                  <div className="session-details">
                    <div>
                      <span>Appointment</span>
                      <strong>{activeSession.appointmentId}</strong>
                    </div>
                    <div>
                      <span>Doctor</span>
                      <strong>{activeSession.doctorId}</strong>
                    </div>
                    <div>
                      <span>Patient</span>
                      <strong>{activeSession.patientId}</strong>
                    </div>
                    <div>
                      <span>Room ID</span>
                      <strong>{activeSession.roomId}</strong>
                    </div>
                    <div className="session-link">
                      <span>Meeting URL</span>
                      <a href={activeSession.meetingUrl} target="_blank" rel="noreferrer">
                        {activeSession.meetingUrl}
                      </a>
                    </div>
                    <div>
                      <span>Started</span>
                      <strong>{formatDate(activeSession.startedAt)}</strong>
                    </div>
                    <div>
                      <span>Ended</span>
                      <strong>{formatDate(activeSession.endedAt)}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="muted">No session selected yet. Create or fetch a session to begin.</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel__header">
                <div>
                  <p className="eyebrow">Notifications</p>
                  <h2>Send test SMS and email</h2>
                </div>
              </div>

              <form className="form-grid" onSubmit={sendNotification}>
                <label>
                  Appointment ID
                  <input
                    name="appointmentId"
                    value={notificationForm.appointmentId}
                    onChange={handleNotificationInput}
                    placeholder="APT_1001"
                  />
                </label>
                <label>
                  User ID
                  <input
                    name="userId"
                    value={notificationForm.userId}
                    onChange={handleNotificationInput}
                    placeholder="PAT_1"
                  />
                </label>
                <label>
                  Email Address
                  <input
                    name="email"
                    type="email"
                    value={notificationForm.email}
                    onChange={handleNotificationInput}
                    placeholder="patient@example.com"
                  />
                </label>
                <label>
                  Phone Number
                  <input
                    name="phone"
                    value={notificationForm.phone}
                    onChange={handleNotificationInput}
                    placeholder="+94712345678"
                  />
                </label>
                <label className="full-width">
                  Message
                  <textarea
                    name="message"
                    rows="4"
                    value={notificationForm.message}
                    onChange={handleNotificationInput}
                    placeholder="Your session is confirmed and ready."
                  />
                </label>
                <button
                  className="button button--primary"
                  type="submit"
                  disabled={loading.notification}
                >
                  {loading.notification ? "Sending..." : "Send Test Notification"}
                </button>
              </form>

              <div className="hint-box">
                <h3>Testing Notes</h3>
                <p>
                  SMS uses the current mock service, so it can log as sent locally.
                  Email requires valid credentials in `notification-service/.env`.
                </p>
              </div>
            </section>
          </main>

          <section className="panel panel--logs">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Audit Trail</p>
                <h2>Recent notification logs</h2>
              </div>
              <button className="button button--secondary" onClick={loadLogs}>
                {loading.logs ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="logs-table-wrap">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Appointment</th>
                    <th>Message</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationLogs.length ? (
                    notificationLogs.map((log) => (
                      <tr key={log._id}>
                        <td>{log.recipient}</td>
                        <td>{log.type}</td>
                        <td>
                          <span className={`badge badge--${log.status}`}>{log.status}</span>
                        </td>
                        <td>{log.appointmentId || "-"}</td>
                        <td className="message-cell">{log.message}</td>
                        <td>{formatDate(log.createdAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        No notification logs found yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
