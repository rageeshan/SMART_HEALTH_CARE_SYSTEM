import express from "express";
import {
  createStripeCheckout,
  getAllPayments,
  getFinancialSummary,
  getMyPayments,
  getPaymentById,
  verifyStripeSession,
} from "../controllers/paymentController.js";
import { handleStripeWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// Patient routes
router.post("/stripe/checkout", createStripeCheckout); // POST /api/payments/stripe/checkout
router.post("/webhook/stripe", handleStripeWebhook); // POST /api/payments/webhook/stripe
router.get("/stripe/session/:sessionId/verify", verifyStripeSession); // GET /api/payments/stripe/session/:sessionId/verify
router.get("/my", getMyPayments); // GET  /api/payments/my

// Admin routes
router.get("/", getAllPayments); // GET  /api/payments
router.get("/admin/summary", getFinancialSummary); // GET  /api/payments/admin/summary
router.get("/:id", getPaymentById); // GET  /api/payments/:id

export default router;
