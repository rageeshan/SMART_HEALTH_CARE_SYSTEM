import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },

    // 🔐 Account control (ADMIN)
    isActive: {
      type: Boolean,
      default: true, // can block user
    },

    // 🩺 Doctor verification (ADMIN)
    isVerified: {
      type: Boolean,
      default: false, // doctor must be approved
    },

    // (optional)
    createdByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);