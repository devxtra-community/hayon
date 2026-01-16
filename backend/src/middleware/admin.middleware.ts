import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../utils/responses";

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.auth) {
    new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    return;
  }

  if (req.auth.role !== "admin") {
    new ErrorResponse("Forbidden - Admin only", { status: 403 }).send(res);
    return;
  }

  next();
};
