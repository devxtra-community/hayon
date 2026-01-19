// ============================================================================
// PRODUCER - USING DELAYED MESSAGE EXCHANGE PLUGIN
// ============================================================================
// File: src/lib/queues/producer.ts
// Purpose: Publish messages to RabbitMQ for social media posting
// ============================================================================

import { getChannel } from "../../config/rabbitmq";
import { PostQueueMessage, EXCHANGES } from "./types";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// PRODUCER CLASS
// ============================================================================

export class Producer {

  // ============================================================================
  // GENERIC PUBLISH (for immediate messages)
  // ============================================================================

  static async publish(
    exchange: string,
    routingKey: string,
    payload: object,
  ): Promise<void> {
    const channel = getChannel();
    await channel.assertExchange(exchange, "topic", { durable: true });

    const messageBuffer = Buffer.from(JSON.stringify(payload));
    const publishOptions = {
      persistent: true,
      contentType: "application/json",
    };

    channel.publish(exchange, routingKey, messageBuffer, publishOptions);
    console.log(`📤 Published to ${exchange}/${routingKey}`);
  }

  // ============================================================================
  // PUBLISH WITH DELAY (for scheduled messages)
  // Uses: rabbitmq_delayed_message_exchange plugin
  // ============================================================================

  static async publishDelayed(
    routingKey: string,
    payload: object,
    delayMs: number,
  ): Promise<void> {
    const channel = getChannel();

    // Assert the delayed exchange (x-delayed-message type)
    // This requires the rabbitmq_delayed_message_exchange plugin!
    await channel.assertExchange(EXCHANGES.POST_DELAYED_EXCHANGE, "x-delayed-message", {
      durable: true,
      arguments: {
        "x-delayed-type": "topic",  // Underlying routing type
      },
    });

    const messageBuffer = Buffer.from(JSON.stringify(payload));

    // The x-delay header tells the plugin how long to wait (in milliseconds)
    channel.publish(EXCHANGES.POST_DELAYED_EXCHANGE, routingKey, messageBuffer, {
      persistent: true,
      contentType: "application/json",
      headers: {
        "x-delay": delayMs,  // Plugin reads this header
      },
    });

    console.log(`⏰ Scheduled message to ${routingKey} with ${delayMs}ms delay`);
  }

  // ============================================================================
  // QUEUE SOCIAL POST
  // Main entry point for posting - handles both immediate and scheduled
  // ============================================================================

  static async queueSocialPost(
    data: Omit<PostQueueMessage, "timestamp" | "correlationId">,
  ): Promise<string> {
    const correlationId = uuidv4();
    const message: PostQueueMessage = {
      ...data,
      timestamp: new Date(),
      correlationId,
    };

    const routingKey = `post.create.${data.platform}`;

    // Calculate delay if scheduled
    let delay = 0;
    if (data.scheduledAt) {
      delay = new Date(data.scheduledAt).getTime() - Date.now();
      if (delay < 0) delay = 0;  // Past time = post immediately
    }

    if (delay > 0) {
      // ============================================================================
      // SCHEDULED POST: Use delayed exchange
      // ============================================================================
      // 
      // Message flow:
      // 1. Message published to POST_DELAYED_EXCHANGE with x-delay header
      // 2. Plugin holds message for specified duration
      // 3. After delay, plugin routes to bound queue (SOCIAL_POSTS)
      // 4. Worker picks up and processes
      //
      // Benefits over TTL approach:
      // - No head-of-line blocking (each message has independent delay)
      // - Cleaner code (no WAITING_ROOM queue needed)
      // - Better for high-volume scheduling
      //
      await this.publishDelayed(routingKey, message, delay);
      console.log(`📅 Post ${data.postId} scheduled for ${data.scheduledAt}`);
    } else {
      // ============================================================================
      // IMMEDIATE POST: Use regular exchange
      // ============================================================================
      await this.publish(EXCHANGES.POST_EXCHANGE, routingKey, message);
      console.log(`🚀 Post ${data.postId} queued for immediate processing`);
    }

    return correlationId;
  }
}

// ============================================================================
// HOW THE DELAYED EXCHANGE PLUGIN WORKS
// ============================================================================

/*
 * ARCHITECTURE:
 * 
 *   Producer                  Delayed Exchange              Queue
 *      │                           │                          │
 *      ├── publish(x-delay:5000)──▶│                          │
 *      │                           │                          │
 *      │                    [Plugin stores in                 │
 *      │                     internal Mnesia DB]              │
 *      │                           │                          │
 *      │                    [5 seconds pass...]               │
 *      │                           │                          │
 *      │                           ├── routes to ────────────▶│
 *      │                           │   bound queue            │
 *      │                           │                          │
 *                                                             ▼
 *                                                     Worker consumes
 * 
 * KEY DIFFERENCES FROM TTL:
 * 
 * TTL Approach:
 * - Message sits in WAITING_ROOM queue
 * - When TTL expires, dead-lettered to main exchange
 * - Problem: Messages processed in FIFO order (head-of-line blocking)
 * 
 * Plugin Approach:
 * - Plugin stores messages internally with timestamps
 * - Each message has independent delay
 * - No FIFO constraint - shorter delays process first
 * 
 * EXAMPLE:
 * 
 * TTL (broken):
 *   T0: Message A (delay: 1 hour) enters WAITING_ROOM
 *   T1: Message B (delay: 5 min) enters WAITING_ROOM
 *   Result: B waits behind A until A's TTL expires!
 * 
 * Plugin (correct):
 *   T0: Message A (delay: 1 hour) stored by plugin
 *   T1: Message B (delay: 5 min) stored by plugin
 *   T5: Message B released! (5 min passed)
 *   T60: Message A released (1 hour passed)
 */
