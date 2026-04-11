import { createClient } from "redis";
import ENV from "../utils/env.util.js";

const redisUrl = `redis://${ENV.REDIS_HOST}:${ENV.REDIS_PORT}`;

const redisClient = createClient({
  url: redisUrl,
  password: ENV.REDIS_PASSWORD,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();

const connectRedis = async () => {
  try {
    await Promise.all([
      redisClient.connect(),
      pubClient.connect(),
      subClient.connect(),
    ]);
    console.log("Redis connected and ready for Adapter");
    await clearRedisOnStart();
  } catch (err) {
    console.error("Redis connection error:", err);
    process.exit(1);
  }
};

const clearRedisOnStart = async () => {
  try {
    // Luôn đảm bảo các key đơn lẻ là string
    await redisClient.del("online_users");
    await redisClient.del("active_calls");

    const patterns = ["online_user:*", "is_reconnecting:*"];

    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);
      
      if (keys && keys.length > 0) {
        await redisClient.del(keys); 
      }
    }

    console.log("Redis cleanup completed successfully.");
  } catch (err) {
    console.error("Redis cleanup error:", err);
  }
};
export { redisClient, pubClient, subClient, connectRedis };
