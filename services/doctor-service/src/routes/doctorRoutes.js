const express = require('express');
const { createProfile, getDoctors, getDoctorById, setAvailability, getMyProfile, updateProfile, deleteAvailability } = require('../controllers/doctorController');
const { mockProtect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(mockProtect, createProfile) // Would normally be: protect, authorize('Doctor')
  .get(getDoctors);

router.route('/me')
  .get(mockProtect, getMyProfile)
  .put(mockProtect, updateProfile);

router.post('/availability', mockProtect, setAvailability);
router.delete('/availability/:id', mockProtect, deleteAvailability);

router.get('/:id', getDoctorById);

module.exports = router;
