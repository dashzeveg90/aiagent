const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const chatRoutes = require("./routes/chatRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

connectDB();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URLS?.split(",").map((value) => value.trim()) || "*",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api", companyRoutes);
app.use("/api", paymentRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "AI Agent SaaS API is running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      dashboard: "/api/dashboard",
      companies: "/api/companies",
      company: "/api/company/current",
      packages: "/api/packages",
      billing: "/api/billing/current",
      qpayCallback: "/api/payments/qpay/callback",
      chat: "/api/chat/:slug",
    },
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route олдсонгүй",
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5005;

const server = app.listen(PORT, () => {
  console.log(`Сервер ${PORT} порт дээр ажиллаж байна`);
  console.log(`Орчин: ${process.env.NODE_ENV || "development"}`);
});

process.on("unhandledRejection", (err) => {
  console.log("Unhandled Promise Rejection:", err.message);
  server.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM хүлээн авлаа. Сервер унтрааж байна...");
  server.close(() => process.exit(0));
});

module.exports = app;
