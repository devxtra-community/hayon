import mongoose, { Schema } from "mongoose";
import { IPendingSignup } from "../interfaces/otp.interface";

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
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300,
  },
});

export default mongoose.model<IPendingSignup>("PendingSignup", PendingSignupSchema);
