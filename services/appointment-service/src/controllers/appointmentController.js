const Appointment = require('../models/Appointment');
const axios = require('axios');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5003/api/doctors';

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private (Patient)
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, symptoms } = req.body;
    
    // Check if doctor exists via HTTP call to doctor-service
    try {
      await axios.get(`${DOCTOR_SERVICE_URL}/${doctorId}`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      return res.status(500).json({ message: 'Error communicating with doctor-service' });
    }

    // Check if slot is already booked
    const existing = await Appointment.findOne({ doctorId, date, timeSlot, status: { $in: ['PENDING', 'APPROVED'] } });
    if (existing) {
      return res.status(400).json({ message: 'Time slot already taken' });
    }

    const appointment = await Appointment.create({
      doctorId,
      patientId: req.user.userId,
      date,
      timeSlot,
      symptoms
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctor
// @access  Private (Doctor)
exports.getDoctorAppointments = async (req, res) => {
  try {
    // Get doctor profile via HTTP call
    let doctor;
    try {
      const response = await axios.get(`${DOCTOR_SERVICE_URL}/me`, {
        headers: {
          'x-mock-user': JSON.stringify({ userId: req.user.userId, role: 'Doctor' })
        }
      });
      doctor = response.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      return res.status(500).json({ message: 'Error communicating with doctor-service' });
    }

    const appointments = await Appointment.find({ doctorId: doctor._id }).sort({ date: 1 });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get patient's appointments
// @route   GET /api/appointments/patient
// @access  Private (Patient)
exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.userId });
    
    // Manual pseudo-populate for doctorId
    let doctorsMap = {};
    try {
      // Fetch all docs to create a lookup map
      const { data: doctors } = await axios.get(DOCTOR_SERVICE_URL);
      doctors.forEach(doc => {
        doctorsMap[doc._id] = { name: doc.name, specialty: doc.specialty };
      });
    } catch (err) {
      console.error('Failed to fetch doctors', err.message);
    }

    // Attach doctor details to appointments
    const populatedAppts = appointments.map(appt => {
      let docData = doctorsMap[appt.doctorId] || { name: 'Unknown', specialty: 'Unknown' };
      return {
        ...appt._doc,
        doctorId: {
          _id: appt.doctorId,
          name: docData.name,
          specialty: docData.specialty
        }
      };
    });

    res.status(200).json(populatedAppts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private (Doctor)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body; // APPROVED, REJECTED, COMPLETED
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.status = status;
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Issue prescription
// @route   PATCH /api/appointments/:id/prescription
// @access  Private (Doctor)
exports.issuePrescription = async (req, res) => {
  try {
    const { prescription } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.prescription = prescription;
    appointment.status = 'COMPLETED'; // auto complete when prescription is issued
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
