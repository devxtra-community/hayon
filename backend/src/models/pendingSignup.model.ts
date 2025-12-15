import mongoose, { Schema, Document } from "mongoose";

export interface IPendingSignup extends Document {
  email: string;
  otp_hash: string;
  otp_attempts: number;
  sendCount: number;
  createdAt: Date;
}

const PendingSignupSchema = new Schema<IPendingSignup>({
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

  otp_attempts: {
    type: Number,
    default: 0,
  },

  sendCount: { type: Number, default: 0 },

  createdAt: {
    type: Date,
    expires: 300,
  },
});

/// need to delete after some time , so check when, todo:

export default mongoose.model<IPendingSignup>(
  "PendingSignup",
  PendingSignupSchema
);
