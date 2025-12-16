import { Document } from "mongoose";

export interface IPendingSignup extends Document {
  email: string;
  otpHash: string;
  otpAttempts: number;
  sendCount: number;
  createdAt: Date;
}
