import { Router } from "express";
import propertyRoutes from "./properties";
import userRoutes from "./users";
import uploadRoutes from "./upload";

const router: Router = Router();

// Health check route (already in index.ts, but we can keep it here too)
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
import favoriteRoutes from "./favorites";
import verificationRoutes from "./verification";
import messageRoutes from "./messages";
import tourRoutes from "./tours";
import transactionRoutes from "./transactions";
import paymentRoutes from "./payments";
import webhookRoutes from "./webhooks";
import reviewRoutes from "./reviews";
import serviceTransactionRoutes from "./serviceTransaction.routes";
import applicationRoutes from "./applications";

// Mount routes
router.use("/properties", propertyRoutes);
router.use("/users", userRoutes);
router.use("/upload", uploadRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/verification", verificationRoutes);
router.use("/messages", messageRoutes);
router.use("/tours", tourRoutes);
router.use("/transactions", transactionRoutes);
router.use("/payments", paymentRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/reviews", reviewRoutes);
router.use("/services", serviceTransactionRoutes);
router.use("/applications", applicationRoutes);
import statsRoutes from "./stats";
import adminRoutes from "./admin";
import payoutRoutes from "./payouts";
router.use("/stats", statsRoutes);
router.use("/admin", adminRoutes);
router.use("/payouts", payoutRoutes);

// Test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Test route working!",
  });
});

export default router;
