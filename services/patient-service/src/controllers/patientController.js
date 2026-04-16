import Patient from "../models/patient.js";

// Create patient profile
export const createPatientProfile = async (req, res) => {
  try {
    const { userId, email } = req.user;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is missing from token",
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
    const { userId } = req.user;

    const allowedUpdates = {
      fullName: req.body.fullName,
      phone: req.body.phone,
      dob: req.body.dob,
      gender: req.body.gender,
      address: req.body.address,
      bloodGroup: req.body.bloodGroup,
      allergies: req.body.allergies,
      emergencyContact: req.body.emergencyContact,
    };

    Object.keys(allowedUpdates).forEach((key) => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const updatedPatient = await Patient.findOneAndUpdate(
      { userId },
      allowedUpdates,
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

// Add medical history
export const addMedicalHistory = async (req, res) => {
  try {
    const { userId: doctorId } = req.user;
    const { patientId } = req.params;

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

// Update medical history
export const updateMedicalHistory = async (req, res) => {
  try {
    const { patientId, recordId } = req.params;

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

// Get patient by id
export const getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (role === "patient" && patient.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient fetched successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient",
      error: error.message,
    });
  }
};

// Get my medical history
export const getMyMedicalHistory = async (req, res) => {
  try {
    const { userId } = req.user;

    const patient = await Patient.findOne({ userId }).select(
      "medicalHistory fullName email"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Medical history fetched successfully",
      data: {
        patientId: patient._id,
        fullName: patient.fullName,
        email: patient.email,
        medicalHistory: patient.medicalHistory,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch medical history",
      error: error.message,
    });
  }
};

// Get patient medical history
export const getPatientMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, role } = req.user;

    const patient = await Patient.findById(patientId).select(
      "userId fullName email medicalHistory"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (role === "patient" && patient.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient medical history fetched successfully",
      data: {
        patientId: patient._id,
        fullName: patient.fullName,
        email: patient.email,
        medicalHistory: patient.medicalHistory,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient medical history",
      error: error.message,
    });
  }
};

// Delete medical history
export const deleteMedicalHistory = async (req, res) => {
  try {
    const { patientId, recordId } = req.params;

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

    record.deleteOne();
    await patient.save();

    return res.status(200).json({
      success: true,
      message: "Medical history deleted successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete medical history",
      error: error.message,
    });
  }
};

// Admin update patient profile
export const adminUpdatePatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;

    const allowedUpdates = {
      fullName: req.body.fullName,
      phone: req.body.phone,
      dob: req.body.dob,
      gender: req.body.gender,
      address: req.body.address,
      bloodGroup: req.body.bloodGroup,
      allergies: req.body.allergies,
      emergencyContact: req.body.emergencyContact,
    };

    Object.keys(allowedUpdates).forEach((key) => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient profile updated successfully by admin",
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

// Admin delete patient profile
export const adminDeletePatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;

    const deletedPatient = await Patient.findByIdAndDelete(patientId);

    if (!deletedPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient profile deleted successfully by admin",
      data: deletedPatient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete patient profile",
      error: error.message,
    });
  }
};