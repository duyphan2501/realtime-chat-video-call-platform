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
  } catch (err) {
    console.error("Redis connection error:", err);
    process.exit(1);
  }
};

export { redisClient, pubClient, subClient, connectRedis };
