require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const connectDB = require("./config/db");
const sessionRoutes = require("./routes/sessionRoutes");
const { consumeAppointmentConfirmed } = require("./services/rabbitmqService");

const app = express();
const port = process.env.PORT || 5003;
const requireRabbit = process.env.REQUIRE_RABBITMQ === "true";

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "telemedicine-service" });
});

app.use("/api/sessions", sessionRoutes);

const startHttpServer = () =>
  new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Telemedicine service running on port ${port}`);
      resolve(server);
    });

    server.on("error", (error) => {
      reject(error);
    });
  });

const start = async () => {
  try {
    await connectDB();
    try {
      await consumeAppointmentConfirmed();
      console.log("Telemedicine RabbitMQ consumer started");
    } catch (error) {
      if (requireRabbit) {
        throw error;
      }
      console.warn("Telemedicine RabbitMQ unavailable, running API-only mode");
    }
    await startHttpServer();
  } catch (error) {
    const message =
      error.code === "EADDRINUSE"
        ? `Port ${port} is already in use.`
        : error.message;
    console.error("Telemedicine startup failed:", message);
    process.exit(1);
  }
};

start();
