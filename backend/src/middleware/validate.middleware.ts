import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ErrorResponse } from "../utils/responses";

export const validate =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodError(result.error);

      new ErrorResponse("Validation failed", {
        status: 400,
        data: { errors },
      }).send(res);
      return;
    }

    req.body = result.data;
    next();
  };

function formatZodError(error: ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
