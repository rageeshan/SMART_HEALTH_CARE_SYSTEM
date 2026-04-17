import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
    },
    patientId: {
      type: String,
      required: true,
    },
    doctorId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true, // in LKR
    },
    currency: {
      type: String,
      default: "LKR",
    },
    gateway: {
      type: String,
      enum: ["stripe"],
      required: true,
    },
    gatewayPaymentId: {
      type: String,
      default: null,
    },
    gatewayOrderId: {
      type: String, // PayHere order_id
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    receiptUrl: {
      type: String,
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
