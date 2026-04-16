import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createPatientProfile,
  getMyProfile,
  updateMyProfile,
  addMedicalHistory,
  updateMedicalHistory,
} from "../controllers/patientController.js";

const router = express.Router();

router.post("/create", protect, createPatientProfile);
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

router.post("/:patientId/medical-history", protect, addMedicalHistory);
router.put("/:patientId/medical-history/:recordId", protect, updateMedicalHistory);

export default router;