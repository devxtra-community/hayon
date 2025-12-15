import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;

  email: string;
  name: string;
  avatar: string | null;
  timezone: string;

  role: "user" | "admin";
  is_disabled: boolean;

  auth: {
    provider: "email" | "google";
    google_id: string | null;
    password_hash: string | null;
  };

  subscription: {
    plan: "free" | "pro";
    status: "active" | "cancelled" | "past_due";
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    current_period_start: Date | null;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
  };

  last_login: Date | null;

  createdAt: Date;
  updatedAt: Date;
}


const UserSchema = new Schema<IUser>(
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

    is_disabled: {
      type: Boolean,
      default: false,
    },

    auth: {
      provider: {
        type: String,
        enum: ["email", "google"],
        required: true,
        default: "email",
      },

      google_id: {
        type: String,
        default: null,
      },

      password_hash: {
        type: String,
        default: null,
      },
    },

    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro"],
        default: "free",
      },

      status: {
        type: String,
        enum: ["active", "cancelled", "past_due"],
        default: "active",
      },

      stripe_customer_id: {
        type: String,
        default: null,
      },

      stripe_subscription_id: {
        type: String,
        default: null,
      },

      current_period_start: {
        type: Date,
        default: null,
      },

      current_period_end: {
        type: Date,
        default: null,
      },

      cancel_at_period_end: {
        type: Boolean,
        default: false,
      },
    },

    last_login: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ "auth.google_id": 1 }, { sparse: true }); // sparse for optional field

export default mongoose.model<IUser>("User", UserSchema);
