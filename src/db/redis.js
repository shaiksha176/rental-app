import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

/**
 * Shared Redis configuration for both Cache and Queues.
 */
export const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
};

/**
 * Redis Client for Caching
 */
const client = createClient({
  url: `redis://${redisConfig.host}:${redisConfig.port}`,
});

client.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

client.on("connect", () => {
  console.log("✓ Connecting to Redis (Cache)...");
});

export default client;
