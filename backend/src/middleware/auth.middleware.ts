import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ErrorResponse } from "../utils/responses";

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      new ErrorResponse("Unauthorized", { status: 401 }).send(res);
      return;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    req.auth = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    new ErrorResponse("Invalid or expired access token", {
      status: 401,
    }).send(res);
  }
};
