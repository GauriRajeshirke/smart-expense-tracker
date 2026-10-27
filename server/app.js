// Builds the Express app (middleware + routes). server.js connects the
// database and starts listening.
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import insightRoutes from "./routes/insightRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// Behind a hosting proxy (Render, Railway...) the real client IP is in a header
if (isProduction) app.set("trust proxy", 1);

app.use(helmet()); // safer HTTP headers
app.use(
  cors({
    origin: (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((s) => s.trim()),
  })
);
if (!isProduction) app.use(morgan("dev")); // logs each request in the terminal
app.use(express.json({ limit: "10kb" })); // reject huge request bodies

// Slow down password-guessing: limit login/register attempts per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || (isProduction ? 30 : 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

// Each analysis runs a machine learning model, so limit how often it can be called
const insightLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please wait a moment." },
});

app.get("/", (req, res) => {
  res.send("Smart Expense Tracker API is running. Try /api/health");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "express-api",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/insights", insightLimiter, insightRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
