import express from "express";
import {
  createCheckoutSession,
  handleWebhook,
  cancelSubscription,
  createBillingPortal,
  getSubscriptionStatus,
} from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";

const paymentRouter = express.Router();

/**
 * IMPORTANT: The webhook route uses express.raw() instead of express.json()
 * because Stripe requires the raw request body to verify the webhook signature.
 * This is mounted here, before the global express.json() in app.ts can process it.
 */
paymentRouter.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

// All routes below this line require authentication
paymentRouter.post("/create-checkout", authenticate, createCheckoutSession);
paymentRouter.post("/cancel", authenticate, cancelSubscription);
paymentRouter.post("/billing-portal", authenticate, createBillingPortal);
paymentRouter.get("/status", authenticate, getSubscriptionStatus);

export default paymentRouter;
