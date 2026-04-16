const Session = require("../models/sessionModel");
const { createRoom } = require("../services/videoService");

const createSession = async (req, res) => {
  try {
    const { appointmentId, doctorId, patientId } = req.body;

    if (!appointmentId || !doctorId || !patientId) {
      return res.status(400).json({
        message: "appointmentId, doctorId and patientId are required."
      });
    }

    const existing = await Session.findOne({ appointmentId });
    if (existing) {
      return res.status(200).json(existing);
    }

    const room = createRoom();
    try {
      const session = await Session.create({
        appointmentId,
        doctorId,
        patientId,
        roomId: room.roomId,
        meetingUrl: room.url
      });
      return res.status(201).json(session);
    } catch (dbError) {
      // If another request created the same appointment session concurrently,
      // return the existing record instead of failing the request.
      if (dbError.code === 11000) {
        const alreadyCreated = await Session.findOne({ appointmentId });
        if (alreadyCreated) {
          return res.status(200).json(alreadyCreated);
        }
      }
      throw dbError;
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const joinSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const session = await Session.findOne({ appointmentId });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (session.status === "ended") {
      return res.status(409).json({ message: "Ended sessions cannot be joined." });
    }

    session.status = "joined";
    await session.save();
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const endSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const session = await Session.findOne({ appointmentId });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (session.status === "ended") {
      return res.status(200).json(session);
    }

    session.status = "ended";
    session.endedAt = new Date();
    await session.save();
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSessionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const session = await Session.findOne({ appointmentId });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSession,
  joinSession,
  endSession,
  getSessionByAppointment
};
