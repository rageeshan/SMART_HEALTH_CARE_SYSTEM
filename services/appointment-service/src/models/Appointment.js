const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: String, // Auth Service doctor user ID
    required: true,
  },
  patientId: {
    type: String, // Referencing Auth Service (Member 1) User ID
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String, // HH:mm - HH:mm format
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  symptoms: {
    type: String
  },
  prescription: {
    type: String // We can store simple text or a URL to a PDF/File later
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
