// ============================================================================
// POSTING SERVICE FACTORY - SKELETON WITH TODO COMMENTS
// ============================================================================
// File: src/services/posting/index.ts
// Purpose: Factory to get platform-specific posting services and credential fetching
// ============================================================================

import { BasePostingService, PostResult } from "./base.posting.service";
import { BlueskyPostingService } from "./bluesky.posting.service";
import { InstagramPostingService } from "./instagram.posting.service";
import { ThreadsPostingService } from "./threads.posting.service";
import { FacebookPostingService } from "./facebook.posting.service";
import { MastodonPostingService } from "./mastodon.posting.service";
import { TumblrPostingService } from "./tumblr.posting.service";
import { PlatformType } from "../../interfaces/post.interface";

// ============================================================================
// FACTORY - Get posting service by platform
// ============================================================================

/*
 * Used by worker to get the correct posting service.
 * 
 * Usage in worker:
 * const service = getPostingService(payload.platform);
 * const result = await service.execute(payload, credentials);
 */

const serviceMap: Record<PlatformType, new () => BasePostingService> = {
    bluesky: BlueskyPostingService,
    instagram: InstagramPostingService,
    threads: ThreadsPostingService,
    facebook: FacebookPostingService,
    mastodon: MastodonPostingService,
    tumblr: TumblrPostingService
};

export function getPostingService(platform: PlatformType): BasePostingService {
    const ServiceClass = serviceMap[platform];
    if (!ServiceClass) {
        throw new Error(`Unknown platform: ${platform}`);
    }
    return new ServiceClass();
}

// ============================================================================
// CREDENTIAL FETCHING
// ============================================================================

/*
 * TODO: Implement getCredentialsForPlatform
 * 
 * Fetches the appropriate credentials from SocialAccountModel
 * based on platform and userId.
 * 
 * Each platform has different credential structures:
 * - Bluesky: session (accessJwt, refreshJwt, did, handle)
 * - Instagram: igUserId, accessToken, linkedPageId
 * - Threads: threadsUserId, accessToken
 * - Facebook: pageId, accessToken (page token)
 * - Mastodon: instanceUrl, accessToken
 * - Tumblr: blogHostname, oauthToken, oauthTokenSecret
 * 
 * Usage in worker:
 * const credentials = await getCredentialsForPlatform(userId, platform);
 * if (!credentials) throw new Error("Account not connected");
 * const result = await service.execute(payload, credentials);
 */

import SocialAccountModel from "../../models/socialAccount.model";

export async function getCredentialsForPlatform(
    userId: string,
    platform: PlatformType
): Promise<any | null> {
    // TODO: Implement credential extraction

    // const socialAccount = await SocialAccountModel.findOne({ userId });
    // if (!socialAccount) return null;
    // 
    // const platformData = socialAccount[platform];
    // if (!platformData?.connected) return null;
    // 
    // switch (platform) {
    //   case "bluesky":
    //     return {
    //       session: {
    //         did: platformData.did,
    //         handle: platformData.handle,
    //         accessJwt: platformData.auth.accessJwt,
    //         refreshJwt: platformData.auth.refreshJwt
    //       },
    //       handle: platformData.handle
    //     };
    //     
    //   case "instagram":
    //     return {
    //       igUserId: platformData.platformId,
    //       accessToken: platformData.auth.accessToken,
    //       linkedPageId: platformData.linkedPageId
    //     };
    //     
    //   case "threads":
    //     return {
    //       threadsUserId: platformData.platformId,
    //       accessToken: platformData.auth.accessToken
    //     };
    //     
    //   case "facebook":
    //     return {
    //       pageId: platformData.platformId,
    //       accessToken: platformData.auth.accessToken
    //     };
    //     
    //   case "mastodon":
    //     return {
    //       instanceUrl: platformData.instanceUrl,
    //       accessToken: platformData.auth.accessToken,
    //       accountId: platformData.accountId
    //     };
    //     
    //   case "tumblr":
    //     return {
    //       blogHostname: platformData.blogHostname,
    //       oauthToken: platformData.auth.oauthToken,
    //       oauthTokenSecret: platformData.auth.oauthTokenSecret
    //     };
    //     
    //   default:
    //     return null;
    // }

    return null;
}

// ============================================================================
// HEALTH CHECK - Validate credentials before posting
// ============================================================================

/*
 * TODO: Implement validateCredentials
 * 
 * Before posting, check if credentials are still valid:
 * - Token not expired
 * - Account not disconnected
 * - Health status is "active"
 * 
 * If expired/invalid:
 * - Update health status in DB
 * - Return error indicating reconnection needed
 */

export async function validateCredentials(
    userId: string,
    platform: PlatformType
): Promise<{ valid: boolean; error?: string }> {
    // TODO: Implement

    // const socialAccount = await SocialAccountModel.findOne({ userId });
    // const platformData = socialAccount?.[platform];
    // 
    // if (!platformData?.connected) {
    //   return { valid: false, error: "Account not connected" };
    // }
    // 
    // if (platformData.health?.status !== "active") {
    //   return { valid: false, error: `Account status: ${platformData.health?.status}` };
    // }
    // 
    // // Check token expiry based on platform
    // const expiresAt = platformData.auth?.expiresAt;
    // if (expiresAt && new Date(expiresAt) < new Date()) {
    //   // Mark as needing reconnection
    //   await SocialAccountModel.updateOne(
    //     { userId },
    //     { [`${platform}.health.status`]: "expired", [`${platform}.health.needsReconnection`]: true }
    //   );
    //   return { valid: false, error: "Token expired - needs reconnection" };
    // }
    // 
    // return { valid: true };

    return { valid: true };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { BasePostingService, PostResult };
export { BlueskyPostingService } from "./bluesky.posting.service";
export { InstagramPostingService } from "./instagram.posting.service";
export { ThreadsPostingService } from "./threads.posting.service";
export { FacebookPostingService } from "./facebook.posting.service";
export { MastodonPostingService } from "./mastodon.posting.service";
export { TumblrPostingService } from "./tumblr.posting.service";
