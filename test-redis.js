import redisClient from "./src/db/redis.js";
import * as cacheService from "./src/services/cacheService.js";

async function testRedis() {
  try {
    console.log("Connecting to Redis...");
    await redisClient.connect();
    console.log("Connected!");

    const testKey = "test-key";
    const testValue = { message: "Hello Redis", timestamp: new Date() };

    console.log(`Setting cache: ${testKey}`);
    await cacheService.set(testKey, testValue, 10);

    console.log(`Getting cache: ${testKey}`);
    const retrievedValue = await cacheService.get(testKey);
    console.log("Retrieved:", retrievedValue);

    if (JSON.stringify(testValue) === JSON.stringify(retrievedValue)) {
      console.log("✓ Redis test passed!");
    } else {
      console.log("✗ Redis test failed: values do not match");
    }

    console.log("Closing connection...");
    await redisClient.quit();
  } catch (error) {
    console.error("✗ Redis test error:", error.message);
    process.exit(1);
  }
}

testRedis();
