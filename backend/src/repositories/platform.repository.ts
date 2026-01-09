import socialAccountModel from "../models/socialAccount.model";
import logger from "../utils/logger";

export const updateBlueskyDetails = async (userId: string, blueskyData: Partial<any>) => {
  const socialAccount = await socialAccountModel.findOne({ userId });
  if (!socialAccount) {
    socialAccountModel.create({
      userId,
      bluesky: blueskyData,
    });
    return;
  }

  const res = await socialAccountModel.findOneAndUpdate(
    { userId },
    { bluesky: blueskyData },
    { new: true },
  );
  logger.info(`Bluesky details updated: ${JSON.stringify(res)}`);
  return;
};

export const findPlatformAccountByUserId = async (userId: string) => {
  return await socialAccountModel.findOne({ userId });
};

// Helper to update any platform generically or specific functions
// Flattened updates are simpler: we can just use $set on the top-level keys.

export const updateFacebookDetails = async (userId: string, data: Partial<any>) => {
  return await socialAccountModel.findOneAndUpdate(
    { userId },
    { $set: { facebook: data } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

export const updateInstagramDetails = async (userId: string, data: Partial<any>) => {
  return await socialAccountModel.findOneAndUpdate(
    { userId },
    { $set: { instagram: data } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

export const updateThreadsDetails = async (userId: string, data: Partial<any>) => {
  return await socialAccountModel.findOneAndUpdate(
    { userId },
    { $set: { threads: data } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};
