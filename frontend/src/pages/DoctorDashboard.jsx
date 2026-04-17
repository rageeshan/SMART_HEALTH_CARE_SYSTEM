import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, X, FileText, Calendar, Clock, Users, AlertCircle } from 'lucide-react';

const DoctorDashboard = () => {
  const { getDoctorAppointments, updateAppointmentStatus, issuePrescription, currentDoctorId, getCurrentDoctor } = useApp();
  const appointments = getDoctorAppointments();
  void getCurrentDoctor;

  const [prescriptionModal, setPrescriptionModal] = useState(null);
  const [prescriptionText, setPrescriptionText] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const handleStatusChange = (id, newStatus) => {
    updateAppointmentStatus(id, newStatus);
  };

  const handlePrescription = (e) => {
    e.preventDefault();
    issuePrescription(prescriptionModal._id, prescriptionText);
    setPrescriptionModal(null);
    setPrescriptionText('');
  };

  const filteredAppointments =
    activeTab === 'all' ? appointments : appointments.filter((a) => a.status === activeTab.toUpperCase());

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'PENDING').length,
    approved: appointments.filter((a) => a.status === 'APPROVED').length,
    completed: appointments.filter((a) => a.status === 'COMPLETED').length,
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctor Dashboard</h1>
          <p className="page-subtitle">Manage your appointments and issue prescriptions</p>
        </div>
      </div>

      {!currentDoctorId ? (
        <div className="empty-state" style={{ marginTop: '40px' }}>
          <Users size={48} />
          <h3>Select Your Doctor Profile</h3>
          <p>Use the dropdown in the top bar to select which doctor you are logged in as.</p>
          <p className="text-muted" style={{ marginTop: '8px', fontSize: '0.85rem' }}>
            Only appointments booked for your profile will be shown here.
          </p>
        </div>
      ) : (
      <>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}><Users size={22} /></div>
          <div>
            <p className="stat-value">{stats.total}</p>
            <p className="stat-label">Total</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: '#FEF9C3', color: '#A16207' }}><AlertCircle size={22} /></div>
          <div>
            <p className="stat-value">{stats.pending}</p>
            <p className="stat-label">Pending</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}><Check size={22} /></div>
          <div>
            <p className="stat-value">{stats.approved}</p>
            <p className="stat-label">Approved</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}><Calendar size={22} /></div>
          <div>
            <p className="stat-value">{stats.completed}</p>
            <p className="stat-label">Completed</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-row">
        {['all', 'pending', 'approved', 'completed', 'rejected'].map((tab) => (
          <button key={tab} className={`tab-btn${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Appointments Table or Empty State */}
      {appointments.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '20px' }}>
          <Calendar size={48} />
          <h3>No Appointments Yet</h3>
          <p>When a patient books an appointment with you, it will appear here for you to approve or reject.</p>
        </div>
      ) : (
        <div className="glass-panel table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Symptoms</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((app) => (
                <tr key={app._id}>
                  <td className="td-bold">{app.patientName || app.patientId}</td>
                  <td>{app.doctor?.name || '—'}</td>
                  <td>{new Date(app.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <span className="time-chip"><Clock size={13} /> {app.timeSlot}</span>
                  </td>
                  <td className="td-symptoms">{app.symptoms}</td>
                  <td>
                    <span className={`badge badge-${app.status.toLowerCase()}`}>{app.status}</span>
                  </td>
                  <td>
                    <div className="action-btns">
                      {app.status === 'PENDING' && (
                        <>
                          <button className="btn-icon btn-approve" title="Approve" onClick={() => handleStatusChange(app._id, 'APPROVED')}>
                            <Check size={16} />
                          </button>
                          <button className="btn-icon btn-reject" title="Reject" onClick={() => handleStatusChange(app._id, 'REJECTED')}>
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {app.status === 'APPROVED' && (
                        <button className="btn btn-sm btn-primary" onClick={() => { setPrescriptionModal(app); setPrescriptionText(app.prescription || ''); }}>
                          <FileText size={14} /> Prescribe
                        </button>
                      )}
                      {app.prescription && (
                        <span className="prescription-indicator" title={app.prescription}>
                          <FileText size={14} /> Rx
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAppointments.length === 0 && (
                <tr><td colSpan="7" className="empty-table">No appointments in this category.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Prescription Modal */}
      {prescriptionModal && (
        <div className="modal-overlay" onClick={() => setPrescriptionModal(null)}>
          <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Issue Prescription</h2>
              <button className="modal-close" onClick={() => setPrescriptionModal(null)}>✕</button>
            </div>
            <p className="text-muted" style={{ marginBottom: '20px' }}>
              Patient: <strong>{prescriptionModal.patientName || prescriptionModal.patientId}</strong> — {prescriptionModal.symptoms}
            </p>
            <form onSubmit={handlePrescription}>
              <div className="form-group">
                <label>Prescription Details</label>
                <textarea
                  className="form-input"
                  rows="5"
                  placeholder="Medications, dosage, instructions..."
                  required
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setPrescriptionModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><FileText size={16} /> Issue Prescription</button>
              </div>
            </form>
          </div>
        </div>
      )}

      </>
      )}
    </div>
  );
};

export default DoctorDashboard;
