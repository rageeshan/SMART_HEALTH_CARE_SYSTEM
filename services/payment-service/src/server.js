import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const PORT = process.env.PORT || 5008;

const app = express();

app.use(cors());

app.use(
  express.json({
    verify: (req, _res, buf) => {
      if (req.originalUrl === "/api/payments/webhook/stripe") {
        req.rawBody = buf.toString();
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// app.listen(process.env.PORT, () => {
//   console.log(`Server running on port ${process.env.PORT}`);
// });

// ROUTES
app.use("/api/payments", paymentRoutes);
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "payment-service" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started in port", PORT);
  });
});
