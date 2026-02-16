import bcrypt from "bcrypt";
import crypto from "crypto";
import { findUserByEmail, createUser, findUserByIdSafe } from "../repositories/user.repository";
import { Types } from "mongoose";
import {
  findPendingByEmail,
  deletePendingByEmail,
  createPendingSignup,
  updateOtpSendCount,
  updateOtpNumber,
  findSendCount,
} from "../repositories/pendingSignup.repository";
import { updateOtpAttempts } from "../repositories/pendingSignup.repository";
import { sendOtpMail } from "../utils/nodemailer";
import { v4 as uuidv4 } from "uuid";
import * as RefreshTokenRepository from "../repositories/refreshToken.repository";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { createRefreshToken } from "../repositories/refreshToken.repository";
import s3Service from "./s3/s3.service";
import { parseBase64Image } from "../utils/bufferConvertion";
import {
  findResetPasswordToken,
  setPasswordResetToken,
  updateUserPassword,
} from "../repositories/user.repository";
import { sendResetPasswordEmail } from "../utils/nodemailer";
import logger from "../utils/logger";

interface SignupData {
  email: string;
  password: string;
  name: string;
  avatar: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const requestOtpService = async (email: string) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const sendCount = await findSendCount(email);
  if ((sendCount ?? 0) >= 2) {
    throw new Error("Too many Requests");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  const existPendingMail = await findPendingByEmail(email);
  if (existPendingMail) {
    await updateOtpNumber(email, otpHash);
  } else {
    await createPendingSignup({
      email,
      otpHash,
    });
  }

  await sendOtpMail(email, otp);
  await updateOtpSendCount(email);

  return true;
};

export const verifyOtpService = async (email: string, otp: string) => {
  const pending = await findPendingByEmail(email);
  if (!pending) {
    throw new Error("OTP not found or expired");
  }

  if (pending.otpAttempts >= 5) {
    throw new Error("Too many OTP attempts");
  }

  const isValid = await bcrypt.compare(otp, pending.otpHash);

  if (!isValid) {
    await updateOtpAttempts(email);
    throw new Error("Invalid OTP");
  }

  await deletePendingByEmail(email);

  return {
    email: pending.email,
  };
};

export const signupService = async (data: SignupData, ipAddress?: string, userAgent?: string) => {
  const { email, password, name, avatar } = data;

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const userId = new Types.ObjectId();

  const { buffer } = parseBase64Image(avatar);
  const uploadResult = await s3Service.uploadFile(
    `users/${userId}/profile.png`,
    buffer,
    "image/png",
  );

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await createUser({
    _id: userId,
    email: email,
    avatar: uploadResult.location,
    name,
    role: "user",
    auth: {
      provider: "email",
      passwordHash: passwordHash,
      googleId: null,
      passwordResetToken: null,
    },
  });

  const tokenId = uuidv4();
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await createRefreshToken({
    tokenId,
    userId: user._id,
    role: user.role,
    expiresAt: refreshExpiresAt,
    ipAddress,
    userAgent,
  });

  const accessToken = generateAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    sub: user._id.toString(),
    tokenId,
    role: user.role,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const loginService = async (data: LoginData, ipAddress?: string, userAgent?: string) => {
  const { email, password } = data;

  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "user") {
    throw new Error("You are not authorized to login here");
  }

  if (user.auth.provider !== "email" || !user.auth.passwordHash) {
    throw new Error("Please login with Google");
  }

  const isPasswordValid = await bcrypt.compare(password, user.auth.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  user.lastLogin = new Date();
  await user.save();

  const tokenId = uuidv4();
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await createRefreshToken({
    tokenId,
    role: user.role,
    userId: user._id,
    expiresAt: refreshExpiresAt,
    ipAddress,
    userAgent,
  });

  const accessToken = generateAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    sub: user._id.toString(),
    role: user.role,
    tokenId,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const adminLoginService = async (
  data: LoginData,
  ipAddress?: string,
  userAgent?: string,
) => {
  const { email, password } = data;

  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.role !== "admin") {
    throw new Error("You are not authorized to login here");
  }

  if (user.auth.provider !== "email" || !user.auth.passwordHash) {
    throw new Error("Please login with Google");
  }

  const isPasswordValid = await bcrypt.compare(password, user.auth.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  user.lastLogin = new Date();
  await user.save();

  const tokenId = uuidv4();
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await createRefreshToken({
    tokenId,
    userId: user._id,
    role: user.role,
    expiresAt: refreshExpiresAt,
    ipAddress,
    userAgent,
  });

  console.log("refresh token created"); // Debugging line

  const accessToken = generateAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    sub: user._id.toString(),
    tokenId,
    role: user.role,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const refreshService = async (
  refreshTokenJwt: string,
  ipAddress?: string,
  userAgent?: string,
) => {
  const payload = verifyRefreshToken(refreshTokenJwt);

  const existingToken = await RefreshTokenRepository.findByTokenId(payload.tokenId);

  if (!existingToken) {
    throw new Error("Invalid refresh token");
  }

  if (existingToken.revoked) {
    await logoutAllService(existingToken.userId.toString());
    throw new Error("Security alert: Token reuse detected. All sessions have been terminated.");
  }

  if (existingToken.expiresAt < new Date()) {
    throw new Error("Invalid refresh token");
  }

  await RefreshTokenRepository.revokeToken(existingToken.tokenId);

  const newTokenId = uuidv4();
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await RefreshTokenRepository.createRefreshToken({
    tokenId: newTokenId,
    userId: existingToken.userId,
    role: existingToken.role,
    expiresAt: newExpiresAt,
    ipAddress: ipAddress || (existingToken as any).ipAddress, // Update if new, else keep old
    userAgent: userAgent || (existingToken as any).userAgent,
  });

  const accessToken = generateAccessToken({
    sub: existingToken.userId.toString(),
    role: existingToken.role,
  });

  const refreshToken = generateRefreshToken({
    sub: existingToken.userId.toString(),
    tokenId: newTokenId,
    role: existingToken.role,
  });

  return { accessToken, refreshToken };
};

export const getCurrentUserService = async (userId: string) => {
  const user = await findUserByIdSafe(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const logoutService = async (refreshTokenJwt: string) => {
  const payload = verifyRefreshToken(refreshTokenJwt);

  await RefreshTokenRepository.revokeToken(payload.tokenId);
};

export const logoutAllService = async (userId: string) => {
  await RefreshTokenRepository.revokeAllForUser(userId);
};

export const sendResetPasswordEmailService = async (email: string) => {
  const resetToken = await setPasswordResetToken(email);
  logger.info(`Sending password reset email to ${email} , token ${resetToken}`);
  await sendResetPasswordEmail(email, resetToken);
};

export const resetPasswordService = async (email: string, newPassword: string, token: string) => {
  const resetToken = await findResetPasswordToken(email);
  logger.info(`Reset token from DB for ${email} : ${resetToken}`);
  if (!resetToken) {
    throw new Error("Invalid or expired reset token");
  }

  logger.info(`Comparing tokens: provided ${token} , stored ${resetToken}`);

  const isValid = await bcrypt.compare(token, resetToken);
  if (!isValid) {
    throw new Error("Invalid or expired reset token");
  }

  logger.info(`Reset token is valid for ${email}, updating password ${newPassword}.`);
  const passwordHash = bcrypt.hashSync(newPassword, 12);
  await updateUserPassword(email, passwordHash);
};

export const getDevicesService = async (userId: string, currentRefreshTokenJwt?: string) => {
  let currentTokenId = "";
  if (currentRefreshTokenJwt) {
    try {
      const payload = verifyRefreshToken(currentRefreshTokenJwt);
      currentTokenId = payload.tokenId;
    } catch {
      // Ignore invalid token
    }
  }

  const devices = await RefreshTokenRepository.findActiveByUserId(userId);

  return devices.map((device) => ({
    ...device,
    isCurrent: device.tokenId === currentTokenId,
  }));
};

export const logoutDeviceService = async (userId: string, tokenId: string) => {
  const token = await RefreshTokenRepository.findByTokenId(tokenId);
  if (!token || token.userId.toString() !== userId) {
    throw new Error("Device not found or unauthorized");
  }
  await RefreshTokenRepository.revokeToken(tokenId);
};
