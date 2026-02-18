import { Channel, ConsumeMessage } from "amqplib";
import { AnalyticsFetchMessage } from "../lib/queues/types";
import logger from "../utils/logger";
import * as PostRepository from "../repositories/post.repository";
import * as SocialAccountRepository from "../repositories/socialAccount.repository";
import * as AnalyticsRepository from "../repositories/analytics.repository";
import { getAnalyticsService } from "../services/analytics";
import { AnalyticsErrorType, SocialMediaAnalyticsError } from "../services/analytics/errors";
import { invalidateCache } from "../utils/cache";

export class AnalyticsWorker {
  /**
   * Process incoming analytics messages
   */
  static async processMessage(msg: ConsumeMessage, channel: Channel): Promise<void> {
    const content = JSON.parse(msg.content.toString()) as AnalyticsFetchMessage;
    const { type, correlationId } = content;

    logger.info(`[AnalyticsWorker] Processing '${type}' job`, { correlationId });

    try {
      if (type === "post") {
        await this.processPostAnalytics(content);
      } else if (type === "account") {
        await this.processAccountAnalytics(content);
      }

      // Acknowledge functionality
      channel.ack(msg);
      logger.info(`[AnalyticsWorker] Completed '${type}' job`, { correlationId });
    } catch (error: any) {
      logger.error(`[AnalyticsWorker] Failed to process message`, {
        error: error.message,
        correlationId,
      });

      // Simple NACK: Requeue if transient, or DLX if persistent error
      // For now, we NACK without requeue (to DLX) to avoid infinite loops
      channel.nack(msg, false, false);
    }
  }

  /**
   * Handle fetching metrics for a single post
   */
  private static async processPostAnalytics(msg: AnalyticsFetchMessage): Promise<void> {
    if (!msg.postId || !msg.platform) {
      throw new Error("Missing postId or platform for post analytics");
    }

    // 1. Fetch Post
    const post = await PostRepository.findById(msg.postId);
    if (!post) throw new Error(`Post not found: ${msg.postId}`);

    // 2. Find the platform status to get platformPostId
    const platformStatus = post.platformStatuses.find(
      (ps) => ps.platform === msg.platform && ps.status === "completed",
    );

    if (!platformStatus?.platformPostId) {
      throw new Error(
        `No completed platformPostId found for ${msg.platform} on post ${msg.postId}`,
      );
    }

    // 3. Fetch Account Credentials
    const account = await SocialAccountRepository.findByUserId(post.userId.toString());
    if (!account) throw new Error(`Social account not found for user: ${post.userId}`);

    // 4. Get platform credentials
    const platformData = account[msg.platform as keyof typeof account] as any;
    if (!platformData?.connected) {
      throw new Error(`Platform ${msg.platform} not connected for user ${post.userId}`);
    }

    // 5. Get analytics service for this platform
    const analyticsService = getAnalyticsService(msg.platform);

    let metrics = { likes: 0, shares: 0, comments: 0, impressions: 0, reach: 0, saved: 0 };
    let followerCount = 0;

    if (analyticsService) {
      // Real API call
      logger.info(`[AnalyticsWorker] Fetching ${msg.platform} metrics for post ${msg.postId}`);

      try {
        // Fetch Post Metrics
        const fetchedMetrics = await analyticsService.getPostMetrics(
          platformStatus.platformPostId,
          platformData,
          post.userId.toString(),
        );
        logger.info(`[AnalyticsWorker] Received metrics for ${msg.platform}:`, fetchedMetrics);

        metrics = {
          ...metrics,
          ...fetchedMetrics,
          impressions: fetchedMetrics.impressions ?? 0,
          reach: fetchedMetrics.reach ?? 0,
          saved: fetchedMetrics.saved ?? 0,
        };

        // Fetch Account Metrics (Always fetch to ensure followers are updated)
        try {
          const accountMetrics = await analyticsService.getAccountMetrics(
            platformData,
            post.userId.toString(),
          );
          logger.info(
            `[AnalyticsWorker] Received account metrics for ${msg.platform}:`,
            accountMetrics,
          );
          followerCount = accountMetrics.followers;
        } catch (accError: any) {
          logger.error(`[AnalyticsWorker] Account metrics fetch failed for ${msg.platform}:`, {
            error: accError.message,
          });
          // Non-critical failure, continue with post metrics
        }
      } catch (error: any) {
        if (error instanceof SocialMediaAnalyticsError) {
          if (error.type === AnalyticsErrorType.DELETED) {
            logger.warn(`[AnalyticsWorker] Post deleted on ${msg.platform}, marking as deleted`, {
              postId: msg.postId,
              platformPostId: platformStatus.platformPostId,
            });

            // Mark this platform status as deleted
            await PostRepository.updatePlatformStatus(msg.postId, msg.platform as any, {
              status: "deleted",
            });
            return; // Stop processing this post
          }

          if (error.type === AnalyticsErrorType.UNAUTHORIZED) {
            logger.error(`[AnalyticsWorker] Authorization failed for ${msg.platform}`, {
              userId: post.userId,
              error: error.message,
            });

            // Update social account health via repository
            await SocialAccountRepository.updateHealthStatus(
              post.userId.toString(),
              msg.platform as any,
              "expired",
              error.message,
            );
            return; // Stop processing this post
          }
        }

        logger.error(`[AnalyticsWorker] Failed to fetch analytics for ${msg.platform}:`, {
          error: error.message,
        });
        // Continue to save snapshot with zero/partial metrics for other errors
      }
    } else {
      // Platform not yet implemented (Facebook, Instagram, Threads)
      logger.info(`[AnalyticsWorker] Analytics not implemented for ${msg.platform}, skipping`);
      return;
    }

    const totalEngagement = metrics.likes + metrics.shares + metrics.comments;

    // 6. Save Snapshot
    await AnalyticsRepository.createPostSnapshot({
      postId: post._id,
      userId: post.userId,
      platform: msg.platform,
      snapshotAt: new Date(),
      metrics: {
        likes: metrics.likes,
        shares: metrics.shares,
        comments: metrics.comments,
        impressions: metrics.impressions,
        reach: metrics.reach,
        saved: metrics.saved,
      },
      derived: {
        totalEngagement,
        engagementRate: followerCount > 0 ? totalEngagement / followerCount : 0,
        // Virality only calculated when shares are available (> 0)
        // Platforms without shares support will have virality = 0
        virality: metrics.shares > 0 && totalEngagement > 0 ? metrics.shares / totalEngagement : 0,
      },
      followerCountAtSnapshot: followerCount,
    });

    // Invalidate caches related to post stats
    await Promise.all([
      invalidateCache(`analytics:overview:${post.userId}`),
      invalidateCache(`analytics:timeline:${post.userId}`),
      invalidateCache(`analytics:platforms:${post.userId}`),
      invalidateCache(`analytics:top-posts:${post.userId}`),
      invalidateCache(`analytics:growth:${post.userId}`),
      invalidateCache(`analytics:heatmap:${post.userId}`),
    ]);

    // 7. Update Post's lastAnalyticsFetch flag
    await PostRepository.updatePost(post._id.toString(), post.userId.toString(), {
      platformStatuses: post.platformStatuses.map((ps) => {
        if (ps.platform === msg.platform) {
          ps.lastAnalyticsFetch = new Date();
        }
        return ps;
      }) as any,
    });

    logger.info(`[AnalyticsWorker] Saved snapshot and invalidated cache for ${msg.platform}`, {
      postId: msg.postId,
      likes: metrics.likes,
      shares: metrics.shares,
      comments: metrics.comments,
      impressions: metrics.impressions,
    });
  }

  /**
   * Handle fetching metrics for an account (followers)
   */
  private static async processAccountAnalytics(msg: AnalyticsFetchMessage): Promise<void> {
    if (!msg.userId) throw new Error("Missing userId for account analytics");

    const platforms = msg.platforms || [];
    logger.info(`[AnalyticsWorker] Fetching account metrics for user ${msg.userId}`, { platforms });

    const account = await SocialAccountRepository.findByUserId(msg.userId);
    if (!account) {
      throw new Error(`Social account not found for user: ${msg.userId}`);
    }

    let hasUpdates = false;

    for (const platform of platforms) {
      const analyticsService = getAnalyticsService(platform);

      if (!analyticsService) {
        logger.info(`[AnalyticsWorker] Analytics not implemented for ${platform}, skipping`);
        continue;
      }

      const platformData = account[platform as keyof typeof account] as any;
      if (!platformData?.connected) {
        logger.warn(`[AnalyticsWorker] Platform ${platform} not connected, skipping`);
        continue;
      }

      try {
        const metrics = await analyticsService.getAccountMetrics(platformData, msg.userId);

        await AnalyticsRepository.createAccountSnapshot({
          userId: msg.userId,
          platform: platform,
          snapshotAt: new Date(),
          metrics: {
            followers: metrics.followers,
            totalPosts: metrics.totalPosts,
          },
        });

        hasUpdates = true;

        logger.info(`[AnalyticsWorker] Saved account snapshot for ${platform}`, {
          userId: msg.userId,
          followers: metrics.followers,
        });
      } catch (error: any) {
        if (
          error instanceof SocialMediaAnalyticsError &&
          error.type === AnalyticsErrorType.UNAUTHORIZED
        ) {
          logger.error(`[AnalyticsWorker] Authorization failed for ${platform} account metrics`, {
            userId: msg.userId,
            error: error.message,
          });

          await SocialAccountRepository.updateHealthStatus(
            msg.userId,
            platform as any,
            "expired",
            error.message,
          );
        } else {
          logger.error(`[AnalyticsWorker] Failed to fetch ${platform} account metrics`, {
            error: error.response?.data || error.message,
            userId: msg.userId,
          });
        }
        // Continue with other platforms
      }
    }

    if (hasUpdates) {
      // Invalidate follower growth cache
      await Promise.all([
        invalidateCache(`analytics:followers:${msg.userId}`),
        invalidateCache(`analytics:growth:${msg.userId}`),
        invalidateCache(`analytics:heatmap:${msg.userId}`),
        invalidateCache(`analytics:top-posts:${msg.userId}`),
      ]);
      logger.info(`[AnalyticsWorker] Invalidated account caches for User ${msg.userId}`);
    }
  }
}
