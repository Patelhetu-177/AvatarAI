// lib/redis.ts
import { Redis } from '@upstash/redis';

const CACHE_TTL = 60 * 60; // 1 hour in seconds

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function getCachedQuiz(cacheKey: string) {
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Redis] Cache hit for key: ${cacheKey}`);
      return JSON.parse(cached as string);
    }
    console.log(`[Redis] Cache miss for key: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error(`[Redis] Error getting cached data for key ${cacheKey}:`, error);
    return null;
  }
}

export async function cacheQuiz<T>(cacheKey: string, data: T, ttl: number = CACHE_TTL) {
  try {
    await redis.setex(cacheKey, ttl, JSON.stringify(data));
    console.log(`[Redis] Cached data for key: ${cacheKey} with TTL: ${ttl} seconds`);
  } catch (error) {
    console.error(`[Redis] Error caching data for key ${cacheKey}:`, error);
    throw error;
  }
}