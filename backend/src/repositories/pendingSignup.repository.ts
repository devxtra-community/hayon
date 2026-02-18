import PendingSignup from "../models/pendingSignup.model";

export const findPendingByEmail = (email: string) => {
  return PendingSignup.findOne({ email });
};

export const deletePendingByEmail = (email: string) => {
  return PendingSignup.deleteOne({ email });
};

export const createPendingSignup = (data: { email: string; otpHash: string }) => {
  return PendingSignup.create(data);
};

export const updateOtpNumber = async (email: string, otpHash: string) => {
  return PendingSignup.updateOne({ email }, { $set: { otpHash: otpHash } });
};
