import express from "express";
import { checkSymptoms, getCheckById, getMyHistory } from "../controllers/symptomController.js";

const router = express.Router();

router.post("/check", checkSymptoms);
router.get("/history", getMyHistory);
router.get("/history/:id", getCheckById);

export default router;
