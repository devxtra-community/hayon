import { Response } from "express";
import { ENV } from "../config/env";

export const setCookieToken = (res: Response, token: string) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: ENV.APP.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
