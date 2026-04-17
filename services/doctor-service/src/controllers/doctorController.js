const Doctor = require('../models/Doctor');
const Availability = require('../models/Availability');

// @desc    Create doctor profile
// @route   POST /api/doctors
// @access  Private (Doctor)
exports.createProfile = async (req, res) => {
  try {
    const { name, specialty, qualifications, experienceYears, contactNumber, consultationFee } = req.body;
    let doctor = await Doctor.findOne({ userId: req.user.userId });
    
    if (doctor) {
      return res.status(400).json({ message: 'Doctor profile already exists for this user' });
    }

    doctor = await Doctor.create({
      userId: req.user.userId,
      name,
      specialty,
      qualifications,
      experienceYears,
      contactNumber,
      consultationFee
    });

    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/me
// @access  Private (Doctor)
exports.updateProfile = async (req, res) => {
  try {
    const { name, specialty, qualifications, experienceYears, contactNumber, consultationFee } = req.body;
    let doctor = await Doctor.findOne({ userId: req.user.userId });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    doctor.name = name || doctor.name;
    doctor.specialty = specialty || doctor.specialty;
    doctor.qualifications = qualifications || doctor.qualifications;
    doctor.experienceYears = experienceYears !== undefined ? experienceYears : doctor.experienceYears;
    doctor.contactNumber = contactNumber || doctor.contactNumber;
    doctor.consultationFee = consultationFee !== undefined ? consultationFee : doctor.consultationFee;

    await doctor.save();
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get my doctor profile
// @route   GET /api/doctors/me
// @access  Private (Doctor)
exports.getMyProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    const availability = await Availability.find({ doctorId: doctor._id });
    res.status(200).json({ ...doctor._doc, availability });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all doctors (Search by specialty)
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res) => {
  try {
    const { specialty } = req.query;
    let query = {};
    if (specialty) {
      query.specialty = { $regex: specialty, $options: 'i' };
    }
    const doctors = await Doctor.find(query);
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get specific doctor & availability
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    
    const availability = await Availability.find({ doctorId: doctor._id });
    res.status(200).json({ ...doctor._doc, availability });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Set doctor availability
// @route   POST /api/doctors/availability
// @access  Private (Doctor)
exports.setAvailability = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const availability = await Availability.create({
      doctorId: doctor._id,
      dayOfWeek,
      startTime,
      endTime
    });

    res.status(201).json(availability);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete doctor availability slot
// @route   DELETE /api/doctors/availability/:id
// @access  Private (Doctor)
exports.deleteAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const availability = await Availability.findOne({ _id: req.params.id, doctorId: doctor._id });
    if (!availability) {
      return res.status(404).json({ message: 'Availability slot not found' });
    }

    await availability.deleteOne();
    res.status(200).json({ message: 'Slot removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get availability by auth userId (public)
// @route   GET /api/doctors/user/:userId/availability
// @access  Public
exports.getAvailabilityByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const availability = await Availability.find({ doctorId: doctor._id }).sort({
      dayOfWeek: 1,
      startTime: 1,
    });

    return res.status(200).json({
      doctorId: doctor._id,
      userId: doctor.userId,
      availability,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
