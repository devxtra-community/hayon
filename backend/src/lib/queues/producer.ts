// src/lib/queue/producer.ts
import { getChannel } from "../../config/rabbitmq";
import { PostQueueMessage, EXCHANGES, ROUTING_KEYS } from "./types";
import { v4 as uuidv4 } from "uuid";

export class Producer {
  /**
   * Publish a message to an exchange with a routing key
   */
  static async publish(
    exchange: string,
    routingKey: string,
    payload: object,
    options?: { delay?: number }, // delay in milliseconds for scheduled posts
  ): Promise<void> {
    const channel = getChannel();

    // Ensure the exchange exists
    await channel.assertExchange(exchange, "topic", { durable: true });

    const messageBuffer = Buffer.from(JSON.stringify(payload));

    const publishOptions: any = {
      persistent: true, // Message survives RabbitMQ restart
      contentType: "application/json",
    };

    // Add delay header for scheduled posts
    if (options?.delay) {
      publishOptions.headers = { "x-delay": options.delay };
    }

    channel.publish(exchange, routingKey, messageBuffer, publishOptions);

    console.log(`📤 Published to ${exchange}/${routingKey}`);
  }

  /**
   * Convenience method for posting to social media
   */
  static async queueSocialPost(
    data: Omit<PostQueueMessage, "timestamp" | "correlationId">,
  ): Promise<string> {
    const correlationId = uuidv4();

    const message: PostQueueMessage = {
      ...data,
      timestamp: new Date(),
      correlationId,
    };

    // Calculate delay if scheduled
    let delay: number | undefined;
    if (data.scheduledAt) {
      delay = new Date(data.scheduledAt).getTime() - Date.now();
      if (delay < 0) delay = 0; // Post immediately if time has passed
    }

    const exchange = delay ? EXCHANGES.POST_DELAYED_EXCHANGE : EXCHANGES.POST_EXCHANGE;

    await this.publish(exchange, ROUTING_KEYS.POST_CREATE, message, { delay });

    return correlationId;
  }
}
