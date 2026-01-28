import { BasePostingService, PostResult } from "./base.posting.service";
import { BlueskyPostingService } from "./bluesky.posting.service";
import { InstagramPostingService } from "./instagram.posting.service";
import { ThreadsPostingService } from "./threads.posting.service";
import { FacebookPostingService } from "./facebook.posting.service";
import { MastodonPostingService } from "./mastodon.posting.service";
import { TumblrPostingService } from "./tumblr.posting.service";
import { PlatformType } from "../../interfaces/post.interface";
import SocialAccountModel from "../../models/socialAccount.model";

const serviceMap: Record<PlatformType, new () => BasePostingService> = {
  bluesky: BlueskyPostingService,
  instagram: InstagramPostingService,
  threads: ThreadsPostingService,
  facebook: FacebookPostingService,
  mastodon: MastodonPostingService,
  tumblr: TumblrPostingService,
};

export function getPostingService(platform: PlatformType): BasePostingService {
  const ServiceClass = serviceMap[platform];
  if (!ServiceClass) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return new ServiceClass();
}

/**
 * Fetches platform data for a specific platform from SocialAccountModel.
 *
 * Returns the full platform object (e.g., socialAccount.mastodon) which includes:
 * - auth: { accessToken, etc. }
 * - Metadata: instanceUrl, handle, platformId, etc.
 */
export async function getCredentialsForPlatform(
  userId: string,
  platform: PlatformType,
): Promise<any | null> {
  const socialAccount = await SocialAccountModel.findOne(
    { userId },
    { [platform]: 1 }, // Projection: only fetch the platform we need
  ).lean();

  if (!socialAccount) {
    return null;
  }

  const platformData = (socialAccount as any)[platform];

  if (platform === "instagram") {
    console.log("🔍 Instagram credentials fetched:", JSON.stringify(platformData, null, 2));
  }

  // For some reason Mongoose might return the key but with no data
  if (!platformData || !platformData.connected) {
    return null;
  }

  // Return the full platform object.
  // The specific service will destructure what it needs (auth, instanceUrl, etc.)
  return platformData;
}

export async function validateCredentials(
  userId: string,
  platform: PlatformType,
): Promise<{ valid: boolean; error?: string }> {
  // TEMP STUB — replace with DB lookup later

  if (!userId || !platform) {
    return {
      valid: false,
      error: "Invalid user or platform",
    };
  }

  // Assume credentials exist for now
  return { valid: true };
}

export { BasePostingService, PostResult };
export { BlueskyPostingService } from "./bluesky.posting.service";
export { InstagramPostingService } from "./instagram.posting.service";
export { ThreadsPostingService } from "./threads.posting.service";
export { FacebookPostingService } from "./facebook.posting.service";
export { MastodonPostingService } from "./mastodon.posting.service";
export { TumblrPostingService } from "./tumblr.posting.service";
