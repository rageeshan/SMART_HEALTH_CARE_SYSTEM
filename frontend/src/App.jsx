import { Route, Routes } from "react-router-dom";
import { PublicRoute, RoleProtectedRoute } from "./router/ProtectedRoute.jsx";
import { ROLE } from "./utils/routes.js";

import { LandingPage } from "./pages/LandingPage.jsx";
import { LoginPage } from "./pages/auth/LoginPage.jsx";
import { RegisterPage } from "./pages/auth/RegisterPage.jsx";
import { VerifyRegisterOtpPage } from "./pages/auth/VerifyRegisterOtpPage.jsx";
import { VerifyLoginOtpPage } from "./pages/auth/VerifyLoginOtpPage.jsx";
import { NotFoundPage } from "./pages/NotFoundPage.jsx";

import { DashboardLayout } from "./layouts/DashboardLayout.jsx";

import { PatientDashboardPage } from "./pages/patient/PatientDashboardPage.jsx";
import { PatientProfileCreatePage } from "./pages/patient/PatientProfileCreatePage.jsx";
import { PatientProfileEditPage } from "./pages/patient/PatientProfileEditPage.jsx";
import { PatientMedicalHistoryPage } from "./pages/patient/PatientMedicalHistoryPage.jsx";
import { PatientBrowseDoctorsPage } from "./pages/patient/PatientBrowseDoctorsPage.jsx";
import { PatientReportsPage } from "./pages/patient/PatientReportsPage.jsx";
import { PatientPrescriptionsPage } from "./pages/patient/PatientPrescriptionsPage.jsx";

import { DoctorDashboardPage } from "./pages/doctor/DoctorDashboardPage.jsx";
import { DoctorPatientPage } from "./pages/doctor/DoctorPatientPage.jsx";

import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage.jsx";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage.jsx";
import { AdminUserDetailsPage } from "./pages/admin/AdminUserDetailsPage.jsx";
import { AdminPatientDetailsPage } from "./pages/admin/AdminPatientDetailsPage.jsx";

// Legacy / standalone pages (not yet integrated into new layout)
import FindDoctors from "./pages/FindDoctors.jsx";
import MyAppointments from "./pages/MyAppointments.jsx";
import DoctorDashboard from "./pages/DoctorDashboard.jsx";
import ManageAvailability from "./pages/ManageAvailability.jsx";
import DoctorProfile from "./pages/DoctorProfile.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Public auth routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-register-otp" element={<VerifyRegisterOtpPage />} />
        <Route path="/verify-login-otp" element={<VerifyLoginOtpPage />} />
      </Route>

      {/* Patient */}
      <Route element={<RoleProtectedRoute allowedRoles={[ROLE.PATIENT]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
          <Route path="/patient/doctors" element={<PatientBrowseDoctorsPage />} />
          <Route
            path="/patient/profile/create"
            element={<PatientProfileCreatePage />}
          />
          <Route path="/patient/profile/edit" element={<PatientProfileEditPage />} />
          <Route
            path="/patient/medical-history"
            element={<PatientMedicalHistoryPage />}
          />
          <Route path="/patient/reports" element={<PatientReportsPage />} />
          <Route
            path="/patient/prescriptions"
            element={<PatientPrescriptionsPage />}
          />
        </Route>
      </Route>

      {/* Doctor */}
      <Route element={<RoleProtectedRoute allowedRoles={[ROLE.DOCTOR]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
          <Route
            path="/doctor/patients/:patientId"
            element={<DoctorPatientPage />}
          />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<RoleProtectedRoute allowedRoles={[ROLE.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/:userId" element={<AdminUserDetailsPage />} />
          <Route
            path="/admin/patients/:patientId"
            element={<AdminPatientDetailsPage />}
          />
        </Route>
      </Route>

      {/* Temporary routes for unconnected pages */}
      <Route path="/legacy/find-doctors" element={<FindDoctors />} />
      <Route path="/legacy/my-appointments" element={<MyAppointments />} />
      <Route path="/legacy/doctor/dashboard" element={<DoctorDashboard />} />
      <Route path="/legacy/doctor/availability" element={<ManageAvailability />} />
      <Route path="/legacy/doctor/profile" element={<DoctorProfile />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
