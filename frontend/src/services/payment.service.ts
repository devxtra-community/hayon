import { api } from "../lib/axios";
import { UserSubscription } from "@/types/user.types";

export const paymentService = {
  /**
   * Creates a Stripe Checkout session and returns the URL to redirect to.
   */
  createCheckoutSession: async (): Promise<string> => {
    const response = await api.post<{ data: { url: string } }>("/payments/create-checkout");
    return response.data.data.url;
  },

  /**
   * Schedules the current subscription to cancel at the end of the billing period.
   */
  cancelSubscription: async (): Promise<void> => {
    await api.post("/payments/cancel");
  },

  /**
   * Opens the Stripe Billing Portal so the user can manage cards, invoices, etc.
   * Returns the portal URL.
   */
  getBillingPortal: async (): Promise<string> => {
    const response = await api.post<{ data: { url: string } }>("/payments/billing-portal");
    return response.data.data.url;
  },

  /**
   * Gets the current subscription status from the server.
   */
  getSubscriptionStatus: async (): Promise<{
    subscription: UserSubscription;
    usage: { captionGenerations: number; postsCreated: number };
    limits: { maxCaptionGenerations: number; maxPosts: number };
    plan: "free" | "pro";
  }> => {
    const response = await api.get("/payments/status");
    return response.data.data;
  },
};
