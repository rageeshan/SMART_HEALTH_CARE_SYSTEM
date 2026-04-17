import React from 'react';
import { useApp } from '../context/AppContext';
import { CalendarCheck, Clock, FileText } from 'lucide-react';

const MyAppointments = () => {
  const { getPatientAppointments } = useApp();
  const appointments = getPatientAppointments();

  const getStatusClass = (status) => status.toLowerCase();

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="page-subtitle">Track your upcoming and past appointments</p>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="empty-state">
          <CalendarCheck size={48} />
          <h3>No Appointments Yet</h3>
          <p>Book your first appointment from the Find Doctors page.</p>
        </div>
      ) : (
        <div className="appointment-list">
          {appointments.map((app, i) => (
            <div key={app._id} className="glass-panel appointment-card fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="appt-left">
                <div className="appt-date-block">
                  <span className="appt-day">{new Date(app.date).getDate()}</span>
                  <span className="appt-month">{new Date(app.date).toLocaleString('default', { month: 'short' })}</span>
                </div>
              </div>
              <div className="appt-body">
                <div className="appt-top-row">
                  <h3>{app.doctor?.name || 'Doctor'}</h3>
                  <span className={`badge badge-${getStatusClass(app.status)}`}>{app.status}</span>
                </div>
                <p className="text-muted">{app.doctor?.specialty}</p>
                <div className="appt-meta">
                  <span><Clock size={14} /> {app.timeSlot}</span>
                </div>
                <p className="appt-symptoms"><strong>Symptoms:</strong> {app.symptoms}</p>
                {app.telemedicine?.meetingUrl ? (
                  <div className="prescription-box">
                    <span>
                      <strong>Telemedicine:</strong>{' '}
                      <a href={app.telemedicine.meetingUrl} target="_blank" rel="noreferrer">
                        Join meeting
                      </a>
                    </span>
                  </div>
                ) : null}
                {app.prescription && (
                  <div className="prescription-box">
                    <FileText size={14} />
                    <span>{app.prescription}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
