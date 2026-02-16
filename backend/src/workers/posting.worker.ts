import { Channel, ConsumeMessage } from "amqplib";
import { PostQueueMessage } from "../lib/queues/types";
import { handleDeadLetter } from "../lib/queues/dlx.setup";
import {
  getPostingService,
  getCredentialsForPlatform,
  validateCredentials,
} from "../services/posting";
import { findById, updatePlatformStatus } from "../repositories/post.repository";
import { NotificationService } from "../services/notification.service";

const isRetryableError = (error: any): boolean => {
  if (!error) return false;

  // Explicit retry signals
  if (error.rateLimited) return true;
  if (error.retryAfter) return true;

  // Network / temporary errors
  if (
    error.message?.includes("timeout") ||
    error.message?.includes("ECONNRESET") ||
    error.message?.includes("ENOTFOUND")
  ) {
    return true;
  }

  return false;
};

export class PostWorker {
  static async processMessage(msg: ConsumeMessage, channel: Channel): Promise<void> {
    const startTime = Date.now();

    const payload: PostQueueMessage = JSON.parse(msg.content.toString());
    try {
      console.log(`📥 Processing: ${payload.postId} for ${payload.platform}`);

      // 1. Check if post was cancelled

      const post = await findById(payload.postId);
      if (!post) {
        console.log(`⚠️ Post ${payload.postId} not found, skipping`);
        channel.ack(msg);
        return;
      }

      if (post.status === "CANCELLED") {
        console.log(`⏭️ Post ${payload.postId} was cancelled, skipping`);
        channel.ack(msg);
        return;
      }
      const platformStatus = post.platformStatuses.find(
        (p: any) => p.platform === payload.platform,
      );

      if (platformStatus?.status === "completed") {
        console.log(
          `🔁 Duplicate message detected for ${payload.postId} / ${payload.platform}, skipping`,
        );
        channel.ack(msg);
        return;
      }
      const credentialCheck = await validateCredentials(payload.userId, payload.platform);

      if (!credentialCheck.valid) {
        console.log(`❌ Credentials invalid: ${credentialCheck.error}`);

        await updatePlatformStatus(payload.postId, payload.platform, {
          status: "failed",
          error: credentialCheck.error,
          lastAttemptAt: new Date(),
        });

        // Permanent failure → do NOT retry
        channel.ack(msg);
        return;
      }

      await updatePlatformStatus(payload.postId, payload.platform, {
        status: "processing",
        lastAttemptAt: new Date(),
      });
      console.log("changed to processing");

      const credentials = await getCredentialsForPlatform(payload.userId, payload.platform);
      const service = getPostingService(payload.platform);

      const result = await service.execute(payload, credentials);

      if (result.success) {
        await updatePlatformStatus(payload.postId, payload.platform, {
          status: "completed",
          platformPostId: result.platformPostId,
          platformPostUrl: result.platformPostUrl,
          completedAt: new Date(),
        });

        channel.ack(msg);
        console.log(
          `✅ [ACK] Finished: ${payload.postId} for ${payload.platform} in ${Date.now() - startTime}ms`,
        );

        await NotificationService.createNotification(
          payload.userId,
          `Your post has been successfully posted on ${payload.platform}`,
          "success",
          {
            type: "post",
            id: payload.postId,
            model: "Post",
          },
        );

        return;
      } else {
        if (result.rateLimited) {
          throw new Error(`Rate limited, retry after ${result.retryAfter}s`);
        }

        await updatePlatformStatus(payload.postId, payload.platform, {
          status: "failed",
          error: result.error,
          lastAttemptAt: new Date(),
        });

        // Permanent failure - ACK so it leaves the queue
        channel.ack(msg);
        console.log(
          `🪦 [ACK] Permanent failure for ${payload.postId} / ${payload.platform}: ${result.error}`,
        );
        return;
      }
    } catch (error: any) {
      console.error(`❌ Failed to process message:`, error.message);

      // Fetch post again to get latest attemptCount
      const post = await findById(payload.postId);

      const platformStatus = post?.platformStatuses.find(
        (p: any) => p.platform === payload.platform,
      );

      const attempts = platformStatus?.attemptCount ?? 0;

      const shouldRetry = attempts < 3 && isRetryableError(error);

      if (shouldRetry) {
        console.log(
          `🔁 Retrying ${payload.postId} / ${payload.platform} (attempt ${attempts + 1})`,
        );

        await handleDeadLetter({
          channel,
          originalMessage: msg.content,
          routingKey: msg.fields.routingKey,
          error,
          headers: msg.properties.headers,
        });

        channel.ack(msg);
        return;
      }

      // Permanent failure
      console.log(`🪦 Permanent failure for ${payload.postId} / ${payload.platform}`);

      await updatePlatformStatus(payload.postId, payload.platform, {
        status: "failed",
        error: error.message,
        lastAttemptAt: new Date(),
      });

      channel.ack(msg);
    }
  }
}

// ============================================================================
// EDGE CASES TO HANDLE
// ============================================================================

/*
 * 1. CONCURRENT POSTS TO SAME PLATFORM
 *    - User posts rapidly → potential rate limit
 *    - Consider: global rate limit tracker per platform
 *    - Solution: Add delay between posts or use rate limit headers
 *
 * 2. SESSION REFRESH DURING POSTING
 *    - Token expires mid-execution
 *    - For Bluesky: catch 401, call refreshSession, retry once
 *    - Update stored tokens after refresh
 *
 * 3. S3 MEDIA URL EXPIRED
 *    - If using signed URLs, they may expire
 *    - Generate fresh URLs before posting
 *    - Or use public bucket with long-lived URLs
 *
 

//  * [==========={ compleated }============]

//  * 4. PARTIAL PLATFORM SUCCESS
//  *    - User selected 3 platforms, 1 fails
//  *    - Each platform message is independent
//  *    - DB tracks per-platform status
//  *    - Overall post status = "PARTIAL_SUCCESS"


//  * 5. DUPLICATE MESSAGES (At-Least-Once Delivery)
//  *    - RabbitMQ may redeliver if ACK times out
//  *    - Check if platform already has status=completed
//  *    - Idempotency key: postId + platform


//  * 6. WORKER CRASH MID-PROCESSING
//  *    - Message not ACKed → RabbitMQ redelivers
//  *    - Check DB status before processing
//  *    - If status=completed, skip duplicate


* 7. LONG VIDEO PROCESSING (Instagram/Threads)
 *    - Video containers need time to process
 *    - Poll for ready status before publishing
 *    - Consider: worker timeout vs processing time
 */
