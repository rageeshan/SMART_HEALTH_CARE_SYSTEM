const amqp = require("amqplib");
const Notification = require("../models/notificationModel");
const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");

let channel;

const connectRabbitMQ = async () => {
  const rabbitUri = process.env.RABBITMQ_URI || "amqp://localhost";
  const connection = await amqp.connect(rabbitUri);
  channel = await connection.createChannel();

  await channel.assertQueue("appointment_confirmed", { durable: true });
  await channel.assertQueue("telemedicine_session_created", { durable: true });
  console.log("Notification connected to RabbitMQ");
};

const writeNotificationLog = async (payload) => {
  await Notification.create(payload);
};

const handleAppointmentConfirmed = async (data) => {
  if (!data.appointmentId) {
    throw new Error("Invalid payload: appointmentId is required.");
  }

  const message = `Appointment ${data.appointmentId} has been confirmed.`;

  if (data.patientEmail) {
    try {
      await sendEmail(data.patientEmail, "Appointment Confirmed", message);
      await writeNotificationLog({
        appointmentId: data.appointmentId,
        userId: data.patientId || null,
        recipient: data.patientEmail,
        type: "EMAIL",
        message,
        status: "sent"
      });
    } catch (error) {
      await writeNotificationLog({
        appointmentId: data.appointmentId,
        userId: data.patientId || null,
        recipient: data.patientEmail,
        type: "EMAIL",
        message,
        status: "failed",
        error: error.message
      });
    }
  }

  if (data.patientPhone) {
    try {
      await sendSMS(data.patientPhone, message);
      await writeNotificationLog({
        appointmentId: data.appointmentId,
        userId: data.patientId || null,
        recipient: data.patientPhone,
        type: "SMS",
        message,
        status: "sent"
      });
    } catch (error) {
      await writeNotificationLog({
        appointmentId: data.appointmentId,
        userId: data.patientId || null,
        recipient: data.patientPhone,
        type: "SMS",
        message,
        status: "failed",
        error: error.message
      });
    }
  }
};

const handleTelemedicineSessionCreated = async (data) => {
  if (!data.appointmentId || !data.meetingUrl) {
    throw new Error("Invalid payload: appointmentId and meetingUrl are required.");
  }

  const message = `Your consultation room is ready: ${data.meetingUrl}`;

  const recipients = [
    { email: data.patientEmail, userId: data.patientId },
    { email: data.doctorEmail, userId: data.doctorId }
  ];

  for (const recipient of recipients) {
    if (!recipient.email) {
      continue;
    }

    try {
      await sendEmail(
        recipient.email,
        "Telemedicine Session Ready",
        message
      );
      await writeNotificationLog({
        appointmentId: data.appointmentId,
        userId: recipient.userId || null,
        recipient: recipient.email,
        type: "EMAIL",
        message,
        status: "sent"
      });
    } catch (error) {
      await writeNotificationLog({
        appointmentId: data.appointmentId,
        userId: recipient.userId || null,
        recipient: recipient.email,
        type: "EMAIL",
        message,
        status: "failed",
        error: error.message
      });
    }
  }
};

const startConsumers = async () => {
  if (!channel) {
    await connectRabbitMQ();
  }

  channel.consume("appointment_confirmed", async (msg) => {
    if (!msg) {
      return;
    }

    try {
      const data = JSON.parse(msg.content.toString());
      await handleAppointmentConfirmed(data);
      channel.ack(msg);
    } catch (error) {
      console.error("Failed processing appointment_confirmed:", error.message);
      channel.nack(msg, false, false);
    }
  });

  channel.consume("telemedicine_session_created", async (msg) => {
    if (!msg) {
      return;
    }

    try {
      const data = JSON.parse(msg.content.toString());
      await handleTelemedicineSessionCreated(data);
      channel.ack(msg);
    } catch (error) {
      console.error("Failed processing telemedicine_session_created:", error.message);
      channel.nack(msg, false, false);
    }
  });
};

module.exports = {
  connectRabbitMQ,
  startConsumers
};
