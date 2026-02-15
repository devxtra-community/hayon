import User from "../models/user.model";
import crypto from "crypto";
import { ErrorResponse } from "../utils/responses";
import bcrypt from "bcrypt";
import logger from "../utils/logger";

export const findUserByEmail = async (email: string) => {
  return User.findOne({ email });
};

import { IUser } from "../interfaces/user.interface";

export const createUser = async (data: Partial<IUser>) => {
  return User.create(data);
};

export const findUserByIdSafe = async (userId: string) => {
  return User.findById(userId).select(
    "-auth.passwordHash -auth.verificationToken -auth.resetToken -auth.passwordResetToken",
  );
};

export const findUserByIdWithAuth = async (userId: string) => {
  return User.findById(userId).select("+auth.passwordHash");
};

export const setPasswordResetToken = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ErrorResponse("User not found");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = bcrypt.hashSync(resetToken, 12);

  await User.updateOne(
    { email },
    {
      $set: {
        "auth.passwordResetToken": {
          token: hashedToken,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      },
    },
  );
  return resetToken;
};

export const findResetPasswordToken = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ErrorResponse("User not found");
  }
  logger.info(`Found reset token for user ${email}: ${user}`);
  return user.auth.passwordResetToken?.token;
};

export const updateUserPassword = async (userId: string, newPasswordHash: string) => {
  return User.updateOne({ _id: userId }, { $set: { "auth.passwordHash": newPasswordHash } });
};

export const updateAvatar = async (userId: string, avatarUrl: string) => {
  const user = await User.findOneAndUpdate({ _id: userId }, { avatar: avatarUrl });

  return user;
};

export const updateUserAvatar = async (userId: string, avatarUrl: string) => {
  return User.findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true });
};

export const changeUserTimezone = async (userId: string, timezone: string) => {
  return User.findByIdAndUpdate(userId, { timezone }, { new: true });
};

export const changeUserName = async (userId: string, name: string) => {
  return User.findByIdAndUpdate(userId, { name }, { new: true });
};

export const IncreaseCaptionGenerations = async (userId: string) => {
  return User.findByIdAndUpdate(userId, { $inc: { "usage.captionGenerations": 1 } }, { new: true });
};

export const IncreasePostsCreated = async (userId: string) => {
  return User.findByIdAndUpdate(userId, { $inc: { "usage.postsCreated": 1 } }, { new: true });
};

export const findAllUsers = async () => {
  return User.find();
};

export const updateUserSubscription = async (userId: string, plan: "free" | "pro") => {
  return User.findByIdAndUpdate(userId, { $set: { "subscription.plan": plan } }, { new: true });
};

export const updateUserActivityById = async (userId: string, activity: boolean) => {
  return User.findByIdAndUpdate(userId, { $set: { isDisabled: activity } }, { new: true });
};

export const getUsersAnalytics = async () => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isDisabled: false });
  const inactiveUsers = await User.countDocuments({ isDisabled: true });
  const paidUsers = await User.countDocuments({ "subscription.plan": "pro" });
  const topPlan = await User.aggregate([
    { $group: { _id: "$subscription.plan", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    paidUsers,
    topPlan: topPlan[0]?._id || "None",
  };
};
