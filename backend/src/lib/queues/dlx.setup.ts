import { Channel } from "amqplib";
import { EXCHANGES } from "./types";

// ============================================================================
// DLX CONFIGURATION
// ============================================================================

export const DLX = {
  MAX_RETRIES: 3, // Max retry attempts
  RETRY_DELAYS: [5000, 30000, 120000], // 5s, 30s, 2min (exponential backoff)
} as const;

// ============================================================================
// WHAT IS DLX USED FOR NOW?
// ============================================================================

/*
 * With the Delayed Message Exchange Plugin handling scheduling,
 * DLX is now ONLY used for FAILED MESSAGE HANDLING:
 *
 *   [Worker fails] ──▶ [DLX Exchange] ──┬──▶ [Retry Queue] ──(TTL)──▶ [Main Queue]
 *                                       │
 *                                       └──▶ [Parking Lot] (max retries exceeded)
 *
 * The retry queue still uses TTL (message expiration) because:
 * - We want exponential backoff between retries
 * - TTL works fine for short delays (5s, 30s, 2min)
 * - Head-of-line blocking is acceptable for retries
 */

// ============================================================================
// HANDLE FAILED MESSAGE
// ============================================================================

interface DeadLetterOptions {
  channel: Channel;
  originalMessage: Buffer;
  routingKey: string;
  error: Error;
  headers?: Record<string, any>;
}

/*
 * Called by worker when a message fails processing.
 * Decides whether to retry or park the message.
 */

export async function handleDeadLetter(options: DeadLetterOptions): Promise<void> {
  const { channel, originalMessage, routingKey, error, headers = {} } = options;

  const retryCount = (headers["x-retry-count"] || 0) + 1;

  if (retryCount <= DLX.MAX_RETRIES) {
    // Calculate delay (exponential backoff)
    const delay = DLX.RETRY_DELAYS[retryCount - 1] || DLX.RETRY_DELAYS[DLX.RETRY_DELAYS.length - 1];

    // Publish to retry queue with TTL
    // When TTL expires, message routes to POST_EXCHANGE (via dead-letter config)
    channel.publish(EXCHANGES.DLX_EXCHANGE, "retry", originalMessage, {
      persistent: true,
      expiration: delay.toString(),
      headers: {
        ...headers,
        "x-retry-count": retryCount,
        "x-original-routing-key": routingKey,
        "x-last-error": error.message,
        "x-last-attempt": new Date().toISOString(),
      },
    });

    console.log(`🔄 Message queued for retry #${retryCount} in ${delay}ms`);
  } else {
    // Max retries exceeded - park the message
    channel.publish(EXCHANGES.DLX_EXCHANGE, "parking", originalMessage, {
      persistent: true,
      headers: {
        ...headers,
        "x-retry-count": retryCount,
        "x-original-routing-key": routingKey,
        "x-last-error": error.message,
        "x-parked-at": new Date().toISOString(),
      },
    });

    console.log(`🅿️ Message parked after ${retryCount} failed attempts`);
  }
}

// ============================================================================
// USAGE IN WORKER
// ============================================================================

/*
 * In post.worker.ts:
 *
 * } catch (error: any) {
 *   await handleDeadLetter({
 *     channel,
 *     originalMessage: msg.content,
 *     routingKey: msg.fields.routingKey,
 *     error,
 *     headers: msg.properties.headers
 *   });
 *   channel.ack(msg);  // ACK so RabbitMQ doesn't auto-requeue
 * }
 */

// ============================================================================
// DLX vs DELAYED PLUGIN - CLARIFICATION
// ============================================================================

/*
 * SCHEDULING (Delayed Message Exchange Plugin):
 * - Used for: Scheduled posts (user picks a future time)
 * - Delay: Minutes to days
 * - Plugin stores messages until scheduled time
 * - No head-of-line blocking
 *
 * RETRY (DLX + TTL):
 * - Used for: Failed message retries
 * - Delay: Seconds to minutes (5s, 30s, 2min)
 * - TTL on RETRY_QUEUE triggers dead-letter to main exchange
 * - Head-of-line blocking acceptable for short delays
 *
 * They work together but serve different purposes!
 */
