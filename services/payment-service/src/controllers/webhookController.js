import Payment from "../models/Payment.js";
import axios from "axios";
import { getStripeClient } from "../config/stripe.js";
// ─────────────────────────────────────────────
// Helper: Notify appointment-service that payment is complete
// ─────────────────────────────────────────────
const notifyAppointmentService = async (appointmentId, status) => {
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
// STRIPE – Webhook Handler
// ─────────────────────────────────────────────
const handleStripeWebhook = async (req, res) => {
  try {
    const stripe = getStripeClient();
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).send("Missing Stripe signature");
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).send("STRIPE_WEBHOOK_SECRET is not configured");
    }

    const event = stripe.webhooks.constructEvent(
      req.rawBody || JSON.stringify(req.body),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const payment = await Payment.findOneAndUpdate(
        { gatewayPaymentId: session.id },
        {
          status: "completed",
          receiptUrl: session.url || null,
          metadata: {
            ...((session.metadata && { ...session.metadata }) || {}),
            customerEmail: session.customer_email || null,
            paymentStatus: session.payment_status || null,
          },
        },
        { new: true }
      );

      if (payment) {
        await notifyAppointmentService(payment.appointmentId, "paid");
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await Payment.findOneAndUpdate(
        { gatewayPaymentId: session.id },
        { status: "failed" }
      );
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

export { handleStripeWebhook };
