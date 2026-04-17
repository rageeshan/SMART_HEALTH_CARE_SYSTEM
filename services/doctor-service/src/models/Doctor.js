const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: String, // Referencing Auth Service (Member 1) User ID
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  specialty: {
    type: String,
    required: true
  },
  qualifications: {
    type: [String]
  },
  experienceYears: {
    type: Number,
    default: 0
  },
  contactNumber: {
    type: String
  },
  consultationFee: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
