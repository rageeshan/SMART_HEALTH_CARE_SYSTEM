const express = require('express');
const { createProfile, getDoctors, getDoctorById, setAvailability, getMyProfile, updateProfile, deleteAvailability } = require('../controllers/doctorController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, authorize('doctor'), createProfile)
  .get(getDoctors);

router.route('/me')
  .get(protect, authorize('doctor'), getMyProfile)
  .put(protect, authorize('doctor'), updateProfile);

router.post('/availability', protect, authorize('doctor'), setAvailability);
router.delete('/availability/:id', protect, authorize('doctor'), deleteAvailability);

router.get('/:id', getDoctorById);

module.exports = router;
