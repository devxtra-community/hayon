import { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis";
import { ErrorResponse } from "./responses";
import logger from "./logger";

export const rateLimiter = (
  prefix: string,
  limit: number,
  windowSeconds: number,
  getIdentifier?: (req: Request) => string | undefined,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = getIdentifier?.(req) || req.auth?.id || req.ip;

    if (!identifier) {
      next(); // Should not happen with req.ip fallback
      return;
    }

    // Key format: ratelimit:{prefix}:{identifier}:{window_start_timestamp}
    // We use a fixed-window approach where the window is identified by the floor of the current timestamp
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % windowSeconds);
    const key = `ratelimit:${prefix}:${identifier}:${windowStart}`;

    try {
      const current = await redisClient.incr(key);

      if (current === 1) {
        // First request in this window, set expiration
        await redisClient.expire(key, windowSeconds);
      }

      const remaining = Math.max(0, limit - current);
      const resetTime = windowStart + windowSeconds;

      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", resetTime);

      if (current > limit) {
        logger.warn(`[RateLimit] Blocked ${prefix} for ${identifier}`);
        res.setHeader("Retry-After", resetTime - now);
        new ErrorResponse("Too many requests.", {
          status: 429,
        }).send(res);
        return;
      }

      next();
    } catch (error) {
      logger.error(`[RateLimit] Error for ${key}:`, error);
      // Fail open: allow the request if Redis is down, but log the error
      next();
    }
  };
};
