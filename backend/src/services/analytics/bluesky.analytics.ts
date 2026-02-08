import { AtpAgent } from "@atproto/api";
import logger from "../../utils/logger";
import SocialAccountModel from "../../models/socialAccount.model";

export interface PostMetrics {
  likes: number;
  shares: number;
  comments: number;
  impressions?: number;
  reach?: number;
  saved?: number;
}

export interface AccountMetrics {
  followers: number;
  totalPosts: number;
}

interface BlueskyCredentials {
  did: string;
  handle: string;
  auth: {
    accessJwt: string;
    refreshJwt: string;
  };
}

/**
 * Fetches analytics data from Bluesky using @atproto/api
 */
export class BlueskyAnalyticsService {
  private async getAgent(userId: string, credentials: BlueskyCredentials): Promise<AtpAgent> {
    const agent = new AtpAgent({
      service: "https://bsky.social",
      persistSession: async (_evt, session) => {
        if (session) {
          // Persist refreshed tokens to DB
          try {
            await SocialAccountModel.updateOne(
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
          } catch (err) {
            logger.error("[BlueskyAnalytics] Failed to persist session", { error: err });
          }
        }
      },
    });

    await agent.resumeSession({
      did: credentials.did,
      handle: credentials.handle,
      accessJwt: credentials.auth.accessJwt,
      refreshJwt: credentials.auth.refreshJwt,
      active: true,
    });

    return agent;
  }

  /**
   * Fetch metrics for a specific post
   * The platformPostId for Bluesky is the AT URI (at://did:plc:.../app.bsky.feed.post/...)
   */
  async getPostMetrics(
    platformPostId: string,
    credentials: BlueskyCredentials,
    userId: string,
  ): Promise<PostMetrics> {
    try {
      const agent = await this.getAgent(userId, credentials);

      const response = await agent.getPosts({ uris: [platformPostId] });

      if (!response.data.posts || response.data.posts.length === 0) {
        throw new Error(`Post not found: ${platformPostId}`);
      }

      const post = response.data.posts[0];

      return {
        likes: post.likeCount || 0,
        shares: post.repostCount || 0,
        comments: post.replyCount || 0,
      };
    } catch (error: any) {
      logger.error(`[BlueskyAnalytics] Failed to fetch post metrics`, {
        platformPostId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Fetch account-level metrics (followers)
   */
  async getAccountMetrics(
    credentials: BlueskyCredentials,
    userId: string,
  ): Promise<AccountMetrics> {
    try {
      const agent = await this.getAgent(userId, credentials);

      const response = await agent.getProfile({ actor: credentials.did });

      return {
        followers: response.data.followersCount || 0,
        totalPosts: response.data.postsCount || 0,
      };
    } catch (error: any) {
      logger.error(`[BlueskyAnalytics] Failed to fetch account metrics`, {
        error: error.message,
      });
      throw error;
    }
  }
}

export const blueskyAnalyticsService = new BlueskyAnalyticsService();
