const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, index: true },
  doctorId: { type: String, required: true },
  patientId: { type: String, required: true },
  roomId: { type: String, required: true, unique: true },
  meetingUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ["created", "joined", "ended"],
    default: "created"
  },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null }
});

module.exports = mongoose.model("Session", sessionSchema);
