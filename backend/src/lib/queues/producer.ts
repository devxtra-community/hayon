import { getChannel } from "../../config/rabbitmq";
import { PostQueueMessage, EXCHANGES, QUEUES } from "./types";
import { v4 as uuidv4 } from "uuid";

export class Producer {
  static async publish(
    exchange: string,
    routingKey: string,
    payload: object,
    options?: { delay?: number },
  ): Promise<void> {
    const channel = getChannel();
    await channel.assertExchange(exchange, "topic", { durable: true });

    const messageBuffer = Buffer.from(JSON.stringify(payload));
    const publishOptions: any = {
      persistent: true,
      contentType: "application/json",
    };

    // 🛠️ Standard Delay: Using message expiration (TTL)
    if (options?.delay && options.delay > 0) {
      publishOptions.expiration = options.delay.toString();
      console.log(`⏳ Message will wait for ${options.delay}ms`);
    }

    channel.publish(exchange, routingKey, messageBuffer, publishOptions);
    console.log(`📤 Published to ${exchange}/${routingKey}`);
  }

  static async queueSocialPost(
    data: Omit<PostQueueMessage, "timestamp" | "correlationId">,
  ): Promise<string> {
    const correlationId = uuidv4();
    const message = { ...data, timestamp: new Date(), correlationId };

    let delay = 0;
    if (data.scheduledAt) {
      delay = new Date(data.scheduledAt).getTime() - Date.now();
      if (delay < 0) delay = 0;
    }

    if (delay > 0) {
      // 1. Setup the "Waiting Room" queue
      await (
        await getChannel()
      ).assertQueue(QUEUES.WAITING_ROOM, {
        durable: true,
        arguments: {
          // When message expires, send it to the main exchange
          "x-dead-letter-exchange": EXCHANGES.POST_EXCHANGE,
          "x-dead-letter-routing-key": `post.create.${data.platform}`,
        },
      });

      // 2. Publish directly to the waiting queue (Default exchange "")
      const buffer = Buffer.from(JSON.stringify(message));
      (await getChannel()).sendToQueue(QUEUES.WAITING_ROOM, buffer, {
        expiration: delay.toString(),
        persistent: true,
      });

      console.log(`🛌 Message moved to Waiting Room for ${delay}ms`);
    } else {
      // Post immediately
      await this.publish(EXCHANGES.POST_EXCHANGE, `post.create.${data.platform}`, message);
    }

    return correlationId;
  }
}
