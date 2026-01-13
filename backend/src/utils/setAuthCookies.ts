import { Response } from "express";

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true, 
    sameSite: "none", 
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};
