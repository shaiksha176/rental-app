import client from "../db/redis.js";

/**
 * Cache Service to handle common Redis operations
 */

export async function get(key) {
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Cache Get Error [${key}]:`, error.message);
    return null;
  }
}

export async function set(key, value, ttl = 3600) {
  try {
    const stringValue = JSON.stringify(value);
    await client.set(key, stringValue, {
      EX: ttl,
    });
    return true;
  } catch (error) {
    console.error(`Cache Set Error [${key}]:`, error.message);
    return false;
  }
}

export async function del(key) {
  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`Cache Delete Error [${key}]:`, error.message);
    return false;
  }
}

export async function clear() {
  try {
    await client.flushAll();
    return true;
  } catch (error) {
    console.error("Cache Clear Error:", error.message);
    return false;
  }
}

// Prefixes for keys
export const CACHE_PREFIX = {
  LISTING: "listing:",
  USER: "user:",
  SEARCH: "search:",
};
