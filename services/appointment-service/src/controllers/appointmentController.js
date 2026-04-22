const Appointment = require('../models/Appointment');
const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001/api/auth';
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5004/api/doctors';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:5002/api/patients';
const TELEMEDICINE_SERVICE_URL =
  process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:5006/api/sessions';
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005/api/notifications';

async function sendEmailNotification({ appointmentId, userId, email, subject, message }) {
  if (!email) return;
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/send-test`, {
      appointmentId,
      userId,
      email,
      subject,
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

function getAppointmentWindow(dateValue, slot) {
  const parsedSlot = parseTimeSlot(slot);
  if (!parsedSlot) return null;

  const [startHour, startMinute] = parsedSlot.start.split(':').map(Number);
  const [endHour, endMinute] = parsedSlot.end.split(':').map(Number);
  const day = new Date(dateValue);
  if (Number.isNaN(day.getTime())) return null;

  // Interpret appointment date + slot in a fixed local offset (default +05:30).
  // This avoids server timezone drift causing false "too early" / "too late" checks.
  const offsetMinutes = Number(process.env.APPOINTMENT_TZ_OFFSET_MINUTES ?? 330);
  const year = day.getUTCFullYear();
  const monthIndex = day.getUTCMonth();
  const date = day.getUTCDate();

  const startUtcMs =
    Date.UTC(year, monthIndex, date, startHour, startMinute, 0, 0) -
    offsetMinutes * 60 * 1000;
  const endUtcMs =
    Date.UTC(year, monthIndex, date, endHour, endMinute, 0, 0) -
    offsetMinutes * 60 * 1000;

  const startAt = new Date(startUtcMs);
  const endAt = new Date(endUtcMs);

  return { startAt, endAt };
}

function formatAppointmentWhen(appointment) {
  return `${new Date(appointment.date).toDateString()} at ${appointment.timeSlot}`;
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
      subject: 'New Appointment Request Received',
      message:
        `Dear Doctor,\n\n` +
        `A new appointment request has been submitted for ${new Date(date).toDateString()} at ${timeSlot}.\n` +
        `Please review and respond from your doctor dashboard at your earliest convenience.\n\n` +
        `Regards,\nSmart Health Care System`,
    });
    await sendEmailNotification({
      appointmentId: appointment._id,
      userId: appointment.patientId,
      email: appointment.patientEmail,
      subject: 'Appointment Request Submitted Successfully',
      message:
        `Dear Patient,\n\n` +
        `Your appointment request for ${new Date(date).toDateString()} at ${timeSlot} has been submitted successfully.\n` +
        `You will receive another notification once your doctor approves the appointment.\n\n` +
        `Regards,\nSmart Health Care System`,
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
          subject: 'Appointment Approved',
          message:
            `Dear Patient,\n\n` +
            `Your appointment has been approved for ${when}.\n` +
            `${appointment.telemedicine.meetingUrl ? `Meeting Link: ${appointment.telemedicine.meetingUrl}\n` : ''}` +
            `Please join on time.\n\nRegards,\nSmart Health Care System`,
        });
        await sendEmailNotification({
          appointmentId: appointment._id,
          userId: appointment.doctorId,
          email: appointment.doctorEmail,
          subject: 'Appointment Approval Confirmed',
          message:
            `Dear Doctor,\n\n` +
            `You have approved the appointment scheduled for ${when}.\n` +
            `${appointment.telemedicine.meetingUrl ? `Meeting Link: ${appointment.telemedicine.meetingUrl}\n` : ''}` +
            `You can manage this session from your dashboard.\n\nRegards,\nSmart Health Care System`,
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

    // Forward prescription to patient-service so it appears in patient's Prescriptions tab
    const patientId = String(appointment.patientId);
    const authHeader = req.headers.authorization; // doctor's Bearer token
    let doctorName = req.user?.fullName || req.user?.name || '';
    // Token payload may not contain full name; avoid showing email as doctor name.
    if (!doctorName) {
      try {
        const { data } = await axios.get(`${AUTH_SERVICE_URL}/doctors`, {
          headers: { authorization: req.headers.authorization },
        });
        const doctors = Array.isArray(data?.data) ? data.data : [];
        const doctor = doctors.find((d) => String(d?._id) === String(appointment.doctorId));
        if (doctor?.fullName) doctorName = doctor.fullName;
      } catch (nameErr) {
        console.warn('Doctor name lookup failed:', nameErr?.response?.data?.message ?? nameErr.message);
      }
    }
    if (!doctorName) doctorName = 'Doctor';
    const appointmentWhen = formatAppointmentWhen(appointment);
    try {
      await axios.post(
        `${PATIENT_SERVICE_URL}/${patientId}/prescriptions`,
        {
          medication: prescription,
          doctorName,
          doctorEmail: appointment.doctorEmail || '',
          appointmentId: String(appointment._id),
          appointmentDate: appointment.date,
          appointmentTimeSlot: appointment.timeSlot,
          instructions: `Appointment ID: ${appointment._id}`,
        },
        { headers: { Authorization: authHeader } }
      );
    } catch (fwdErr) {
      // Non-fatal: log but don't fail the appointment update
      console.error('Failed to forward prescription to patient-service:', fwdErr?.response?.data?.message || fwdErr.message);
    }

    // Notify patient by email with prescription details
    await sendEmailNotification({
      appointmentId: appointment._id,
      userId: appointment.patientId,
      email: appointment.patientEmail,
      subject: 'New Prescription Issued',
      message:
        `Dear Patient,\n\n` +
        `Your doctor has issued a new prescription for your recent appointment.\n` +
        `Doctor: ${doctorName}\n` +
        `${appointment.doctorEmail ? `Doctor Email: ${appointment.doctorEmail}\n` : ''}` +
        `Appointment: ${appointmentWhen}\n` +
        `Prescription: ${prescription}\n` +
        `Appointment ID: ${appointment._id}\n\n` +
        `You can also view this in your Patient Dashboard > Prescriptions section.\n\n` +
        `Regards,\nSmart Health Care System`,
    });

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

    if (String(paymentStatus).toLowerCase() === 'paid') {
      const when = formatAppointmentWhen(appointment);
      await sendEmailNotification({
        appointmentId: appointment._id,
        userId: appointment.patientId,
        email: appointment.patientEmail,
        subject: 'Payment Confirmation Received',
        message:
          `Dear Patient,\n\n` +
          `Your payment for appointment ${appointment._id} has been received successfully.\n` +
          `Appointment Time: ${when}\n\n` +
          `Regards,\nSmart Health Care System`,
      });
      await sendEmailNotification({
        appointmentId: appointment._id,
        userId: appointment.doctorId,
        email: appointment.doctorEmail,
        subject: 'Patient Payment Completed',
        message:
          `Dear Doctor,\n\n` +
          `Payment has been completed by the patient for appointment ${appointment._id}.\n` +
          `Appointment Time: ${when}\n\n` +
          `Regards,\nSmart Health Care System`,
      });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Patient requests telemedicine join (time-gated)
// @route   PATCH /api/appointments/:id/telemedicine/patient-join-request
// @access  Private (Patient)
exports.requestPatientJoin = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (String(appointment.patientId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized for this appointment' });
    }

    const appointmentStatus = String(appointment.status).toUpperCase();
    if (appointmentStatus === 'COMPLETED' || appointmentStatus === 'CANCELLED') {
      return res.status(409).json({ message: 'This session has already ended.' });
    }
    if (appointmentStatus === 'REJECTED') {
      return res.status(400).json({ message: 'This appointment was rejected.' });
    }
    if (appointmentStatus !== 'APPROVED') {
      return res.status(400).json({ message: 'Appointment is not approved yet.' });
    }

    if (!appointment.telemedicine?.meetingUrl) {
      return res.status(400).json({ message: 'Meeting link not available yet.' });
    }

    const window = getAppointmentWindow(appointment.date, appointment.timeSlot);
    if (!window) {
      return res.status(400).json({ message: 'Invalid appointment time slot configuration.' });
    }

    const now = new Date();
    const openAt = new Date(window.startAt.getTime() - 15 * 60 * 1000);
    const closeAt = new Date(window.endAt.getTime() + 30 * 60 * 1000);

    if (now < openAt) {
      return res.status(400).json({
        message: 'You can join only 15 minutes before the appointment start time.',
      });
    }

    if (now > closeAt) {
      return res.status(400).json({
        message: 'This appointment join window has ended.',
      });
    }

    appointment.telemedicine = {
      ...(appointment.telemedicine || {}),
      joinRequestStatus: 'PENDING',
      patientJoinedAt: now,
    };
    await appointment.save();

    const when = `${new Date(appointment.date).toDateString()} ${appointment.timeSlot}`;
    await sendEmailNotification({
      appointmentId: appointment._id,
      userId: appointment.doctorId,
      email: appointment.doctorEmail,
      subject: 'Patient Joined Telemedicine Session',
      message:
        `Dear Doctor,\n\n` +
        `The patient has joined the telemedicine session and is currently waiting.\n` +
        `Appointment Time: ${when}\n` +
        `${appointment.telemedicine?.meetingUrl ? `Meeting Link: ${appointment.telemedicine.meetingUrl}\n` : ''}` +
        `Please join the session from your dashboard.\n\nRegards,\nSmart Health Care System`,
    });

    return res.status(200).json({
      message: 'Join request sent to doctor. Please join now.',
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Doctor marks telemedicine join
// @route   PATCH /api/appointments/:id/telemedicine/doctor-join
// @access  Private (Doctor)
exports.markDoctorJoin = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (String(appointment.doctorId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized for this appointment' });
    }

    appointment.telemedicine = {
      ...(appointment.telemedicine || {}),
      joinRequestStatus: 'DOCTOR_JOINED',
      doctorJoinedAt: new Date(),
    };
    await appointment.save();

    return res.status(200).json({
      message: 'Doctor join recorded.',
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

async function sendOneHourReminders() {
  const now = new Date();
  const lookAhead = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const appointments = await Appointment.find({
    status: 'APPROVED',
    'notification.oneHourReminderSentAt': null,
    date: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), $lte: lookAhead },
  }).limit(200);

  for (const appointment of appointments) {
    const window = getAppointmentWindow(appointment.date, appointment.timeSlot);
    if (!window) continue;

    const msUntilStart = window.startAt.getTime() - now.getTime();
    const withinReminderWindow =
      msUntilStart <= 60 * 60 * 1000 && msUntilStart >= 45 * 60 * 1000;
    if (!withinReminderWindow) continue;

    const when = formatAppointmentWhen(appointment);
    await sendEmailNotification({
      appointmentId: appointment._id,
      userId: appointment.patientId,
      email: appointment.patientEmail,
      subject: 'Reminder: Appointment in 1 Hour',
      message:
        `Dear Patient,\n\n` +
        `This is a reminder that your appointment is scheduled in approximately 1 hour.\n` +
        `Appointment Time: ${when}\n` +
        `${appointment.telemedicine?.meetingUrl ? `Meeting Link: ${appointment.telemedicine.meetingUrl}\n` : ''}` +
        `Please be ready to join on time.\n\nRegards,\nSmart Health Care System`,
    });
    await sendEmailNotification({
      appointmentId: appointment._id,
      userId: appointment.doctorId,
      email: appointment.doctorEmail,
      subject: 'Reminder: Appointment in 1 Hour',
      message:
        `Dear Doctor,\n\n` +
        `This is a reminder that you have an appointment scheduled in approximately 1 hour.\n` +
        `Appointment Time: ${when}\n` +
        `${appointment.telemedicine?.meetingUrl ? `Meeting Link: ${appointment.telemedicine.meetingUrl}\n` : ''}` +
        `Please join promptly from your dashboard.\n\nRegards,\nSmart Health Care System`,
    });

    appointment.notification = {
      ...(appointment.notification || {}),
      oneHourReminderSentAt: new Date(),
    };
    await appointment.save();
  }
}

exports.startReminderScheduler = () => {
  const enabled = process.env.ENABLE_APPOINTMENT_REMINDERS !== 'false';
  if (!enabled) {
    console.log('Appointment reminder scheduler is disabled');
    return;
  }

  const intervalMs = Number(process.env.APPOINTMENT_REMINDER_INTERVAL_MS || 60000);
  setInterval(() => {
    sendOneHourReminders().catch((error) => {
      console.error('Appointment reminder job failed:', error.message);
    });
  }, intervalMs);

  console.log('Appointment reminder scheduler started');
};
