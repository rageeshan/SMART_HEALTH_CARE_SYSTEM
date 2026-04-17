const Appointment = require('../models/Appointment');
const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000/api/auth';
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5003/api/doctors';
const TELEMEDICINE_SERVICE_URL =
  process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:5006/api/sessions';
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005/api/notifications';

async function sendEmailNotification({ appointmentId, userId, email, message }) {
  if (!email) return;
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/send-test`, {
      appointmentId,
      userId,
      email,
      message,
    });
  } catch (err) {
    console.warn('Notification failed:', err?.response?.data?.message ?? err.message);
  }
}

function getDayOfWeek(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

function parseTimeSlot(slot) {
  const raw = String(slot || '').trim();
  const parts = raw.split('-').map((p) => p.trim());
  if (parts.length !== 2) return null;
  const [start, end] = parts;
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return null;
  return { start, end };
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private (Patient)
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot, symptoms } = req.body;
    
    if (!doctorId) {
      return res.status(400).json({ message: 'doctorId is required' });
    }
    if (!date) {
      return res.status(400).json({ message: 'date is required' });
    }
    if (!timeSlot) {
      return res.status(400).json({ message: 'timeSlot is required' });
    }

    const dayOfWeek = getDayOfWeek(date);
    if (!dayOfWeek) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    const parsedSlot = parseTimeSlot(timeSlot);
    if (!parsedSlot) {
      return res.status(400).json({ message: 'Invalid timeSlot format. Use "HH:mm - HH:mm".' });
    }

    // Check if doctor exists via auth-service (verified + active doctors list)
    // and capture doctor email for notifications.
    let doctorEmail = null;
    try {
      const { data } = await axios.get(`${AUTH_SERVICE_URL}/doctors`, {
        headers: { authorization: req.headers.authorization },
      });

      const doctors = Array.isArray(data?.data) ? data.data : [];
      const doctor = doctors.find((d) => String(d?._id) === String(doctorId));
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found or not verified' });
      }
      doctorEmail = doctor.email ?? null;
    } catch (err) {
      return res.status(500).json({ message: 'Error communicating with auth-service' });
    }

    // Check if doctor has published availability for that day, and slot is within it
    try {
      const { data } = await axios.get(`${DOCTOR_SERVICE_URL}/user/${doctorId}/availability`);
      const availability = Array.isArray(data?.availability) ? data.availability : [];

      const slotStart = toMinutes(parsedSlot.start);
      const slotEnd = toMinutes(parsedSlot.end);
      const allowed = availability.some((a) => {
        if (a.dayOfWeek !== dayOfWeek) return false;
        const aStart = toMinutes(a.startTime);
        const aEnd = toMinutes(a.endTime);
        return slotStart >= aStart && slotEnd <= aEnd;
      });

      if (!allowed) {
        return res.status(400).json({ message: `Selected time slot is not available for ${dayOfWeek}` });
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(400).json({ message: 'Doctor has not published availability yet' });
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
      patientEmail: req.user.email ?? null,
      doctorEmail,
      date,
      timeSlot,
      symptoms
    });

    // Notify doctor of new booking (best-effort)
    await sendEmailNotification({
      appointmentId: appointment._id,
      userId: doctorId,
      email: doctorEmail,
      message: `New appointment request: ${new Date(date).toDateString()} ${timeSlot}.`,
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
    const appointments = await Appointment.find({
      doctorId: req.user.userId,
    }).sort({ date: 1 });
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
    
    // Manual pseudo-populate doctorId from auth-service verified doctors list
    let doctorsMap = {};
    try {
      const { data } = await axios.get(`${AUTH_SERVICE_URL}/doctors`, {
        headers: { authorization: req.headers.authorization },
      });
      const doctors = Array.isArray(data?.data) ? data.data : [];
      doctors.forEach((doc) => {
        doctorsMap[String(doc._id)] = {
          name: doc.fullName,
          email: doc.email,
        };
      });
    } catch (err) {
      // Not fatal: still return appointments, just without doctor details
      console.error('Failed to fetch doctors', err.message);
    }

    // Attach doctor details to appointments
    const populatedAppts = appointments.map(appt => {
      let docData = doctorsMap[String(appt.doctorId)] || {
        name: 'Unknown',
        email: 'Unknown',
      };
      return {
        ...appt._doc,
        doctorId: {
          _id: appt.doctorId,
          name: docData.name,
          email: docData.email,
        },
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

    if (String(appointment.doctorId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized for this appointment' });
    }

    appointment.status = status;

    // When approved, create (or reuse) telemedicine session and notify both sides.
    if (status === 'APPROVED') {
      try {
        const { data: session } = await axios.post(`${TELEMEDICINE_SERVICE_URL}/create`, {
          appointmentId: String(appointment._id),
          doctorId: String(appointment.doctorId),
          patientId: String(appointment.patientId),
        });

        appointment.telemedicine = {
          roomId: session.roomId ?? null,
          meetingUrl: session.meetingUrl ?? null,
          status: session.status ?? null,
        };

        const when = `${new Date(appointment.date).toDateString()} ${appointment.timeSlot}`;
        const link = appointment.telemedicine.meetingUrl
          ? ` Join link: ${appointment.telemedicine.meetingUrl}`
          : '';

        await sendEmailNotification({
          appointmentId: appointment._id,
          userId: appointment.patientId,
          email: appointment.patientEmail,
          message: `Your appointment was approved for ${when}.${link}`,
        });
        await sendEmailNotification({
          appointmentId: appointment._id,
          userId: appointment.doctorId,
          email: appointment.doctorEmail,
          message: `Appointment approved for ${when}.${link}`,
        });
      } catch (err) {
        console.warn('Telemedicine session create failed:', err?.response?.data?.message ?? err.message);
      }
    }

    if (status === 'REJECTED') {
      await sendEmailNotification({
        appointmentId: appointment._id,
        userId: appointment.patientId,
        email: appointment.patientEmail,
        message: `Your appointment request was rejected.`,
      });
    }

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

    if (String(appointment.doctorId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized for this appointment' });
    }

    appointment.prescription = prescription;
    appointment.status = 'COMPLETED'; // auto complete when prescription is issued
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update appointment payment status (internal)
// @route   PATCH /api/appointments/:id/payment-status
// @access  Internal service call
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const allowed = ['pending', 'paid', 'failed', 'refunded'];
    if (!allowed.includes(String(paymentStatus))) {
      return res.status(400).json({ message: 'Invalid paymentStatus' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.paymentStatus = paymentStatus;
    await appointment.save();

    return res.status(200).json(appointment);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
