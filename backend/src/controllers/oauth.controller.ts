import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { createRefreshToken } from "../repositories/refreshToken.repository";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { setRefreshTokenCookie } from "../utils/setAuthCookies";
import passport from "../config/passport";
import { ENV } from "../config/env";
import logger from "../utils/logger";

export const initiateGoogleLogin = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
});

export const handleGoogleCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      logger.error("Google OAuth error:", err);
      return res.redirect(`${ENV.APP.FRONTEND_URL}/login?error=google_auth_failed`);
    }

    if (!user) {
      const errorMessage = info?.message || "google_auth_failed";
      return res.redirect(`${ENV.APP.FRONTEND_URL}/login?error=${errorMessage}`);
    }

    req.user = user;
    return next();
  })(req, res, next);
};

export const googleOAuthCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const oauthUser = req.user as {
      userId: string;
      role: "user" | "admin";
    };

    if (!oauthUser?.userId) {
      throw new Error("Invalid OAuth user");
    }

    const tokenId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await createRefreshToken({
      tokenId,
      userId: oauthUser.userId as any,
      expiresAt,
    });

    const accessToken = generateAccessToken({
      sub: oauthUser.userId,
      role: oauthUser.role,
    });

    const refreshToken = generateRefreshToken({
      sub: oauthUser.userId,
      tokenId,
    });

    setRefreshTokenCookie(res, refreshToken);

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback#accessToken=${accessToken}`);
  } catch {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
  }
};
