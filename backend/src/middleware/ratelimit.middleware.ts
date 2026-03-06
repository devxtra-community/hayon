import { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis";
import { ErrorResponse } from "../utils/responses";
import logger from "../utils/logger";

export const rateLimiter = (
  prefix: string,
  limit: number,
  windowSeconds: number,
  getIdentifier?: (req: Request) => string | undefined,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = getIdentifier?.(req) || req.auth?.id;

    if (!identifier) {
      next();
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % windowSeconds);
    const key = `ratelimit:${prefix}:${identifier}:${windowStart}`;

    try {
      const current = await redisClient.incr(key);

      if (current === 1) {
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
      next();
    }
  };
};
