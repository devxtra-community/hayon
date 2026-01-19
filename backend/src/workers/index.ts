// ============================================================================
// WORKER ENTRY POINT - DELAYED MESSAGE EXCHANGE PLUGIN SETUP
// ============================================================================
// File: src/workers/index.ts
// Purpose: Start worker process, setup queues and exchanges, consume messages
// ============================================================================

import "dotenv/config"; // Load environment variables
import { connectRabbitMQ, getChannel, closeRabbitMQ } from "../config/rabbitmq";
import { PostWorker } from "./post.worker";
import { QUEUES, EXCHANGES } from "../lib/queues/types";

// ============================================================================
// STARTUP FUNCTION
// ============================================================================

async function startWorker(): Promise<void> {
  console.log("🚀 Starting Worker Process...");

  try {
    // ========================================================================
    // STEP 1: Connect to RabbitMQ
    // ========================================================================
    await connectRabbitMQ();
    const channel = getChannel();

    // ========================================================================
    // STEP 2: Setup Exchanges
    // ========================================================================

    // Main exchange for IMMEDIATE posts (topic type)
    await channel.assertExchange(EXCHANGES.POST_EXCHANGE, "topic", { durable: true });
    console.log(`✅ Exchange ready: ${EXCHANGES.POST_EXCHANGE}`);

    // Delayed exchange for SCHEDULED posts (x-delayed-message type)
    // REQUIRES: rabbitmq_delayed_message_exchange plugin!
    try {
      await channel.assertExchange(EXCHANGES.POST_DELAYED_EXCHANGE, "x-delayed-message", {
        durable: true,
        arguments: {
          "x-delayed-type": "topic",  // Underlying routing type
        },
      });
      console.log(`✅ Delayed exchange ready: ${EXCHANGES.POST_DELAYED_EXCHANGE}`);
    } catch (error: any) {
      if (error.message?.includes("unknown exchange type")) {
        console.error("❌ ERROR: Delayed Message Exchange plugin not installed!");
        console.error("   Install: rabbitmq-plugins enable rabbitmq_delayed_message_exchange");
        process.exit(1);
      }
      throw error;
    }

    // Dead letter exchange for failed messages
    await channel.assertExchange(EXCHANGES.DLX_EXCHANGE, "direct", { durable: true });
    console.log(`✅ DLX exchange ready: ${EXCHANGES.DLX_EXCHANGE}`);

    // ========================================================================
    // STEP 3: Setup Queues
    // ========================================================================

    // Main processing queue - receives from both immediate and delayed exchanges
    await channel.assertQueue(QUEUES.SOCIAL_POSTS, {
      durable: true,
      deadLetterExchange: EXCHANGES.DLX_EXCHANGE,  // Failed messages go here
      deadLetterRoutingKey: "dead",
    });

    // Dead letter queue for inspection
    await channel.assertQueue(QUEUES.DEAD_LETTERS, { durable: true });

    // Retry queue with TTL → routes back to main exchange when expires
    await channel.assertQueue(QUEUES.RETRY_QUEUE, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": EXCHANGES.POST_EXCHANGE,
        // TTL is set per-message during retry
      },
    });

    // Parking lot for permanently failed messages
    await channel.assertQueue(QUEUES.PARKING_LOT, { durable: true });

    console.log(`✅ Queues ready: ${QUEUES.SOCIAL_POSTS}, ${QUEUES.DEAD_LETTERS}, ${QUEUES.RETRY_QUEUE}, ${QUEUES.PARKING_LOT}`);

    // ========================================================================
    // STEP 4: Bind Queues to Exchanges
    // ========================================================================

    // Main queue receives from POST_EXCHANGE (immediate posts)
    await channel.bindQueue(
      QUEUES.SOCIAL_POSTS,
      EXCHANGES.POST_EXCHANGE,
      "post.create.*",  // Matches post.create.bluesky, post.create.facebook, etc.
    );

    // Main queue ALSO receives from POST_DELAYED_EXCHANGE (scheduled posts)
    // When delay expires, plugin routes message here
    await channel.bindQueue(
      QUEUES.SOCIAL_POSTS,
      EXCHANGES.POST_DELAYED_EXCHANGE,
      "post.create.*",
    );

    // DLX bindings
    await channel.bindQueue(QUEUES.DEAD_LETTERS, EXCHANGES.DLX_EXCHANGE, "dead");
    await channel.bindQueue(QUEUES.RETRY_QUEUE, EXCHANGES.DLX_EXCHANGE, "retry");
    await channel.bindQueue(QUEUES.PARKING_LOT, EXCHANGES.DLX_EXCHANGE, "parking");

    console.log("✅ Queue bindings complete");

    // ========================================================================
    // STEP 5: Set Prefetch
    // ========================================================================

    // Process one message at a time per worker
    // Increase for higher throughput (e.g., 5-10)
    await channel.prefetch(1);

    // ========================================================================
    // STEP 6: Start Consuming Messages
    // ========================================================================

    console.log(`👂 Listening on queue: ${QUEUES.SOCIAL_POSTS}`);

    channel.consume(QUEUES.SOCIAL_POSTS, async (msg) => {
      if (msg) {
        await PostWorker.processMessage(msg, channel);
      }
    });

    // ========================================================================
    // STEP 7: Graceful Shutdown
    // ========================================================================

    process.on("SIGINT", async () => {
      console.log("🛑 Shutting down worker...");
      await closeRabbitMQ();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("🛑 Shutting down worker...");
      await closeRabbitMQ();
      process.exit(0);
    });

  } catch (error) {
    console.error("❌ Worker failed to start:", error);
    process.exit(1);
  }
}

// ============================================================================
// ARCHITECTURE DIAGRAM
// ============================================================================

/*
 * MESSAGE FLOW:
 * 
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │                        PRODUCER (Backend)                          │
 *   └───────────────────┬─────────────────────────┬───────────────────────┘
 *                       │                         │
 *               (immediate)               (scheduled)
 *                       │                         │
 *                       ▼                         ▼
 *   ┌─────────────────────────────┐   ┌─────────────────────────────────┐
 *   │       POST_EXCHANGE         │   │    POST_DELAYED_EXCHANGE        │
 *   │         (topic)             │   │     (x-delayed-message)         │
 *   └─────────────┬───────────────┘   └──────────────┬──────────────────┘
 *                 │                                  │
 *                 │                           [plugin waits]
 *                 │                           [delay expires]
 *                 │                                  │
 *                 └────────────────┬─────────────────┘
 *                                  │
 *                                  ▼
 *                    ┌───────────────────────────┐
 *                    │      SOCIAL_POSTS         │
 *                    │     (main queue)          │
 *                    └─────────────┬─────────────┘
 *                                  │
 *                                  ▼
 *                    ┌───────────────────────────┐
 *                    │         WORKER            │
 *                    │    processMessage()       │
 *                    └─────────────┬─────────────┘
 *                                  │
 *             ┌────────────────────┼────────────────────┐
 *             │                    │                    │
 *          success              failure             max retries
 *             │                    │                    │
 *             ▼                    ▼                    ▼
 *           ACK              RETRY_QUEUE           PARKING_LOT
 *                            (with TTL)           (dead forever)
 *                                  │
 *                            [TTL expires]
 *                                  │
 *                                  ▼
 *                           POST_EXCHANGE
 *                            (try again)
 */

// Start the worker
startWorker();
