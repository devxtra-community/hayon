import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ErrorResponse } from "../utils/responses";

/**
 * Zod validation middleware factory.
 *
 * Creates an Express middleware that validates req.body against the provided Zod schema.
 * If validation fails, returns a 400 Bad Request with structured error messages.
 * If validation succeeds, replaces req.body with the parsed (sanitized) data and continues.
 *
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * // In routes file:
 * import { validate } from "../middleware/validate.middleware";
 * import { loginSchema } from "@schemas";
 *
 * router.post("/login", validate(loginSchema), loginController);
 */
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

    // Replace req.body with parsed data (includes transformations like toLowerCase)
    req.body = result.data;
    next();
  };

/**
 * Formats Zod validation errors into a structured object.
 * Returns field-level errors for easy consumption by frontend forms.
 *
 * @param error - ZodError from failed validation
 * @returns Object mapping field names to error messages
 */
function formatZodError(error: ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
