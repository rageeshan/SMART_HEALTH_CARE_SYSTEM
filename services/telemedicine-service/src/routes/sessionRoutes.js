const express = require("express");
const {
  createSession,
  joinSession,
  endSession,
  getSessionByAppointment
} = require("../controllers/sessionController");

const router = express.Router();

router.post("/create", createSession);
router.patch("/:appointmentId/join", joinSession);
router.patch("/:appointmentId/end", endSession);
router.get("/:appointmentId", getSessionByAppointment);

module.exports = router;
