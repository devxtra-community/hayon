import "dotenv/config"; // Load environment variables
import { connectRabbitMQ, getChannel, closeRabbitMQ } from "../config/rabbitmq";
import { PostWorker } from "./post.worker";
import { QUEUES, EXCHANGES } from "../lib/queues/types";

async function startWorker(): Promise<void> {
  console.log("🚀 Starting Worker Process...");

  try {
    // 1. Connect to RabbitMQ
    await connectRabbitMQ();
    const channel = getChannel();

    // 2. Setup exchanges and queues
    await channel.assertExchange(EXCHANGES.POST_EXCHANGE, "topic", { durable: true });
    await channel.assertQueue(QUEUES.SOCIAL_POSTS, {
      durable: true,
      deadLetterExchange: "dlx_exchange", // Failed messages go here
    });

    // 3. Bind queue to exchange with routing patternd
    await channel.bindQueue(
      QUEUES.SOCIAL_POSTS,
      EXCHANGES.POST_EXCHANGE,
      "post.create.*", // Matches post.create.bluesky, etc.
    );

    // 4. Set prefetch (process one message at a time)
    await channel.prefetch(1);

    // 5. Start consuming messages
    console.log(`👂 Listening on queue: ${QUEUES.SOCIAL_POSTS}`);

    channel.consume(QUEUES.SOCIAL_POSTS, async (msg) => {
      if (msg) {
        await PostWorker.processMessage(msg, channel);
      }
    });

    // 6. Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("🛑 Shutting down worker...");
      await closeRabbitMQ();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Worker failed to start:", error);
    process.exit(1);
  }
}

// Start the worker
startWorker();
