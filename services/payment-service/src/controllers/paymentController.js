import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import Payment from "../models/Payment.js";
import { getStripeClient } from "../config/stripe.js";

const notifyAppointmentService = async (appointmentId, status) => {
  if (!process.env.APPOINTMENT_SERVICE_URL) {
    return;
  }

  try {
    await axios.patch(
      `${process.env.APPOINTMENT_SERVICE_URL}/api/appointments/${appointmentId}/payment-status`,
      { paymentStatus: status }
    );
  } catch (err) {
    console.error("Failed to notify appointment-service:", err.message);
  }
};

// ─────────────────────────────────────────────
// STRIPE – Create Checkout Session
// ─────────────────────────────────────────────
const createStripeCheckout = async (req, res) => {
  const {
    appointmentId,
    doctorId,
    patientId,
    amount,
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
  } = req.body;
  const orderId = uuidv4();
  const currency = "LKR";

  try {
    if (
      !appointmentId ||
      !doctorId ||
      !patientId ||
      !amount ||
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !address ||
      !city
    ) {
      return res
        .status(400)
        .json({ message: "Missing required fields for checkout" });
    }

    const normalizedAmount = parseFloat(amount);

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be a positive number" });
    }

    const stripe = getStripeClient();

    const payment = await Payment.create({
      appointmentId,
      patientId,
      doctorId,
      amount: normalizedAmount,
      currency,
      gateway: "stripe",
      gatewayOrderId: orderId,
      status: "pending",
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancel`,
      customer_email: email,
      metadata: {
        paymentId: payment._id.toString(),
        appointmentId,
        patientId,
        doctorId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(normalizedAmount * 100),
            product_data: {
              name: "Doctor Consultation Fee",
              description: `Appointment ${appointmentId}`,
            },
          },
        },
      ],
    });

    await Payment.findByIdAndUpdate(payment._id, {
      gatewayPaymentId: session.id,
      metadata: {
        firstName,
        lastName,
        phone,
        address,
        city,
      },
    });

    res.status(201).json({
      paymentId: payment._id,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    res.status(500).json({
      message: "Stripe checkout initialization failed",
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────────
// STRIPE – Fallback payment verification
// ─────────────────────────────────────────────
const verifyStripeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const status =
      session.payment_status === "paid"
        ? "completed"
        : session.status === "expired"
          ? "failed"
          : "pending";

    const payment = await Payment.findOneAndUpdate(
      { gatewayPaymentId: sessionId },
      {
        status,
        receiptUrl: session.url || null,
        metadata: {
          ...((session.metadata && { ...session.metadata }) || {}),
          customerEmail: session.customer_email || null,
          paymentStatus: session.payment_status || null,
        },
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found for session" });
    }

    if (status === "completed") {
      await notifyAppointmentService(payment.appointmentId, "paid");
    }

    res.status(200).json({
      message: "Stripe session verified",
      sessionId,
      status,
      payment,
    });
  } catch (err) {
    res.status(500).json({
      message: "Stripe session verification failed",
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────────
// Get payment by ID
// ─────────────────────────────────────────────
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    res.status(200).json(payment);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching payment", error: err.message });
  }
};

// ─────────────────────────────────────────────
// Get all payments for the logged-in patient
// ─────────────────────────────────────────────
const getMyPayments = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res
        .status(400)
        .json({ message: "patientId query param is required" });
    }

    const payments = await Payment.find({ patientId }).sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching payments", error: err.message });
  }
};

// ─────────────────────────────────────────────
// Admin – Get all payments
// ─────────────────────────────────────────────
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching all payments", error: err.message });
  }
};

// ─────────────────────────────────────────────
// Admin – Get financial summary
// ─────────────────────────────────────────────
const getFinancialSummary = async (req, res) => {
  try {
    const total = await Payment.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const byGateway = await Payment.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$gateway",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      totalRevenue: total[0]?.totalRevenue || 0,
      totalTransactions: total[0]?.count || 0,
      byGateway,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error generating summary", error: err.message });
  }
};

export {
  createStripeCheckout,
  verifyStripeSession,
  getPaymentById,
  getMyPayments,
  getAllPayments,
  getFinancialSummary,
};
