import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5002;

const app = express();

app.use(cors());

app.use(express.json());

// app.listen(process.env.PORT, () => {
//   console.log(`Server running on port ${process.env.PORT}`);
// });

// ROUTES

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started in port", PORT);
  });
});
