import { Document, Types } from "mongoose";

export type UserRole = "user" | "admin";
export type AuthProvider = "email" | "google";
export type SubscriptionPlan = "free" | "pro";
export type SubscriptionStatus = "active" | "cancelled" | "pastDue";

export interface IpasswordResetToken {
  token: string | null;
  expiresAt: Date | null;
}

export interface IUserAuth {
  provider: AuthProvider;
  googleId: string | null;
  passwordHash: string | null;
  passwordResetToken: IpasswordResetToken | null;
}

export interface IUserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  name: string;
  avatar: string | null;
  timezone: string;
  role: UserRole;
  isDisabled: boolean;
  auth: IUserAuth;
  subscription: IUserSubscription;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
