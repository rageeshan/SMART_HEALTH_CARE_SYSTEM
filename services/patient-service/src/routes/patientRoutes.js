import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createPatientProfile,
  getMyProfile,
  updateMyProfile,
  addMedicalHistory,
  updateMedicalHistory,
  getPatientById,
  getMyMedicalHistory,
  getPatientMedicalHistory,
  deleteMedicalHistory,
} from "../controllers/patientController.js";

import { allowRoles } from "../middleware/roleMiddleware.js";



const router = express.Router();

router.post("/create", protect, allowRoles("patient"), createPatientProfile);
router.get("/me", protect, allowRoles("patient"), getMyProfile);
router.put("/me", protect, allowRoles("patient"), updateMyProfile);
router.get("/me/medical-history", protect, allowRoles("patient"), getMyMedicalHistory);

router.get("/:patientId", protect, getPatientById);
router.get("/:patientId/medical-history", protect, getPatientMedicalHistory);

router.post(
  "/:patientId/medical-history",
  protect,
  allowRoles("doctor"),
  addMedicalHistory
);

router.put(
  "/:patientId/medical-history/:recordId",
  protect,
  allowRoles("doctor"),
  updateMedicalHistory
);

router.delete(
  "/:patientId/medical-history/:recordId",
  protect,
  allowRoles("doctor"),
  deleteMedicalHistory
);

export default router;