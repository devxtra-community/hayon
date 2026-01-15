import PendingSignup from "../models/pendingSignup.model";

export class PendingSignupRepository {
  findPendingByEmail() {}
}

export const findPendingByEmail = (email: string) => {
  return PendingSignup.findOne({ email });
};

export const deletePendingByEmail = (email: string) => {
  return PendingSignup.deleteOne({ email });
};

export const createPendingSignup = (data: { email: string; otpHash: string }) => {
  return PendingSignup.create(data);
};

export const updateOtpAttempts = async (email: string) => {
  return PendingSignup.updateOne({ email }, { $inc: { otpAttempts: 1 } });
};

export const updateOtpSendCount = async (email: string) => {
  return PendingSignup.updateOne({ email }, { $inc: { sendCount: 1 } });
};

export const updateOtpNumber = async (email: string, otpHash: string) => {
  return PendingSignup.updateOne({ email }, { $set: { otpHash: otpHash } });
};

export const findSendCount = async (email: string) => {
  const data = await PendingSignup.findOne({ email });
  return data?.sendCount;
};
