import bcrypt from "bcrypt";
import crypto from "crypto";
import { findByEmail, createUser } from "../repositories/user.repository";
import { generateToken } from "../utils/jwt";
import {
  findPendingByEmail,
  deletePendingByEmail,
  createPendingSignup,
} from "../repositories/pendingSignup.repository";

import PendingSignup from "../models/pendingSignup.model";
import { updateOtpAttempts } from "../repositories/pendingSignup.repository";

export const requestOtpService = async (
  email: string,
) => {
  if (!email) {
    throw new Error("Email is required");
  }

  email = email.toLowerCase().trim();

  const existingUser = await findByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  //  Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();


  const otp_hash = await bcrypt.hash(otp, 10);

  await deletePendingByEmail(email);


  await createPendingSignup({
    email,
    otp_hash,
    otp_expires: new Date(Date.now() + 5 * 60 * 1000), // 5 min
  });

  // SEND OTP EMAIL HERE 
  // sendEmail(email, otp)

  // Nodemailer setup , todo: 

  return true;
};

export const verifyOtpService = async (
  email: string,
  otp: string
) => {
  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  email = email.toLowerCase().trim();


  const pending = await findPendingByEmail(email);
  if (!pending) {
    throw new Error("OTP not found or expired");
  }

  if (pending.otp_expires < new Date()) {
    throw new Error("OTP expired");
  }

  if (pending.otp_attempts >= 5) {
    throw new Error("Too many OTP attempts");
  }

  const isValid = await bcrypt.compare(otp, pending.otp_hash);

  if (!isValid) {
    await updateOtpAttempts(email);
    throw new Error("Invalid OTP");
  }
  //need to delete pending after verification?
  await deletePendingByEmail(email);
  return {
    email: pending.email
  };
};













































// nned to fix signup servie
export const signupService = async (data: any) => {
  const { email, password, confirmPassword, name, timezone } = data;

  if (!email || !password || !confirmPassword || !name) {
    throw new Error("Missing required fields");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const existingUser = await findByEmail(email.toLowerCase());
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const password_hash = await bcrypt.hash(password, 12);

  const user = await createUser({
    email: email.toLowerCase(),
    name,
    auth: {
      provider: "email",
      password_hash,
      email_verified: false,
    },
    role: "user",
  });

  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return { user, token };
};
