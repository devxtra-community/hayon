import cron from "node-cron";
import logger from "../../utils/logger";
import SocialAccountModel from "../../models/socialAccount.model";
import * as postRepository from "../../repositories/post.repository";
import { analyticsProducer } from "../../lib/queues/analytics.producer";

export class AnalyticsCronService {
  static init() {
    logger.info("📅 Initializing Analytics Cron Service...");

    // 1. Post Analytics Job - Run every 2 hours to support smart fetching
    cron.schedule("0 */2 * * *", async () => {
      await this.schedulePostAnalyticsTasks();
    });

    // 2. Account Analytics Job - Run once a day at 12:00 AM
    cron.schedule("0 0 * * *", async () => {
      await this.scheduleAccountAnalyticsTasks();
    });

    logger.info("✅ Analytics Cron Jobs scheduled successfully.");
  }

  /**
   * Identifies posts needing analytics updates and queues tasks
   * Implements "Smart Fetching" logic:
   * - Fresh posts (< 24h): Every 2 hours
   * - Recent posts (1-7 days): Every 12 hours
   * - Old posts (> 7 days): Every 24 hours
   */
  private static async schedulePostAnalyticsTasks() {
    logger.info("🔄 Checking for posts needing analytics updates...");

    try {
      // Use Repository instead of direct Model access
      const posts = await postRepository.findPostsNeedingAnalyticsUpdate();

      if (posts.length === 0) {
        logger.info("[AnalyticsCron] No posts require analytics updates at this time.");
        return;
      }

      logger.info(`[AnalyticsCron] Found ${posts.length} posts needing updates. Queueing tasks...`);

      for (const post of posts) {
        for (const status of post.platformStatuses) {
          if (status.status === "completed") {
            // Check if this specific platform needs update based on its own lastAnalyticsFetch
            const needsUpdate = this.checkSpecificPlatformNeedsUpdate(
              post.createdAt,
              status.lastAnalyticsFetch,
            );

            if (needsUpdate) {
              await analyticsProducer.sendMessage({
                type: "post",
                postId: (post._id as any).toString(),
                platform: status.platform as any,
              });
            }
          }
        }
      }
    } catch (error) {
      logger.error("[AnalyticsCron] Error in schedulePostAnalyticsTasks", error);
    }
  }

  /**
   * Helper to check if a specific platform status within a post needs an update
   */
  private static checkSpecificPlatformNeedsUpdate(
    postCreatedAt: Date | undefined,
    lastFetch?: Date,
  ): boolean {
    if (!lastFetch) return true;
    if (!postCreatedAt) return false; // Safety check

    const now = new Date();
    const diffMs = now.getTime() - lastFetch.getTime();
    const ageMs = now.getTime() - postCreatedAt.getTime();

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const SEVEN_DAYS = 7 * ONE_DAY;

    // Fresh (< 24h): 2h interval
    if (ageMs < ONE_DAY) {
      return diffMs >= 2 * 60 * 60 * 1000;
    }
    // Recent (1-7d): 12h interval
    if (ageMs < SEVEN_DAYS) {
      return diffMs >= 12 * 60 * 60 * 1000;
    }
    // Old (> 7d): 24h interval
    return diffMs >= ONE_DAY;
  }

  /**
   * Schedules account-level metrics fetch (followers) for all connected accounts
   */
  private static async scheduleAccountAnalyticsTasks() {
    logger.info("🔄 Checking for accounts needing follower updates...");

    try {
      const accounts = await SocialAccountModel.find({});

      for (const account of accounts) {
        // Collect platforms where at least one sub-platform is connected
        const platforms: string[] = [];

        if (account.facebook?.connected) platforms.push("facebook");
        if (account.instagram?.connected) platforms.push("instagram");
        if (account.threads?.connected) platforms.push("threads");
        if (account.bluesky?.connected) platforms.push("bluesky");
        if (account.mastodon?.connected) platforms.push("mastodon");
        if (account.tumblr?.connected) platforms.push("tumblr");

        if (platforms.length > 0) {
          await analyticsProducer.sendMessage({
            type: "account",
            userId: (account.userId as any).toString(),
            platforms: platforms as any[],
          });
        }
      }

      logger.info(`[AnalyticsCron] Queued follower updates for ${accounts.length} users.`);
    } catch (error) {
      logger.error("[AnalyticsCron] Error in scheduleAccountAnalyticsTasks", error);
    }
  }
}
