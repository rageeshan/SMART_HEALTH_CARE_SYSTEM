import express from "express";
import {
  register,
  verifyRegisterOtp,
  login,
  verifyLoginOtp,
  getAllUsers,
  getUserById,
  toggleUserStatus,
  verifyDoctor,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/verify-register-otp", verifyRegisterOtp);
router.post("/login", login);
router.post("/verify-login-otp", verifyLoginOtp);

// 🔐 Admin routes
router.get("/admin/users", protect, allowRoles("admin"), getAllUsers);

router.get("/admin/users/:userId", protect, allowRoles("admin"), getUserById);

router.patch(
  "/admin/users/:userId/toggle-status",
  protect,
  allowRoles("admin"),
  toggleUserStatus
);

router.patch(
  "/admin/users/:userId/verify-doctor",
  protect,
  allowRoles("admin"),
  verifyDoctor
);

export default router;