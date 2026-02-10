import { Channel } from "amqplib";
import { getChannel } from "../../config/rabbitmq"; // Correct path to config
import { EXCHANGES, ROUTING_KEYS, AnalyticsFetchMessage } from "./types";
import { v4 as uuidv4 } from "uuid";
import logger from "../../utils/logger";

class AnalyticsProducer {
  private channel: Channel | null = null;

  private async getChannel(): Promise<Channel> {
    if (!this.channel) {
      this.channel = await getChannel();
    }
    return this.channel;
  }

  async sendMessage(
    data: Omit<AnalyticsFetchMessage, "timestamp" | "correlationId">,
  ): Promise<string> {
    const channel = await this.getChannel();
    const correlationId = uuidv4();

    const message: AnalyticsFetchMessage = {
      ...data,
      timestamp: new Date(),
      correlationId,
    };

    // Determine the correct routing key
    const routingKey =
      data.type === "post"
        ? ROUTING_KEYS.ANALYTICS_FETCH_POST
        : ROUTING_KEYS.ANALYTICS_FETCH_ACCOUNT;

    const success = channel.publish(
      EXCHANGES.ANALYTICS_EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
        messageId: correlationId,
        timestamp: Date.now(),
        type: "analytics_fetch",
      },
    );

    if (success) {
      logger.info(`[AnalyticsProducer] Sent '${data.type}' job to exchange`, {
        correlationId,
        type: data.type,
      });
      return correlationId;
    } else {
      logger.error("[AnalyticsProducer] Failed to publish message (buffer full)");
      throw new Error("Queue buffer full");
    }
  }
}

export const analyticsProducer = new AnalyticsProducer();
