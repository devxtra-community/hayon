// User-related types (frontend-safe) aligned with backend interfaces.
// Note: Backend uses Mongoose `Document` + `Types.ObjectId` + `Date`.
// In the frontend we represent `_id` as `string` and dates as ISO strings.

export type ISODateString = string;

export type UserRole = "user" | "admin";
export type AuthProvider = "email" | "google";

export type SubscriptionPlan = "free" | "pro";
export type SubscriptionStatus = "active" | "cancelled" | "pastDue";

export interface PasswordResetToken {
  token: string | null;
  expiresAt: ISODateString | null;
}

export interface UserAuth {
  provider: AuthProvider;
  googleId: string | null;
  passwordHash: string | null;
  passwordResetToken: PasswordResetToken | null;
}

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: ISODateString | null;
  currentPeriodEnd: ISODateString | null;
  cancelAtPeriodEnd: boolean;
}

export interface UserUsage {
  captionGenerations: number;
  postsCreated: number;
}

export interface UserLimits {
  maxCaptionGenerations: number;
  maxPosts: number;
}

export interface IUser {
  _id: string;
  email: string;
  name: string;
  avatar: string | null;
  timezone: string;
  role: UserRole;
  isDisabled: boolean;
  auth: UserAuth;
  subscription: UserSubscription;
  usage: UserUsage;
  limits: UserLimits;
  lastLogin: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

// Existing lightweight shape used in the app (kept for backward compatibility)
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
