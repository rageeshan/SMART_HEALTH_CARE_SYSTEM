const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  appointmentId: { type: String, index: true },
  userId: { type: String, default: null },
  recipient: { type: String, required: true },
  type: {
    type: String,
    enum: ["SMS", "EMAIL"],
    required: true
  },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ["sent", "failed"],
    required: true
  },
  error: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);
