import client from "../db/redis.js";

/**
 * Cache Service: Provides high-level helpers for Redis operations.
 * Concepts:
 * - JSON Serialization: Automatically handles stringify/parse for objects.
 * - Fail-Soft: Returns null/false on Redis errors instead of crashing the app.
 * - TTL: Time-To-Live ensures data eventually expires even if invalidation fails.
 */


export async function get(key) {
  try {
    const data = await client.get(key);
    // Concept: Read-Aside - Parse JSON back to object if found
    return data ? JSON.parse(data) : null;
  } catch (error) {
    // Concept: Fail-Soft - Log error but don't break the request flow
    console.error(`Cache Get Error [${key}]:`, error.message);
    return null;
  }
}

export async function set(key, value, ttl = 3600) {
  try {
    // Concept: Serialization - Objects must be stringified for Redis
    const stringValue = JSON.stringify(value);
    await client.set(key, stringValue, {
      EX: ttl, // Concept: TTL (Time-To-Live) for safety
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

// Concept: Namespacing - Use prefixes to avoid key collisions in Redis
export const CACHE_PREFIX = {
  LISTING: "listing:",
  USER: "user:",
  SEARCH: "search:",
};
