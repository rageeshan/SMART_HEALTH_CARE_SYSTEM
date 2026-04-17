const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

const sendEmail = async (to, subject, text) => {
  if (!process.env.EMAIL || !process.env.PASSWORD) {
    throw new Error("Email credentials are not configured.");
  }

  return transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject,
    text
  });
};

module.exports = { sendEmail };
