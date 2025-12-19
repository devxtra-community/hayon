import { Response } from "express";
import { ENV } from "../config/env";

export const setRefreshTokenCookie = (
  res: Response,
  refreshToken: string
) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
secure: ENV.APP.NODE_ENV === "production",    
sameSite: "strict",
    path: "api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};
