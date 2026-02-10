import { mastodonAnalyticsService } from "./mastodon.analytics";
import { blueskyAnalyticsService } from "./bluesky.analytics";
import { tumblrAnalyticsService } from "./tumblr.analytics";
import { facebookAnalyticsService } from "./facebook.analytics";
import { instagramAnalyticsService } from "./instagram.analytics";
import { threadsAnalyticsService } from "./threads.analytics";

export type { PostMetrics, AccountMetrics } from "./mastodon.analytics";

export interface AnalyticsService {
  getPostMetrics(
    platformPostId: string,
    credentials: any,
    userId?: string,
  ): Promise<{
    likes: number;
    shares: number;
    comments: number;
    impressions?: number;
    reach?: number;
    saved?: number;
  }>;
  getAccountMetrics(
    credentials: any,
    userId?: string,
  ): Promise<{
    followers: number;
    totalPosts: number;
  }>;
}

/**
 * Factory to get the correct analytics service for a platform
 */
export function getAnalyticsService(platform: string): AnalyticsService | null {
  switch (platform) {
    case "mastodon":
      return mastodonAnalyticsService;
    case "bluesky":
      return blueskyAnalyticsService;
    case "tumblr":
      return tumblrAnalyticsService;
    case "facebook":
      return facebookAnalyticsService;
    case "instagram":
      return instagramAnalyticsService;
    case "threads":
      return threadsAnalyticsService;
    default:
      return null;
  }
}

export {
  mastodonAnalyticsService,
  blueskyAnalyticsService,
  tumblrAnalyticsService,
  facebookAnalyticsService,
  instagramAnalyticsService,
  threadsAnalyticsService,
};
