// ============================================================================
// POST WORKER - ENHANCED WITH TODO COMMENTS
// ============================================================================
// File: src/workers/post.worker.ts
// Purpose: Process queue messages and post to social platforms
// ============================================================================

import { Channel, ConsumeMessage } from "amqplib";
import { PostQueueMessage } from "../lib/queues/types";
import { handleDeadLetter } from "../lib/queues/dlx.setup";
// TODO: Uncomment when implemented
// import { getPostingService, getCredentialsForPlatform, validateCredentials } from "../services/posting";
// import * as postRepository from "../repositories/post.repository";

// ============================================================================
// WORKER FLOW OVERVIEW
// ============================================================================

/*
 * Message arrives from queue → processMessage() handles it:
 * 
 * 1. PARSE MESSAGE
 *    - Extract postId, userId, platform, content
 * 
 * 2. CHECK IF CANCELLED (Edge Case!)
 *    - Fetch post from DB
 *    - If status === "CANCELLED", ACK and skip
 *    - Race condition: user cancelled while message was in queue
 * 
 * 3. VALIDATE CREDENTIALS
 *    - Check user's platform account is connected
 *    - Check token hasn't expired
 *    - If invalid → fail with reconnection message
 * 
 * 4. UPDATE STATUS TO "PROCESSING"
 *    - postRepository.updatePlatformStatus(postId, platform, { status: "processing" })
 * 
 * 5. GET POSTING SERVICE
 *    - const service = getPostingService(platform);
 *    - Factory returns correct platform implementation
 * 
 * 6. EXECUTE POST
 *    - const result = await service.execute(payload, credentials);
 * 
 * 7. UPDATE DB WITH RESULT
 *    - If success: status=completed, store platformPostId, platformPostUrl
 *    - If failed: status=failed, store error message
 * 
 * 8. HANDLE RABBITMQ ACK
 *    - Success or permanent failure → ACK
 *    - Retryable failure → DLX handling
 */

export class PostWorker {
  static async processMessage(msg: ConsumeMessage, channel: Channel): Promise<void> {
    const startTime = Date.now();

    try {
      const payload: PostQueueMessage = JSON.parse(msg.content.toString());
      console.log(`📥 Processing: ${payload.postId} for ${payload.platform}`);

      // ============================================================================
      // TODO: STEP 1 - Check if post was cancelled
      // ============================================================================

      /*
       * const post = await postRepository.findById(payload.postId);
       * if (!post) {
       *   console.log(`⚠️ Post ${payload.postId} not found, skipping`);
       *   channel.ack(msg);
       *   return;
       * }
       * 
       * if (post.status === "CANCELLED") {
       *   console.log(`⏭️ Post ${payload.postId} was cancelled, skipping`);
       *   channel.ack(msg);
       *   return;
       * }
       */

      // ============================================================================
      // TODO: STEP 2 - Validate credentials
      // ============================================================================

      /*
       * const credentialCheck = await validateCredentials(payload.userId, payload.platform);
       * if (!credentialCheck.valid) {
       *   console.log(`❌ Credentials invalid: ${credentialCheck.error}`);
       *   await postRepository.updatePlatformStatus(payload.postId, payload.platform, {
       *     status: "failed",
       *     error: credentialCheck.error,
       *     lastAttemptAt: new Date()
       *   });
       *   channel.ack(msg);  // Don't retry - user action needed
       *   return;
       * }
       */

      // ============================================================================
      // TODO: STEP 3 - Update status to processing
      // ============================================================================

      /*
       * await postRepository.updatePlatformStatus(payload.postId, payload.platform, {
       *   status: "processing",
       *   lastAttemptAt: new Date()
       * });
       */

      // ============================================================================
      // TODO: STEP 4 - Get credentials and posting service
      // ============================================================================

      /*
       * const credentials = await getCredentialsForPlatform(payload.userId, payload.platform);
       * const service = getPostingService(payload.platform);
       */

      // ============================================================================
      // TODO: STEP 5 - Execute the post
      // ============================================================================

      /*
       * const result = await service.execute(payload, credentials);
       * 
       * if (result.success) {
       *   await postRepository.updatePlatformStatus(payload.postId, payload.platform, {
       *     status: "completed",
       *     platformPostId: result.platformPostId,
       *     platformPostUrl: result.platformPostUrl,
       *     completedAt: new Date()
       *   });
       *   console.log(`✅ Posted to ${payload.platform}: ${result.platformPostUrl}`);
       * } else {
       *   // Check if retryable
       *   if (result.rateLimited) {
       *     // Rate limited - retry after delay
       *     throw new Error(`Rate limited, retry after ${result.retryAfter}s`);
       *   }
       *   
       *   await postRepository.updatePlatformStatus(payload.postId, payload.platform, {
       *     status: "failed",
       *     error: result.error,
       *     lastAttemptAt: new Date()
       *   });
       * }
       */

      // ============================================================================
      // ⚠️ TEST MODE - SIMPLE LOGGING ⚠️
      // Replace with actual implementation when ready
      // ============================================================================

      console.log("═══════════════════════════════════════════════════════════════");
      console.log("📨 MESSAGE RECEIVED FROM QUEUE");
      console.log("═══════════════════════════════════════════════════════════════");
      console.log(`   Post ID:        ${payload.postId}`);
      console.log(`   Platform:       ${payload.platform}`);
      console.log(`   User ID:        ${payload.userId}`);
      console.log(`   Content:        ${payload.content.text?.substring(0, 50)}...`);
      console.log(`   Correlation ID: ${payload.correlationId}`);
      console.log(`   Was Scheduled:  ${payload.scheduledAt ? "YES - " + payload.scheduledAt : "NO - Immediate"}`);
      console.log(`   Timestamp:      ${payload.timestamp}`);
      console.log("═══════════════════════════════════════════════════════════════");

      // Simulate platform posting (just log for now)
      switch (payload.platform) {
        case "bluesky":
          console.log("🦋 [TEST] Would post to Bluesky");
          break;
        case "instagram":
          console.log("📷 [TEST] Would post to Instagram");
          break;
        case "threads":
          console.log("🧵 [TEST] Would post to Threads");
          break;
        case "facebook":
          console.log("📘 [TEST] Would post to Facebook");
          break;
        case "mastodon":
          console.log("🐘 [TEST] Would post to Mastodon");
          break;
        case "tumblr":
          console.log("📓 [TEST] Would post to Tumblr");
          break;
        default:
          console.log(`❓ [TEST] Unknown platform: ${payload.platform}`);
      }

      console.log("✅ Message processed successfully!");
      console.log("═══════════════════════════════════════════════════════════════\n");

      channel.ack(msg);
      console.log(`✅ Completed: ${payload.postId} in ${Date.now() - startTime}ms`);
    } catch (error: any) {
      console.error(`❌ Failed to process message:`, error.message);

      // ============================================================================
      // TODO: STEP 6 - Handle failure with DLX
      // ============================================================================

      /*
       * Instead of simple NACK, use DLX for retry:
       * 
       * await handleDeadLetter({
       *   channel,
       *   originalMessage: msg.content,
       *   routingKey: msg.fields.routingKey,
       *   error,
       *   headers: msg.properties.headers
       * });
       * 
       * channel.ack(msg);  // ACK so RabbitMQ doesn't auto-requeue
       */

      // TEMP: Current implementation - message is lost! REPLACE with DLX
      channel.nack(msg, false, false);
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
 * 4. PARTIAL PLATFORM SUCCESS
 *    - User selected 3 platforms, 1 fails
 *    - Each platform message is independent
 *    - DB tracks per-platform status
 *    - Overall post status = "PARTIAL_SUCCESS"
 * 
 * 5. DUPLICATE MESSAGES (At-Least-Once Delivery)
 *    - RabbitMQ may redeliver if ACK times out
 *    - Check if platform already has status=completed
 *    - Idempotency key: postId + platform
 * 
 * 6. WORKER CRASH MID-PROCESSING
 *    - Message not ACKed → RabbitMQ redelivers
 *    - Check DB status before processing
 *    - If status=completed, skip duplicate
 * 
 * 7. LONG VIDEO PROCESSING (Instagram/Threads)
 *    - Video containers need time to process
 *    - Poll for ready status before publishing
 *    - Consider: worker timeout vs processing time
 */
