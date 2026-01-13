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
    "-auth.passwordHash -auth.verificationToken -auth.resetToken",
  );
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

export const updateUserPassword = async (email: string, newPasswordHash: string) => {
  return User.updateOne({ email }, { auth: { passwordHash: newPasswordHash } });
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
