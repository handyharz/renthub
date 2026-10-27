import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { startComplianceJobs } from "./jobs/complianceJobs";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Render, AWS ALB, Cloudflare) so req.ip represents real client IP
app.set("trust proxy", 1);

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false,
  })
);
const corsOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Global API rate limiting (300 requests per 15 minutes, skips webhooks)
import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => {
    const url = req.originalUrl || req.url || req.path || "";
    return url.includes("/webhooks") || url.includes("webhook") || url.startsWith("/health");
  },
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

const authOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification or payment attempts, please try again later.",
  },
});

// Sensitive OTP and payment initiation endpoints rate-limited strictly
app.use("/api/verification/phone", authOtpLimiter);
app.use("/api/payments/initialize", authOtpLimiter);
app.use("/api/payments/afriexchange/pay", authOtpLimiter);

// General rate limiter on all API routes (except webhooks)
app.use("/api", apiLimiter);

// Routes
app.use("/api", routes);

// Health check (root level)
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handling (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  startComplianceJobs();
  logger.info(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🔗 API available at http://localhost:${PORT}/api`);
});

export default app;
