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

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
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

    const otpRecord = await Otp.findOne({
      email,
      otp,
      purpose: "register",
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({
        message: "OTP Expired",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
    });

    await Otp.deleteMany({ email });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
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
        message: "User not found",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
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
        message: "Invalid OTP",
      });
    }

    if (otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({
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
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};