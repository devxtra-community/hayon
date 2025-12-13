import PendingSignup from "../models/pendingSignup.model";

export const findPendingByEmail = (email: string) => {
  return PendingSignup.findOne({ email });
};

export const deletePendingByEmail = (email: string) => {
  return PendingSignup.deleteOne({ email });
};

export const createPendingSignup = (data: {
  email: string;
  otp_hash: string;
  otp_expires: Date;
}) => {
  return PendingSignup.create(data);
};

export const updateOtpAttempts = async (email: string) => {
  return PendingSignup.updateOne(
    { email },
    { $inc: { otp_attempts: 1 } }
  );
}