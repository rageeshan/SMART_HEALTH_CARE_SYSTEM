import React from 'react';
import { NavLink } from 'react-router-dom';
import { getRole } from '../services/api';
import {
  Search,
  CalendarCheck,
  LayoutDashboard,
  Clock,
  UserCog,
  Stethoscope,
} from 'lucide-react';

const Sidebar = () => {
  const role = getRole();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Stethoscope size={22} />
        </div>
        <span>SmartCare</span>
      </div>

      <nav className="nav-links">
        {role === 'Patient' ? (
          <>
            <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
              <Search size={19} />
              Find Doctors
            </NavLink>
            <NavLink to="/my-appointments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <CalendarCheck size={19} />
              My Appointments
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/doctor/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <LayoutDashboard size={19} />
              Dashboard
            </NavLink>
            <NavLink to="/doctor/availability" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Clock size={19} />
              My Availability
            </NavLink>
            <NavLink to="/doctor/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <UserCog size={19} />
              My Profile
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-role-badge">{role === 'Patient' ? '🩺 Patient' : '👨‍⚕️ Doctor'}</div>
      </div>
    </aside>
  );
};

export default Sidebar;
