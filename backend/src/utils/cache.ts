import redisClient from "../config/redis";
import logger from "./logger";

export const cacheAside = async <T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttlSeconds: number = 300,
): Promise<T> => {
  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const data = await fetchFunction();

    if (data) {
      redisClient.set(key, JSON.stringify(data), { EX: ttlSeconds }).catch((err) => {
        logger.error(`[Cache] Set Error for ${key}:`, err);
      });
    }

    return data;
  } catch (error) {
    logger.error(`[Cache] Error for ${key}:`, error);
    return await fetchFunction();
  }
};

export const invalidateCache = async (prefix: string): Promise<void> => {
  try {
    let cursor = 0;
    const pattern = `${prefix}*`;

    do {
      const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      const keys = reply.keys;

      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } while (cursor !== 0);
  } catch (error) {
    logger.error(`[Cache] Invalidate Error for ${prefix}:`, error);
  }
};

// export const getCacheStats = async () => {
//     try {
//         const info = await redisClient.info();
//         return info;
//     } catch (error) {
//         logger.error("[Cache] Error getting stats:", error);
//         return null;
//     }
// };
