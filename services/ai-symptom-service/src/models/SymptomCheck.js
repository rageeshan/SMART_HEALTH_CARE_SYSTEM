import mongoose from "mongoose";

const symptomCheckSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
    },
    symptoms: {
      type: [String],
      required: true,
    },
    additionalNotes: {
      type: String,
      default: "",
    },
    aiResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rawPrompt: {
      type: String,
    },
  },
  { timestamps: true }
);

const SymptomCheck = mongoose.model("SymptomCheck", symptomCheckSchema);

export default SymptomCheck;
