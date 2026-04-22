import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    relationship: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const medicalHistorySchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, trim: true },
    condition: { type: String, required: true, trim: true },
    diagnosisDate: { type: Date, default: Date.now },
    treatment: { type: String, trim: true, default: "" },
    medications: { type: [String], default: [] },
    notes: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["active", "resolved"], default: "active" },
  },
  { _id: true, timestamps: true }
);

// Medical report uploaded by patient
const reportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    fileType: { type: String, trim: true, default: "" },
    fileSize: { type: Number, default: 0 },
    notes: { type: String, trim: true, default: "" },
    // Base64-encoded file content (suitable for demo/small files)
    fileData: { type: String, default: "" },
  },
  { _id: true, timestamps: true }
);

// Prescription issued by a doctor
const prescriptionSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true, trim: true },
    doctorName: { type: String, trim: true, default: "" },
    doctorEmail: { type: String, trim: true, default: "" },
    appointmentId: { type: String, trim: true, default: "" },
    appointmentDate: { type: Date, default: null },
    appointmentTimeSlot: { type: String, trim: true, default: "" },
    medication: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true, default: "" },
    frequency: { type: String, trim: true, default: "" },
    duration: { type: String, trim: true, default: "" },
    instructions: { type: String, trim: true, default: "" },
    issuedAt: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: true }
);

const patientSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: "" },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    address: { type: String, trim: true, default: "" },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    allergies: { type: [String], default: [] },
    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({}),
    },
    medicalHistory: { type: [medicalHistorySchema], default: [] },
    reports: { type: [reportSchema], default: [] },
    prescriptions: { type: [prescriptionSchema], default: [] },
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;