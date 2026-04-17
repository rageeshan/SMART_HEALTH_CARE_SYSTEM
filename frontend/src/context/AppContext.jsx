import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { getRole, getUserId } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);

  const role = getRole();
  const userId = getUserId();

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (e) { console.error('Failed to fetch doctors', e); }
  }, []);

  const fetchDoctorProfile = useCallback(async () => {
    try {
      const res = await api.get('/doctors/me');
      setCurrentDoc(res.data);
    } catch (e) {
      console.error('Failed to fetch doctor profile', e);
      setCurrentDoc(null);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const endpoint = role === 'Doctor' ? '/appointments/doctor' : '/appointments/patient';
      const res = await api.get(endpoint);
      setAppointments(res.data);
    } catch (e) { console.error('Failed to fetch appointments', e); }
  }, [role]);

  useEffect(() => {
    if (!userId) return; // if not logged in, don't fetch

    if (role === 'Patient') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDoctors();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAppointments();
    } else if (role === 'Doctor') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDoctorProfile();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAppointments();
    }
  }, [role, userId, fetchDoctors, fetchAppointments, fetchDoctorProfile]);

  const bookAppointment = async (doctorId, bookingData) => {
    try {
      const res = await api.post('/appointments', { doctorId, ...bookingData });
      setAppointments(prev => [...prev, res.data]);
      return res.data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const res = await api.patch(`/appointments/${appointmentId}/status`, { status });
      setAppointments(prev => prev.map(a => a._id === appointmentId ? res.data : a));
      return res.data;
    } catch (e) { console.error(e); }
  };

  const issuePrescription = async (appointmentId, prescription) => {
    try {
      const res = await api.patch(`/appointments/${appointmentId}/prescription`, { prescription });
      setAppointments(prev => prev.map(a => a._id === appointmentId ? res.data : a));
      return res.data;
    } catch (e) { console.error(e); }
  };

  const updateDoctor = async (doctorId, updatedFields) => {
    try {
      // Create if doesn't exist, update if it does.
      let res;
      if (currentDoc) {
        res = await api.put('/doctors/me', updatedFields);
      } else {
        res = await api.post('/doctors', updatedFields);
      }
      setCurrentDoc(res.data);
    } catch (e) { console.error(e); }
  };

  const getPatientAppointments = () => appointments;
  const getDoctorAppointments = () => appointments;
  const getCurrentDoctor = () => currentDoc;

  return (
    <AppContext.Provider value={{
      doctors,
      appointments,
      currentDoc,
      getCurrentDoctor,
      bookAppointment,
      updateAppointmentStatus,
      issuePrescription,
      updateDoctor,
      getPatientAppointments,
      getDoctorAppointments,
      currentDoctorId: currentDoc?._id,
      fetchDoctorProfile
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);
