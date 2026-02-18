import { createClient } from "redis";
import { ENV } from "./env";
import logger from "../utils/logger";

const redisClient = createClient({
  url: `redis://${ENV.REDIS.HOST}:${ENV.REDIS.PORT}`,
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));
redisClient.on("connect", () => logger.info("Redis Client Connected"));

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    logger.error("Failed to connect to Redis", err);
  }
};

export default redisClient;
