import express from "express";
import cors from "cors";
import patientRoutes from "./routes/patientRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/patients", patientRoutes);

app.get("/health", (req, res) => res.status(200).json({ status: "UP" }));

export default app;