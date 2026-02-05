import { Channel, ConsumeMessage } from "amqplib";
import { AnalyticsFetchMessage } from "../lib/queues/types";
import logger from "../utils/logger";
import SocialAccount from "../models/socialAccount.model";
import PostModel from "../models/post.model";
import AnalyticsSnapshotModel from "../models/analyticsSnapshot.model";
import AccountSnapshotModel from "../models/accountSnapshot.model";

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
    const post = await PostModel.findById(msg.postId);
    if (!post) throw new Error(`Post not found: ${msg.postId}`);

    // 2. Fetch Account Credentials
    const account = await SocialAccount.findOne({ userId: post.userId });
    if (!account) throw new Error(`Social account not found for user: ${post.userId}`);

    // TODO: Implement actual API calls to platforms here
    // For now, we simulate data fetching

    logger.info(`[AnalyticsWorker] Fetching ${msg.platform} metrics for post ${msg.postId}`);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 3. Save Snapshot (Mock Data for Phase 2)
    await AnalyticsSnapshotModel.create({
      postId: post._id,
      userId: post.userId,
      platform: msg.platform,
      snapshotAt: new Date(),
      metrics: {
        likes: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 20),
        comments: Math.floor(Math.random() * 10),
      },
      derived: {
        totalEngagement: 0, // Should be calculated
        engagementRate: 0,
        virality: 0,
      },
      followerCountAtSnapshot: 1000, // Mock
    });

    // 4. Update Post's lastAnalyticsFetch flag
    await PostModel.updateOne(
      { _id: post._id, "platformStatuses.platform": msg.platform },
      { $set: { "platformStatuses.$.lastAnalyticsFetch": new Date() } },
    );
  }

  /**
   * Handle fetching metrics for an account (followers)
   */
  private static async processAccountAnalytics(msg: AnalyticsFetchMessage): Promise<void> {
    if (!msg.userId) throw new Error("Missing userId for account analytics");

    const platforms = msg.platforms || [];
    logger.info(`[AnalyticsWorker] Fetching account metrics for user ${msg.userId}`, { platforms });

    // TODO: Implement actual API calls

    for (const platform of platforms) {
      // Mock Data Save
      await AccountSnapshotModel.create({
        userId: msg.userId,
        platform: platform,
        snapshotAt: new Date(),
        metrics: {
          followers: Math.floor(Math.random() * 5000),
          totalPosts: Math.floor(Math.random() * 500),
        },
      });
    }
  }
}
