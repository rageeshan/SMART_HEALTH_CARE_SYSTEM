import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import symptomRoutes from "./routes/symptomRoutes.js";

const PORT = process.env.PORT || 5003;

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/symptoms", symptomRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "ai-symptom-service" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started in port", PORT);
  });
});
