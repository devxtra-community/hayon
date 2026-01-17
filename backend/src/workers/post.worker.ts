// src/workers/implementations/post.worker.ts
import { Channel, ConsumeMessage } from "amqplib";
import { PostQueueMessage } from "../lib/queues/types";
import { createPostServiceBluesky } from "../services/platforms/bluesky.service";

export class PostWorker {
  static async processMessage(msg: ConsumeMessage, channel: Channel): Promise<void> {
    const startTime = Date.now();

    try {
      const payload: PostQueueMessage = JSON.parse(msg.content.toString());
      console.log(`📥 Processing: ${payload.postId} for ${payload.platform}`);

      //   let platformPostId: string | undefined;

      switch (payload.platform) {
        case "bluesky":
          await createPostServiceBluesky();
          break;

        default:
          throw new Error(`Unknown platform: ${payload.platform}`);
      }

      // DB update commented out for testing ✓

      channel.ack(msg);
      console.log(`✅ Completed: ${payload.postId} in ${Date.now() - startTime}ms`);
    } catch (error: any) {
      console.error(`❌ Failed to process message:`, error.message);
      channel.nack(msg, false, false);
    }
  }
}
