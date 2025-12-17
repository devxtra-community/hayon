import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { createRefreshToken } from "../repositories/refreshToken.repository";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt";
import { setRefreshTokenCookie } from "../utils/setAuthCookies";
import { SuccessResponse, ErrorResponse } from "../utils/responses";

export const googleOAuthCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const oauthUser = req.user as {
      userId: string;
      role: "user" | "admin";
    };

    if (!oauthUser?.userId) {
      throw new Error("Invalid OAuth user");
    }

    const tokenId = uuidv4();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await createRefreshToken({
      tokenId,
      userId: oauthUser.userId as any,
      expiresAt,
    });

    // const accessToken = generateAccessToken({
    //   sub: oauthUser.userId,
    //   role: oauthUser.role,
    // });

    const refreshToken = generateRefreshToken({
      sub: oauthUser.userId,
      tokenId,
    });

    setRefreshTokenCookie(res, refreshToken);

 //   Used  fragment
    // res.redirect(
    //   `${process.env.FRONTEND_URL}/auth/callback#accessToken=${accessToken}`
    // );

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?success=true`);
  } catch (error) {
    res.redirect(
      `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
    );
  }
};