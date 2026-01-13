import socialAccountModel from "../models/socialAccount.model";

export const updateBlueskyDetails = async (
  userId: string,
  blueskyData: Record<string, unknown>,
) => {
  const update: Record<string, unknown> = {};
  for (const key in blueskyData) {
    update[`bluesky.${key}`] = blueskyData[key];
  }
  return await socialAccountModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

export const findPlatformAccountByUserId = async (userId: string) => {
  return await socialAccountModel.findOne({ userId });
};

export const updateFacebookDetails = async (userId: string, data: Record<string, unknown>) => {
  const update: Record<string, unknown> = {};
  for (const key in data) {
    update[`facebook.${key}`] = data[key];
  }
  return await socialAccountModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

export const updateInstagramDetails = async (userId: string, data: Record<string, unknown>) => {
  const update: Record<string, unknown> = {};
  for (const key in data) {
    update[`instagram.${key}`] = data[key];
  }
  return await socialAccountModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

export const updateThreadsDetails = async (userId: string, data: Record<string, unknown>) => {
  const update: Record<string, unknown> = {};
  for (const key in data) {
    update[`threads.${key}`] = data[key];
  }
  return await socialAccountModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

export const updateTumblerDetails = async (userId: string, tumblrData: Record<string, unknown>) => {
  const update: Record<string, unknown> = {};
  for (const key in tumblrData) {
    update[`tumblr.${key}`] = tumblrData[key];
  }
  return await socialAccountModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, upsert: true },
  );
};

export const updateMastodonDetails = async (userId: string, data: Record<string, unknown>) => {
  const update: Record<string, unknown> = {};
  for (const key in data) {
    update[`mastodon.${key}`] = data[key];
  }
  return await socialAccountModel.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};
