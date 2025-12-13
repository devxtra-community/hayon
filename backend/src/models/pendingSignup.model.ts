import mongoose, { Schema, Document } from "mongoose";

export interface IPendingSignup extends Document {
  email: string;
  otp_hash: string;
  otp_expires: Date;
  otp_attempts: number;

  created_at: Date;
}

const PendingSignupSchema = new Schema<IPendingSignup>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    otp_hash: {
      type: String,
      required: true,
    },

    otp_expires: {
      type: Date,
      required: true,
    },

    otp_attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

/// need to delete after some time , so check when, todo:

export default mongoose.model<IPendingSignup>(
  "PendingSignup",
  PendingSignupSchema
);
