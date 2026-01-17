// src/config/rabbitmq.ts
import amqp, { Connection, Channel } from "amqplib";
import { ENV } from "./env";

let connection: Connection | any;
let channel: Channel;

export const connectRabbitMQ = async (): Promise<{ connection: Connection; channel: Channel }> => {
  try {
    // Connect to RabbitMQ using URL from environment variables
    connection = await amqp.connect(ENV.RABBITMQ.URL || "amqp://localhost");
    channel = await connection.createChannel();

    console.log("✅ Connected to RabbitMQ");

    // Handle connection errors
    connection.on("error", (err: Error) => {
      if (err instanceof Error) {
        console.error("RabbitMQ connection error:", err);
      }
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
    });

    return { connection, channel };
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
    throw error;
  }
};

// Getter for the channel (used by producer/consumer)
export const getChannel = (): Channel => {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized. Call connectRabbitMQ() first.");
  }
  return channel;
};

// Graceful shutdown
export const closeRabbitMQ = async (): Promise<void> => {
  if (channel) await channel.close();
  if (connection) await connection.close();
};
