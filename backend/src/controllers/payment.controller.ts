import { Request, Response } from "express";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import logger from "../utils/logger";
import * as PaymentService from "../services/payment.service";

// POST /api/payments/create-checkout
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth!.id;
    const userEmail = req.auth!.email;

    const url = await PaymentService.createCheckoutSession(userId, userEmail);
    new SuccessResponse("Checkout session created", { data: { url } }).send(res);
  } catch (error) {
    logger.error("createCheckoutSession error:", error);
    new ErrorResponse("Payment session creation failed", { status: 500 }).send(res);
  }
};

// POST /api/payments/webhook  (raw body — no auth)
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    new ErrorResponse("Missing stripe-signature header", { status: 400 }).send(res);
    return;
  }

  try {
    await PaymentService.handleWebhookEvent(req.body as Buffer, signature);
    // Stripe requires a 200 response quickly
    res.json({ received: true });
  } catch (error: any) {
    logger.error("Webhook error:", error);
    new ErrorResponse(error.message || "Webhook processing failed", { status: 400 }).send(res);
  }
};

// POST /api/payments/cancel
export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.auth!;

    if (user.subscription?.plan !== "pro") {
      new ErrorResponse("No active Pro subscription to cancel", { status: 400 }).send(res);
      return;
    }

    if (!user.subscription.stripeSubscriptionId) {
      new ErrorResponse("No Stripe subscription ID found", { status: 400 }).send(res);
      return;
    }

    if (user.subscription.cancelAtPeriodEnd) {
      new ErrorResponse("Subscription is already scheduled for cancellation", { status: 400 }).send(
        res,
      );
      return;
    }

    await PaymentService.cancelSubscriptionAtPeriodEnd(
      user.subscription.stripeSubscriptionId,
      user.id,
    );

    new SuccessResponse("Subscription will be cancelled at the end of the billing period").send(
      res,
    );
  } catch (error) {
    logger.error("cancelSubscription error:", error);
    new ErrorResponse("Failed to cancel subscription", { status: 500 }).send(res);
  }
};

// POST /api/payments/billing-portal
export const createBillingPortal = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.auth!;

    if (!user.subscription?.stripeCustomerId) {
      new ErrorResponse("No billing account found. Please subscribe first.", { status: 400 }).send(
        res,
      );
      return;
    }

    const url = await PaymentService.createBillingPortalSession(user.subscription.stripeCustomerId);
    new SuccessResponse("Billing portal session created", { data: { url } }).send(res);
  } catch (error) {
    logger.error("createBillingPortal error:", error);
    new ErrorResponse("Failed to open billing portal", { status: 500 }).send(res);
  }
};

// GET /api/payments/status
export const getSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscription, usage, limits, plan } = req.auth!;
    new SuccessResponse("Subscription status", {
      data: { subscription, usage, limits, plan },
    }).send(res);
  } catch (error) {
    logger.error("getSubscriptionStatus error:", error);
    new ErrorResponse("Failed to get subscription status", { status: 500 }).send(res);
  }
};
