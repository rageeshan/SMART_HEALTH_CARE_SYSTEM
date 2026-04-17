const express = require('express');
const { 
  bookAppointment, 
  getDoctorAppointments, 
  getPatientAppointments, 
  updateStatus, 
  issuePrescription 
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, authorize('patient'), bookAppointment);
router.get('/doctor', protect, authorize('doctor'), getDoctorAppointments);
router.get('/patient', protect, authorize('patient'), getPatientAppointments);
router.patch('/:id/status', protect, authorize('doctor'), updateStatus);
router.patch('/:id/prescription', protect, authorize('doctor'), issuePrescription);

module.exports = router;
