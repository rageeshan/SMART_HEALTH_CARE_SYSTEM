import express from "express";
import {
  register,
  verifyRegisterOtp,
  login,
  verifyLoginOtp,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-register-otp", verifyRegisterOtp);

router.post("/login", login);
router.post("/verify-login-otp", verifyLoginOtp);

export default router;