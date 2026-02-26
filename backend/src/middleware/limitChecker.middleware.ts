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

  const maxGenerations = user.limits.maxCaptionGenerations;
  const usage = user.usage.captionGenerations;

  if (usage >= maxGenerations) {
    return res.status(403).json({
      message: `AI generation limit reached (${usage}/${maxGenerations}). ${
        user.subscription.plan === "free"
          ? "Upgrade to Pro for more."
          : "Limit resets on your next billing cycle."
      }`,
      usage,
      limit: maxGenerations,
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

  const maxPosts = user.limits.maxPosts;
  const usage = user.usage.postsCreated;

  if (usage >= maxPosts) {
    return res.status(403).json({
      message: `Post creation limit reached (${usage}/${maxPosts}). ${
        user.subscription.plan === "free"
          ? "Upgrade to Pro for more."
          : "Limit resets on your next billing cycle."
      }`,
      usage,
      limit: maxPosts,
    });
  }

  return next();
};
