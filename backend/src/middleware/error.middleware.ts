import express from "express";
import { ErrorResponse } from "../utils/responses";
import logger from "../utils/logger";

interface CustomError extends Error {
  status?: number;
}

export function serverErrorHandler(
  err: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) {
  logger.error("Error:", err);
  const message = (err as CustomError).message || "Internal server error";
  const status = (err as CustomError).status || 500;

  new ErrorResponse(message, { status }).send(res);
}

export function notFoundHandler(req: express.Request, res: express.Response) {
  new ErrorResponse("Route not found", { status: 404 }).send(res);
}
