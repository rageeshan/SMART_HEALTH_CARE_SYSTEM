import Patient from "../models/patient.js";

// Create patient profile
export const createPatientProfile = async (req, res) => {
  try {
    const { userId, role, email } = req.user;

    if (role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can create their profile",
      });
    }

    const existingPatient = await Patient.findOne({ userId });

    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Patient profile already exists",
      });
    }

    const {
      fullName,
      phone,
      dob,
      gender,
      address,
      bloodGroup,
      allergies,
      emergencyContact,
    } = req.body;

    const patient = await Patient.create({
      userId,
      email,
      fullName,
      phone,
      dob,
      gender,
      address,
      bloodGroup,
      allergies,
      emergencyContact,
    });

    return res.status(201).json({
      success: true,
      message: "Patient profile created successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create patient profile",
      error: error.message,
    });
  }
};

// Get logged-in patient's profile
export const getMyProfile = async (req, res) => {
  try {
    const { userId } = req.user;

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient profile",
      error: error.message,
    });
  }
};

// Update logged-in patient's profile
export const updateMyProfile = async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can update their profile",
      });
    }

    const updates = { ...req.body };

    const updatedPatient = await Patient.findOneAndUpdate(
      { userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient profile updated successfully",
      data: updatedPatient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update patient profile",
      error: error.message,
    });
  }
};

// Add medical history (doctor only)
export const addMedicalHistory = async (req, res) => {
  try {
    const { role, userId: doctorId } = req.user;
    const { patientId } = req.params;

    if (role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can add medical history",
      });
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const record = {
      doctorId,
      ...req.body,
    };

    patient.medicalHistory.push(record);
    await patient.save();

    return res.status(200).json({
      success: true,
      message: "Medical history added successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add medical history",
      error: error.message,
    });
  }
};

// Update medical history (doctor only)
export const updateMedicalHistory = async (req, res) => {
  try {
    const { role } = req.user;
    const { patientId, recordId } = req.params;

    if (role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can update medical history",
      });
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const record = patient.medicalHistory.id(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Medical history record not found",
      });
    }

    Object.keys(req.body).forEach((key) => {
      record[key] = req.body[key];
    });

    await patient.save();

    return res.status(200).json({
      success: true,
      message: "Medical history updated successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update medical history",
      error: error.message,
    });
  }
};