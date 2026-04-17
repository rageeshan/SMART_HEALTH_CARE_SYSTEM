import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
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
  adminUpdatePatientProfile,
  adminDeletePatientProfile,
  // Reports
  uploadReport,
  getMyReports,
  getReport,
  deleteReport,
  // Prescriptions
  addPrescription,
  getMyPrescriptions,
  getPatientPrescriptions,
} from "../controllers/patientController.js";
import {
  validateCreatePatientProfile,
  validateUpdatePatientProfile,
  validateAddMedicalHistory,
  validateUpdateMedicalHistory,
} from "../validations/patientValidation.js";

const router = express.Router();

/* ── Self (patient) ── */
router.post("/create", protect, allowRoles("patient"), validate(validateCreatePatientProfile), createPatientProfile);
router.get("/me", protect, allowRoles("patient"), getMyProfile);
router.put("/me", protect, allowRoles("patient"), validate(validateUpdatePatientProfile), updateMyProfile);
router.get("/me/medical-history", protect, allowRoles("patient"), getMyMedicalHistory);

/* ── Reports (patient uploads) ── */
router.post("/me/reports", protect, allowRoles("patient"), uploadReport);
router.get("/me/reports", protect, allowRoles("patient"), getMyReports);
router.get("/me/reports/:reportId", protect, allowRoles("patient"), getReport);
router.delete("/me/reports/:reportId", protect, allowRoles("patient"), deleteReport);

/* ── Prescriptions (patient views) ── */
router.get("/me/prescriptions", protect, allowRoles("patient"), getMyPrescriptions);

/* ── By patientId (doctor / admin) ── */
router.get("/:patientId", protect, allowRoles("patient", "doctor", "admin"), getPatientById);

router.get("/:patientId/medical-history", protect, allowRoles("patient", "doctor", "admin"), getPatientMedicalHistory);
router.post("/:patientId/medical-history", protect, allowRoles("doctor"), validate(validateAddMedicalHistory), addMedicalHistory);
router.put("/:patientId/medical-history/:recordId", protect, allowRoles("doctor", "admin"), validate(validateUpdateMedicalHistory), updateMedicalHistory);
router.delete("/:patientId/medical-history/:recordId", protect, allowRoles("doctor", "admin"), deleteMedicalHistory);

/* ── Prescriptions (doctor issues) ── */
router.post("/:patientId/prescriptions", protect, allowRoles("doctor"), addPrescription);
router.get("/:patientId/prescriptions", protect, allowRoles("doctor", "admin"), getPatientPrescriptions);

/* ── Admin ── */
router.put("/admin/:patientId", protect, allowRoles("admin"), validate(validateUpdatePatientProfile), adminUpdatePatientProfile);
router.delete("/admin/:patientId", protect, allowRoles("admin"), adminDeletePatientProfile);

export default router;