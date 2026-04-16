import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    relationship: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const medicalHistorySchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      trim: true,
    },
    condition: {
      type: String,
      required: true,
      trim: true,
    },
    diagnosisDate: {
      type: Date,
      default: Date.now,
    },
    treatment: {
      type: String,
      trim: true,
      default: "",
    },
    medications: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    allergies: {
      type: [String],
      default: [],
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({}),
    },
    medicalHistory: {
      type: [medicalHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;