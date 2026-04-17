import User from "../models/User.js";
import Otp from "../models/Otp.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { sendOtpEmail } from "../services/emailService.js";

/* =========================================================
   REGISTER - SEND OTP
========================================================= */
export const register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    const allowedRoles = ["patient", "doctor"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Only patient or doctor can register.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await Otp.deleteMany({
      email,
      purpose: "register",
    });

    await Otp.create({
      email,
      otp,
      purpose: "register",
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "Registration OTP sent to email",
      tempUser: {
        fullName,
        email,
        password,
        role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =========================================================
   VERIFY REGISTER OTP - CREATE USER
========================================================= */
export const verifyRegisterOtp = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      otp,
    } = req.body;

    const allowedRoles = ["patient", "doctor"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Only patient or doctor can register.",
      });
    }

    const otpRecord = await Otp.findOne({
      email,
      otp,
      purpose: "register",
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP Expired",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      isVerified: role === "patient" ? true : false,
    });

    await Otp.deleteMany({ email });

    res.status(201).json({
      success: true,
      message:
        role === "doctor"
          ? "Registration successful. Doctor account pending admin verification."
          : "Registration successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =========================================================
   LOGIN - VALIDATE PASSWORD + SEND OTP
========================================================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated by admin",
      });
    }

    if (user.role === "doctor" && !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Doctor account is pending admin verification",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await Otp.deleteMany({
      email,
      purpose: "login",
    });

    await Otp.create({
      email,
      otp,
      purpose: "login",
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "Login OTP sent to email",
      email,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/* =========================================================
   VERIFY LOGIN OTP - GENERATE JWT
========================================================= */
export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({
      email,
      otp,
      purpose: "login",
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP Expired",
      });
    }

    const user = await User.findOne({ email });

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await Otp.deleteMany({ email });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Activate / Deactivate user
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Verify doctor
export const verifyDoctor = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user || user.role !== "doctor") {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Doctor verified successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update user details (admin)
export const updateUser = async (req, res) => {
  try {
    const { fullName, email, role } = req.body;
    const allowedRoles = ["patient", "doctor", "admin"];

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (fullName !== undefined) {
      if (!String(fullName).trim()) {
        return res.status(400).json({
          success: false,
          message: "Full name cannot be empty",
        });
      }
      user.fullName = String(fullName).trim();
    }

    if (email !== undefined) {
      const normalized = String(email).trim().toLowerCase();
      if (!normalized) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }
      const conflict = await User.findOne({
        email: normalized,
        _id: { $ne: user._id },
      });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another account",
        });
      }
      user.email = normalized;
    }

    if (role !== undefined) {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Allowed roles: patient, doctor, admin",
        });
      }
      // When changing away from doctor reset verification status
      if (user.role === "doctor" && role !== "doctor") {
        user.isVerified = false;
      }
      user.role = role;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all verified doctors (accessible to authenticated patients)
export const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({
      role: "doctor",
      isVerified: true,
      isActive: true,
    }).select("fullName email _id createdAt");

    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};