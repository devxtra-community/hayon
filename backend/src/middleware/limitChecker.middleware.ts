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

  const limits = user.subscription.plan === "free" ? 10 : 30;
  const usage = user.usage.captionGenerations;

  if (limits <= usage) {
    return res.status(403).json({ message: "Generation limit reached" });
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

  const limits = user.subscription.plan === "free" ? 10 : 30;
  const usage = user.usage.postsCreated;

  if (limits <= usage) {
    return res.status(403).json({ message: "Post creation limit reached" });
  }

  return next();
};
