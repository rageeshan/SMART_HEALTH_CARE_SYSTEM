require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const connectDB = require("./config/db");
const notificationRoutes = require("./routes/notificationRoutes");
const { startConsumers } = require("./services/rabbitmqService");

const app = express();
const port = process.env.PORT || 5004;
const requireRabbit = process.env.REQUIRE_RABBITMQ === "true";

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "notification-service" });
});

app.use("/api/notifications", notificationRoutes);

const startHttpServer = () =>
  new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Notification service running on port ${port}`);
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
      await startConsumers();
      console.log("Notification RabbitMQ consumers started");
    } catch (error) {
      if (requireRabbit) {
        throw error;
      }
      console.warn("Notification RabbitMQ unavailable, running API-only mode");
    }
    await startHttpServer();
  } catch (error) {
    const message =
      error.code === "EADDRINUSE"
        ? `Port ${port} is already in use.`
        : error.message;
    console.error("Notification startup failed:", message);
    process.exit(1);
  }
};

start();
