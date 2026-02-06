// User-related types matching backend interfaces

export type SubscriptionPlan = "free" | "pro";
export type SubscriptionStatus = "active" | "cancelled" | "pastDue";

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date | string | null;
  currentPeriodEnd: Date | string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

export interface UserUsage {
  captionGenerations: number;
  postsCreated: number;
}

export interface UserLimits {
  maxCaptionGenerations: number;
  maxPosts: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  timezone?: string;
  subscription?: UserSubscription;
  usage?: UserUsage;
  limits?: UserLimits;
}
