import { Request, Response, NextFunction } from "express";
import { findUserByIdSafe } from "../repositories/user.repository";

export const checkUserGenerationLimit = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.auth?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await findUserByIdSafe(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Use values from DB if present, otherwise use defaults
  const limit =
    user.limits?.maxCaptionGenerations || (user.subscription?.plan === "pro" ? 100 : 50);
  const usage = user.usage?.captionGenerations || 0;

  console.log(`[LimitCheck] User: ${userId}, Usage: ${usage}, Limit: ${limit}`);

  if (usage >= limit) {
    return res.status(403).json({
      message: "Generation limit reached",
      usage,
      limit,
    });
  }

  return next();
};

export const checkUserPostLimit = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.auth?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await findUserByIdSafe(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const limit = user.limits?.maxPosts || (user.subscription?.plan === "pro" ? 200 : 100);
  const usage = user.usage?.postsCreated || 0;

  console.log(`[LimitCheck] User: ${userId}, PostUsage: ${usage}, PostLimit: ${limit}`);

  if (usage >= limit) {
    return res.status(403).json({
      message: "Post creation limit reached",
      usage,
      limit,
    });
  }

  return next();
};
