import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import FindDoctors from './pages/FindDoctors';
import MyAppointments from './pages/MyAppointments';
import DoctorDashboard from './pages/DoctorDashboard';
import ManageAvailability from './pages/ManageAvailability';
import DoctorProfile from './pages/DoctorProfile';
import Login from './pages/Login';
import { AppProvider, useApp } from './context/AppContext';
import { getRole, getUserId, setUserId, setRole } from './services/api';
import { LogOut } from 'lucide-react';
import './App.css';

function AppContent() {
  const role = getRole();
  const userId = getUserId();
  const { currentDoc } = useApp(); // we can use the context to get current doctor details if needed

  const handleLogout = () => {
    setUserId('');
    setRole('');
    window.location.href = '/login';
  };

  if (!userId) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar key={role} />
        <div className="main-wrapper">
          {/* Top bar */}
          <header className="topbar">
            <div className="topbar-left">
              {role === 'Patient' ? (
                <span className="topbar-greeting">👋 Welcome, Patient ({userId})</span>
              ) : (
                <span className="topbar-greeting">👨‍⚕️ Welcome Doctor ({userId})</span>
              )}
            </div>
            <div className="topbar-right">
              <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }} onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </header>

          <main className="main-content">
            <Routes>
              {/* Patient Routes */}
              <Route path="/" element={role === 'Patient' ? <FindDoctors /> : <Navigate to="/doctor/dashboard" />} />
              <Route path="/my-appointments" element={<MyAppointments />} />

              {/* Doctor Routes */}
              <Route path="/doctor/dashboard" element={role === 'Doctor' ? <DoctorDashboard /> : <Navigate to="/" />} />
              <Route path="/doctor/availability" element={<ManageAvailability />} />
              <Route path="/doctor/profile" element={<DoctorProfile />} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

