import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import Authroutes from "./routes/auth/auth.route";
import WalletRoutes from "./routes/main/wallet.routes";
import TransferRoutes from "./routes/main/transfer.routes"
import WebhookRoutes from "./routes/main/webhook.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging (dev only) ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many auth attempts, try again later.",
  },
});

app.use("/api", limiter);
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date() }),
);
app.use("/api/v1/auth", Authroutes);
app.use("/api/v1/wallet", WalletRoutes);
app.use("/api/v1", TransferRoutes);
app.use("/api/v1/webhook", WebhookRoutes);


// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
