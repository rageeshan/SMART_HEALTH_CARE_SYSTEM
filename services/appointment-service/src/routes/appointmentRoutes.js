const express = require('express');
const { 
  bookAppointment, 
  getDoctorAppointments, 
  getPatientAppointments, 
  updateStatus, 
  issuePrescription 
} = require('../controllers/appointmentController');
const { mockProtect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', mockProtect, bookAppointment);
router.get('/doctor', mockProtect, getDoctorAppointments);
router.get('/patient', mockProtect, getPatientAppointments);
router.patch('/:id/status', mockProtect, updateStatus);
router.patch('/:id/prescription', mockProtect, issuePrescription);

module.exports = router;
