const Notification = require("../models/notificationModel");
const { sendEmail } = require("../services/emailService");
const { sendSMS } = require("../services/smsService");

const sendTestNotification = async (req, res) => {
  try {
    const { appointmentId, userId, email, phone, message } = req.body;
    const text = message || "Test notification from notification-service";

    if (!email && !phone) {
      return res.status(400).json({ message: "email or phone is required." });
    }

    const logs = [];

    if (email) {
      try {
        await sendEmail(email, "Test Notification", text);
        logs.push(
          await Notification.create({
            appointmentId,
            userId,
            recipient: email,
            type: "EMAIL",
            message: text,
            status: "sent"
          })
        );
      } catch (error) {
        logs.push(
          await Notification.create({
            appointmentId,
            userId,
            recipient: email,
            type: "EMAIL",
            message: text,
            status: "failed",
            error: error.message
          })
        );
      }
    }

    if (phone) {
      try {
        await sendSMS(phone, text);
        logs.push(
          await Notification.create({
            appointmentId,
            userId,
            recipient: phone,
            type: "SMS",
            message: text,
            status: "sent"
          })
        );
      } catch (error) {
        logs.push(
          await Notification.create({
            appointmentId,
            userId,
            recipient: phone,
            type: "SMS",
            message: text,
            status: "failed",
            error: error.message
          })
        );
      }
    }

    return res.status(200).json({ message: "Notification processed", logs });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getNotificationLogs = async (req, res) => {
  try {
    const logs = await Notification.find().sort({ createdAt: -1 }).limit(100);
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendTestNotification,
  getNotificationLogs
};
