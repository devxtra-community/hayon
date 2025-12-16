import mongoose, { Schema } from "mongoose";
import { IPendingSignup } from "../types";

const PendingSignupSchema = new Schema<IPendingSignup>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  otpAttempts: {
    type: Number,
    default: 0,
  },
  sendCount: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300,
  },
});

export default mongoose.model<IPendingSignup>("PendingSignup", PendingSignupSchema);
