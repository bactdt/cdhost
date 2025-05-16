import { Redis } from "@upstash/redis";

let redis;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.warn("Upstash Redis environment variables (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) are not set. Redis client will not be initialized.");
  // In a real application, you might want to throw an error or handle this case differently.
  // For local development without Upstash, you might use a mock or in-memory store.
  redis = null; 
}

export default redis;

