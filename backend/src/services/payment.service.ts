import Stripe from "stripe";
import { ENV } from "../config/env";
import logger from "../utils/logger";
import * as UserRepository from "../repositories/user.repository";

const stripe = new Stripe(ENV.STRIPE.SECRET_KEY as string);

// ─── Checkout ─────────────────────────────────────────────────────────────────

export const createCheckoutSession = async (userId: string, userEmail: string) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: userEmail,
    line_items: [
      {
        price: ENV.STRIPE.PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    metadata: {
      userId, // critical — used in webhook to identify which user paid
    },
    success_url: `${ENV.APP.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${ENV.APP.FRONTEND_URL}/payment/cancel`,
    allow_promotion_codes: true,
  });

  return session.url;
};

// ─── Billing Portal ───────────────────────────────────────────────────────────

export const createBillingPortalSession = async (stripeCustomerId: string) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${ENV.APP.FRONTEND_URL}/settings`,
  });

  return session.url;
};

// ─── Cancel Subscription ──────────────────────────────────────────────────────

export const cancelSubscriptionAtPeriodEnd = async (
  stripeSubscriptionId: string,
  userId: string,
) => {
  // Set cancel_at_period_end = true (user keeps access until end of current period)
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  // Reflect this immediately in the DB
  await UserRepository.setCancelAtPeriodEnd(userId, true);

  return true;
};

// ─── Webhook Handler ──────────────────────────────────────────────────────────

export const handleWebhookEvent = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, ENV.STRIPE.WEBHOOK_SECRET);
  } catch (err: any) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    throw new Error(`Webhook Error: ${err.message}`);
  }

  logger.info(`Stripe webhook received: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    default:
      logger.info(`Unhandled Stripe event type: ${event.type}`);
  }
};

// ─── Individual Event Handlers ────────────────────────────────────────────────

const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const userId = session.metadata?.userId;
  const subscriptionId = session.subscription as string;

  logger.info(`Processing checkout.session.completed for user: ${userId}, sub: ${subscriptionId}`);

  if (!userId) {
    logger.error("checkout.session.completed: missing userId in metadata");
    return;
  }

  if (!subscriptionId) {
    logger.error("checkout.session.completed: missing subscriptionId in session");
    return;
  }

  try {
    // Retrieve the full subscription to access period dates
    const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as any;

    // In Stripe API 2025-03-31+, current_period_start/end moved to items.data[0]
    const periodStart =
      subscription.current_period_start ||
      subscription.items?.data?.[0]?.current_period_start ||
      subscription.currentPeriodStart ||
      subscription.items?.data?.[0]?.currentPeriodStart ||
      subscription.start_date; // fallback

    const periodEnd =
      subscription.current_period_end ||
      subscription.items?.data?.[0]?.current_period_end ||
      subscription.currentPeriodEnd ||
      subscription.items?.data?.[0]?.currentPeriodEnd;

    if (!periodStart || !periodEnd) {
      logger.error(
        `Could not resolve period dates for sub ${subscriptionId}. API Version: ${subscription.api_version}`,
      );
      throw new Error("Missing subscription period dates");
    }

    await UserRepository.upgradeUserToPro(userId, {
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
    });

    logger.info(
      `User ${userId} upgraded to Pro. Period: ${new Date(periodStart * 1000).toISOString()} - ${new Date(periodEnd * 1000).toISOString()}`,
    );
  } catch (error: any) {
    logger.error(`Error in handleCheckoutCompleted: ${error.message}`);
    throw error;
  }
};

/**
 * Fired on every successful invoice (monthly auto-renewal).
 * Resets usage counters and updates billing period dates.
 */
const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {
  // Skip the first invoice — that's handled by checkout.session.completed
  if (invoice.billing_reason === "subscription_create") {
    return;
  }

  const customerId = invoice.customer as string;
  const user = await UserRepository.findUserByStripeCustomerId(customerId);

  if (!user) {
    logger.warn(`invoice.payment_succeeded: No user found for customer ${customerId}`);
    return;
  }

  // Get the subscription ID from the invoice lines
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) {
    logger.warn(`invoice.payment_succeeded: No subscription ID on invoice`);
    return;
  }
  const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as any;

  const periodStart =
    subscription.current_period_start ||
    subscription.items?.data?.[0]?.current_period_start ||
    subscription.currentPeriodStart ||
    subscription.items?.data?.[0]?.currentPeriodStart;

  const periodEnd =
    subscription.current_period_end ||
    subscription.items?.data?.[0]?.current_period_end ||
    subscription.currentPeriodEnd ||
    subscription.items?.data?.[0]?.currentPeriodEnd;

  await UserRepository.renewSubscription(user._id.toString(), {
    currentPeriodStart: new Date(periodStart * 1000),
    currentPeriodEnd: new Date(periodEnd * 1000),
  });

  logger.info(`Subscription renewed for user ${user._id} (customer: ${customerId})`);
};

/**
 * Fired when invoice payment fails (e.g., card declined on renewal).
 * Marks subscription as pastDue.
 */
const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  const customerId = invoice.customer as string;
  const user = await UserRepository.findUserByStripeCustomerId(customerId);

  if (!user) {
    logger.warn(`invoice.payment_failed: No user found for customer ${customerId}`);
    return;
  }

  await UserRepository.markSubscriptionPastDue(user._id.toString());
  logger.warn(`Payment failed for user ${user._id} (customer: ${customerId}) — set to pastDue`);
};

/**
 * Fired when the subscription is fully deleted (after cancel_at_period_end expires).
 * Downgrades user to free plan.
 */
const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  const customerId = subscription.customer as string;
  const user = await UserRepository.findUserByStripeCustomerId(customerId);

  if (!user) {
    logger.warn(`customer.subscription.deleted: No user found for customer ${customerId}`);
    return;
  }

  await UserRepository.downgradeUserToFree(user._id.toString());
  logger.info(`User ${user._id} downgraded to free after subscription deletion`);
};

/**
 * Fired when subscription is updated (e.g., cancel_at_period_end toggled via billing portal).
 * Syncs cancelAtPeriodEnd flag.
 */
const handleSubscriptionUpdated = async (subscription: Stripe.Subscription) => {
  const customerId = subscription.customer as string;
  const user = await UserRepository.findUserByStripeCustomerId(customerId);

  if (!user) {
    logger.warn(`customer.subscription.updated: No user found for customer ${customerId}`);
    return;
  }

  await UserRepository.setCancelAtPeriodEnd(user._id.toString(), subscription.cancel_at_period_end);

  logger.info(
    `Subscription updated for user ${user._id}: cancelAtPeriodEnd=${subscription.cancel_at_period_end}`,
  );
};
