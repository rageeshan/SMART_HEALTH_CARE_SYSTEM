import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });
  return transporter;
}

export const sendPaymentReceiptEmail = async ({
  to,
  appointmentId,
  amount,
  currency = "LKR",
  paymentId,
}) => {
  if (!to) return;
  if (!process.env.EMAIL || !process.env.PASSWORD) {
    console.warn("Receipt email skipped: EMAIL/PASSWORD not configured");
    return;
  }

  const subject = "Payment Receipt - SMART Health Care";
  const text = [
    "Your payment was successful.",
    "",
    `Appointment ID: ${appointmentId}`,
    `Payment ID: ${paymentId}`,
    `Amount: ${currency} ${Number(amount).toFixed(2)}`,
    "",
    "Thank you for using SMART Health Care.",
  ].join("\n");

  await getTransporter().sendMail({
    from: process.env.EMAIL,
    to,
    subject,
    text,
  });
};

