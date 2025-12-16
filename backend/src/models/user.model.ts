import mongoose, { Schema } from "mongoose";
import { IUser, IUserAuth, IUserSubscription } from "../types/index";

// Auth Subdocument Schema

const authSchema = new Schema<IUserAuth>(
  {
    provider: {
      type: String,
      enum: ["email", "google"],
      required: true,
      default: "email",
    },
    googleId: {
      type: String,
      default: null,
    },
    passwordHash: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

// Subscription Subdocument Schema

const subscriptionSchema = new Schema<IUserSubscription>(
  {
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "pastDue"],
      default: "active",
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    currentPeriodStart: {
      type: Date,
      default: null,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// Main User Schema

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    auth: {
      type: authSchema,
      required: true,
    },
    subscription: {
      type: subscriptionSchema,
      required: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ "auth.googleId": 1 }, { sparse: true });

export default mongoose.model<IUser>("User", userSchema);
