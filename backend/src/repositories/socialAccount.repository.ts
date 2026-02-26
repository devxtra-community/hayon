import SocialAccountModel from "../models/socialAccount.model";
import { PlatformType } from "../interfaces/post.interface";

/**
 * Update the health status of a social account for a specific platform
 */
export const updateHealthStatus = async (
  userId: string,
  platform: PlatformType,
  status: "active" | "expired" | "revoked" | "error",
  error?: string,
) => {
  const healthUpdate: any = {};
  healthUpdate[`${platform}.health.status`] = status;
  healthUpdate[`${platform}.health.needsReconnection`] = status !== "active";
  healthUpdate[`${platform}.health.lastError`] = error;

  return await SocialAccountModel.updateOne({ userId }, { $set: healthUpdate });
};

/**
 * Find social account by user ID
 */
export const findByUserId = async (userId: string) => {
  return await SocialAccountModel.findOne({ userId });
};

/**
 * Update Bluesky session tokens
 */
export const updateBlueskyAuth = async (
  userId: string,
  session: { accessJwt: string; refreshJwt: string },
) => {
  return await SocialAccountModel.updateOne(
    { userId },
    {
      $set: {
        "bluesky.auth.accessJwt": session.accessJwt,
        "bluesky.auth.refreshJwt": session.refreshJwt,
        "bluesky.health.lastSuccessfulRefresh": new Date(),
        "bluesky.health.status": "active",
      },
    },
  );
};

/**
 * Fetch all social accounts (used for cron scheduling)
 */
export const findAll = async () => {
  return await SocialAccountModel.find({});
};

/**
 * Get credentials for a specific platform
 */
export const getCredentials = async (userId: string, platform: PlatformType) => {
  const socialAccount = await SocialAccountModel.findOne({ userId }, { [platform]: 1 }).lean();

  if (!socialAccount) return null;

  const platformData = (socialAccount as any)[platform];
  if (!platformData || !platformData.connected) return null;

  return platformData;
};
