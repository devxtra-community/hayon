import bcrypt from "bcrypt";
import crypto from "crypto";
import { findUserByEmail, createUser, findUserByIdSafe } from "../repositories/user.repository";
import { findPendingByEmail, deletePendingByEmail, createPendingSignup, updateOtpSendCount, updateOtpNumber, findSendCount} from "../repositories/pendingSignup.repository";
import { updateOtpAttempts } from "../repositories/pendingSignup.repository";
import { sendOtpMail } from "../utils/nodemailer";
import { v4 as uuidv4 } from "uuid";
import { RefreshToken } from "../models/refreshToken.model";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "../utils/jwt";
import { createRefreshToken } from "../repositories/refreshToken.repository";
import s3Service from "./s3/s3.service";
import { parseBase64Image } from "../utils/bufferConvertion";
import { findResetPasswordToken,setPasswordResetToken,updateUserPassword } from "../repositories/user.repository";
import { sendResetPasswordEmail } from "../utils/nodemailer";
import logger from "../utils/logger";



export const requestOtpService = async (email: string) => {
  if (!email) {
    throw new Error("Email is required");
  }

  email = email.toLowerCase().trim();

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  

  const sendCount = await findSendCount(email);
  if((sendCount ?? 0 ) >= 2){
    throw new Error("Too many Requests")
  }
  
  
  //  Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  
  
  const existPendingMail = await findPendingByEmail(email)
  if(existPendingMail){
      await updateOtpNumber(email, otpHash);
  }
  else{
    await createPendingSignup({
      email,
      otpHash,
    });
  }

  await sendOtpMail(email,otp);
  await updateOtpSendCount(email);

  return true;
};


export const verifyOtpService = async (email: string, otp: string) => {
  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  email = email.toLowerCase().trim();

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

  //need to delete pending after verification ?,  yes need to delete
  await deletePendingByEmail(email);
  
  return {
    email: pending.email,
  };
};



// nned to fix signup servie
export const signupService = async (data: any) => {


  const { email, password, confirmPassword, name, avatar } = data;

  const { buffer } = parseBase64Image(avatar);
  const uploadResult = await s3Service.uploadFile(`users/${name}/profile.png`, buffer, 'image/png');
  

  if (!email || !password || !confirmPassword || !name) {
    throw new Error("Missing required fields");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const normalizedEmail = email.toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await createUser({
    email: normalizedEmail,
    avatar: uploadResult.location,
    name,
    role: "user",
    auth: {
      provider: "email",
      passwordHash: passwordHash,
    },
  });


  // 🔐 Create refresh token session
  const tokenId = uuidv4();
  const refreshExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  await createRefreshToken({
    tokenId,
    userId: user._id,
    expiresAt: refreshExpiresAt,
  });

  const accessToken = generateAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    sub: user._id.toString(),
    tokenId,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};



export const loginService = async (data: any) => {
  const { email, password } = data;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const normalizedEmail = email.toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.auth.provider !== "email" || !user.auth.passwordHash) {
    throw new Error("Please login with Google");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.auth.passwordHash
  );

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Optional but recommended
  user.lastLogin = new Date();
  await user.save();

  // 🔐 Create refresh token session
  const tokenId = uuidv4();
  const refreshExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  await createRefreshToken({
    tokenId,
    userId: user._id,
    expiresAt: refreshExpiresAt,
  });

  const accessToken = generateAccessToken({
    sub: user._id.toString(),
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    sub: user._id.toString(),
    tokenId,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};


// check if needed to change to controller.

export const refreshService = async (refreshTokenJwt: string) => {
  // 1. Verify JWT signature
  const payload = verifyRefreshToken(refreshTokenJwt);

  // 2. Fetch DB record
  const existingToken = await RefreshToken.findOne({
    tokenId: payload.tokenId,
  });

  // 3. Hard fail conditions
  if (
    !existingToken ||
    existingToken.revoked ||
    existingToken.expiresAt < new Date()
  ) {
    // ⚠️ Possible token reuse attack
    throw new Error("Invalid refresh token");
  }

  // 4. Revoke old token (rotation)
  existingToken.revoked = true;
  await existingToken.save();

  // 5. Create new refresh token
  const newTokenId = uuidv4();
  const newExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  await RefreshToken.create({
    tokenId: newTokenId,
    userId: existingToken.userId,
    expiresAt: newExpiresAt,
  });

  // 6. Issue new tokens
  const accessToken = generateAccessToken({
    sub: existingToken.userId.toString(),
    role: "user", // or fetch role if needed
  });

  const refreshToken = generateRefreshToken({
    sub: existingToken.userId.toString(),
    tokenId: newTokenId,
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

  await RefreshToken.updateOne(
    { tokenId: payload.tokenId },
    { revoked: true }
  );
};

export const logoutAllService = async (userId: string) => {
  await RefreshToken.updateMany(
    { userId, revoked: false },
    { revoked: true }
  );
};


export const sendResetPasswordEmailService = async (email: string ) => {
  // Implementation for sending reset password email
  const resetToken = await setPasswordResetToken(email);
  logger.info(`Sending password reset email to ${email} , token ${resetToken}`);
   await sendResetPasswordEmail(email, resetToken);
}

export const resetPasswordService = async (email:string, newPassword:string , token: string) => {

  const resetToken = await findResetPasswordToken(email);
  logger.info(`Reset token from DB for ${email} : ${resetToken}`);
  if (!resetToken) {
    throw new Error("Invalid or expired reset token");
  }

  logger.info(`Comparing tokens: provided ${token} , stored ${resetToken}`);

  const isValid = await bcrypt.compare(token, resetToken );
  if (!isValid) {
    throw new Error("Invalid or expired reset token");
  }

  logger.info(`Reset token is valid for ${email}, updating password ${newPassword}.`);
  const passwordHash = bcrypt.hashSync(newPassword, 12);
  await updateUserPassword(email, passwordHash);
}