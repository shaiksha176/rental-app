import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT || 6379;

const client = createClient({
  url: `redis://${redisHost}:${redisPort}`,
});

client.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

client.on("connect", () => {
  console.log("✓ Connecting to Redis...");
});

client.on("ready", () => {
  console.log("✓ Redis Client Ready");
});

export default client;
