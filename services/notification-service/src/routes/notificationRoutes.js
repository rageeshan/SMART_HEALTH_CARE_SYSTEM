const express = require("express");
const {
  sendTestNotification,
  getNotificationLogs
} = require("../controllers/notificationController");

const router = express.Router();

router.post("/send-test", sendTestNotification);
router.get("/logs", getNotificationLogs);

module.exports = router;
