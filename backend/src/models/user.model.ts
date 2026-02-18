import mongoose, { Schema } from "mongoose";
import { IUser, IUserAuth, IUserSubscription } from "../interfaces/user.interface";

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
    passwordResetToken: {
      token: {
        type: String,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
    },
  },
  { _id: false },
);

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
  { _id: false },
);

const usageSchema = new Schema(
  {
    captionGenerations: {
      type: Number,
      default: 0,
    },
    postsCreated: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const limitsSchema = new Schema(
  {
    maxCaptionGenerations: {
      type: Number,
      required: true,
    },
    maxPosts: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

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
      default: "https://avatars.githubusercontent.com/u/18816363",
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

    fcmTokens: {
      type: [String],
      default: [],
    },

    auth: {
      type: authSchema,
      required: true,
    },

    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },

    usage: {
      type: usageSchema,
      default: () => ({}),
    },

    limits: {
      type: limitsSchema,
      default: function () {
        const plan = this.subscription?.plan || "free";

        if (plan === "pro") {
          return {
            maxCaptionGenerations: 25,
            maxPosts: 90,
          };
        }

        return {
          maxCaptionGenerations: 10,
          maxPosts: 30,
        };
      },
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ "auth.googleId": 1 }, { sparse: true });

export default mongoose.model<IUser>("User", userSchema);
