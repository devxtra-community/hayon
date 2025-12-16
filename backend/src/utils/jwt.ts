import jwt, { Secret } from "jsonwebtoken";
import dotenv from "dotenv";
import { ENV } from '../config/env';
dotenv.config();

/* ===================== SECRETS ===================== */

const ACCESS_TOKEN_SECRET: Secret = ENV.AUTH.ACCESS_TOKEN_SECRET as Secret;
const REFRESH_TOKEN_SECRET: Secret = ENV.AUTH.REFRESH_TOKEN_SECRET as Secret;


if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("JWT secrets are not defined");
}

/* ===================== EXPIRY ===================== */

const ACCESS_TOKEN_EXPIRES_IN = "10m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

/* ===================== PAYLOADS ===================== */

export interface AccessTokenPayload {
  sub: string;
  role: "user" | "admin";
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

/* ===================== GENERATORS ===================== */

export const generateAccessToken = (
  payload: AccessTokenPayload
): string => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

export const generateRefreshToken = (
  payload: RefreshTokenPayload
): string => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
};

/* ===================== VERIFIERS ===================== */

export const verifyAccessToken = (
  token: string
): AccessTokenPayload => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
  } catch {
    throw new Error("Invalid or expired access token");
  }
};

export const verifyRefreshToken = (
  token: string
): RefreshTokenPayload => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
};
