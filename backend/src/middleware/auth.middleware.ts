import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ErrorResponse } from "../utils/responses";
import * as UserRepository from "../repositories/user.repository";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      new ErrorResponse("Unauthorized", { status: 401 }).send(res);
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    const user = await UserRepository.findUserByIdSafe(payload.sub);

    if (!user) {
      new ErrorResponse("User no longer exists", { status: 401 }).send(res);
      return;
    }

    req.auth = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      timezone: user.timezone,
      role: user.role,
      plan: user.subscription?.plan || "free",
      subscription: user.subscription,
      usage: user.usage,
      limits: user.limits,
      isDisabled: user.isDisabled,
    };

    next();
  } catch {
    new ErrorResponse("Invalid or expired access token", {
      status: 401,
    }).send(res);
  }
};
