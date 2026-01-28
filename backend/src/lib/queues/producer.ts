import { getChannel } from "../../config/rabbitmq";
import { PostQueueMessage, EXCHANGES } from "./types";
import { v4 as uuidv4 } from "uuid";

export class Producer {
  static async publish(exchange: string, routingKey: string, payload: object): Promise<void> {
    const channel = getChannel();
    // No longer hardcoding assertExchange here to allow different exchange types (Direct/Topic)
    // Exchanges are properly asserted in workers/index.ts during startup.

    const messageBuffer = Buffer.from(JSON.stringify(payload));
    const publishOptions = {
      persistent: true,
      contentType: "application/json",
    };

    channel.publish(exchange, routingKey, messageBuffer, publishOptions);
    console.log(`📤 Published to ${exchange}/${routingKey}`);
  }

  static async publishDelayed(routingKey: string, payload: object, delayMs: number): Promise<void> {
    const channel = getChannel();

    await channel.assertExchange(EXCHANGES.POST_DELAYED_EXCHANGE, "x-delayed-message", {
      durable: true,
      arguments: {
        "x-delayed-type": "topic",
      },
    });

    const messageBuffer = Buffer.from(JSON.stringify(payload));

    channel.publish(EXCHANGES.POST_DELAYED_EXCHANGE, routingKey, messageBuffer, {
      persistent: true,
      contentType: "application/json",
      headers: {
        "x-delay": delayMs,
      },
    });

    console.log(`⏰ Scheduled message to ${routingKey} with ${delayMs}ms delay`);
  }

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

    let delay = 0;
    if (data.scheduledAt) {
      delay = new Date(data.scheduledAt).getTime() - Date.now();
      if (delay < 0) delay = 0;
    }

    if (delay > 0) {
      await this.publishDelayed(routingKey, message, delay);
      console.log(`📅 Post ${data.postId} scheduled for ${data.scheduledAt}`);
    } else {
      await this.publish(EXCHANGES.POST_EXCHANGE, routingKey, message);
      console.log(`🚀 Post ${data.postId} queued for immediate processing`);
    }

    return correlationId;
  }
}
