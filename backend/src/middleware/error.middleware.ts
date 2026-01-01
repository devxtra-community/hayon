import express from "express";
import { ErrorResponse } from "../utils/responses";
import logger from "../utils/logger";

export function serverErrorHandler(
  err: any,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) {
  logger.error("Error:", err);
  new ErrorResponse(err.message || "Internal server error", { status: err.status || 500 }).send(
    res,
  );
}

export function notFoundHandler(req: express.Request, res: express.Response) {
  new ErrorResponse("Route not found", { status: 404 }).send(res);
}
