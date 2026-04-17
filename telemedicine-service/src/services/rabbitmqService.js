const amqp = require("amqplib");
const Session = require("../models/sessionModel");
const { createRoom } = require("./videoService");

let channel;

const connectRabbitMQ = async () => {
  const rabbitUri = process.env.RABBITMQ_URI || "amqp://localhost";
  const connection = await amqp.connect(rabbitUri);
  channel = await connection.createChannel();
  await channel.assertQueue("appointment_confirmed", { durable: true });
  await channel.assertQueue("telemedicine_session_created", { durable: true });
  console.log("Telemedicine connected to RabbitMQ");
  return channel;
};

const consumeAppointmentConfirmed = async () => {
  if (!channel) {
    await connectRabbitMQ();
  }

  channel.consume("appointment_confirmed", async (msg) => {
    if (!msg) {
      return;
    }

    try {
      const payload = JSON.parse(msg.content.toString());
      const { appointmentId, doctorId, patientId, doctorEmail, patientEmail } = payload;
      if (!appointmentId || !doctorId || !patientId) {
        throw new Error("Invalid payload: appointmentId, doctorId, patientId are required");
      }

      let session = await Session.findOne({ appointmentId });
      if (!session) {
        const room = createRoom();
        try {
          session = await Session.create({
            appointmentId,
            doctorId,
            patientId,
            roomId: room.roomId,
            meetingUrl: room.url
          });
        } catch (dbError) {
          if (dbError.code === 11000) {
            session = await Session.findOne({ appointmentId });
          } else {
            throw dbError;
          }
        }
      }

      channel.sendToQueue(
        "telemedicine_session_created",
        Buffer.from(
          JSON.stringify({
            appointmentId: session.appointmentId,
            doctorId: session.doctorId,
            patientId: session.patientId,
            meetingUrl: session.meetingUrl,
            doctorEmail,
            patientEmail
          })
        ),
        { persistent: true }
      );

      channel.ack(msg);
    } catch (error) {
      console.error("Failed processing appointment_confirmed:", error.message);
      // Drop malformed/irrecoverable messages to avoid infinite retry loops.
      channel.nack(msg, false, false);
    }
  });
};

module.exports = {
  connectRabbitMQ,
  consumeAppointmentConfirmed
};
