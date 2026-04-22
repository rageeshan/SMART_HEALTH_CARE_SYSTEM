const express = require('express');
const { 
  bookAppointment, 
  getDoctorAppointments, 
  getPatientAppointments, 
  updateStatus, 
  issuePrescription,
  updatePaymentStatus,
  requestPatientJoin,
  markDoctorJoin,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, authorize('patient'), bookAppointment);
router.get('/doctor', protect, authorize('doctor'), getDoctorAppointments);
router.get('/patient', protect, authorize('patient'), getPatientAppointments);
router.patch('/:id/status', protect, authorize('doctor'), updateStatus);
router.patch('/:id/prescription', protect, authorize('doctor'), issuePrescription);
router.patch('/:id/telemedicine/patient-join-request', protect, authorize('patient'), requestPatientJoin);
router.patch('/:id/telemedicine/doctor-join', protect, authorize('doctor'), markDoctorJoin);
router.patch('/:id/payment-status', updatePaymentStatus);

module.exports = router;
