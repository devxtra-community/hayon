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
