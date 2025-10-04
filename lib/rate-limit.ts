import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit;

const rateLimitCache = new Map<string, {
  success: boolean;
  remaining: number;
  reset: number;
  timestamp: number;
}>();

const CACHE_TTL = 5000;

function getRateLimiter() {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: false,
      prefix: 'gemini-ratelimit',
      timeout: 500,
    });
  }
  return ratelimit;
}

export async function rateLimit(identifier: string) {
  const now = Date.now();
  
  const cached = rateLimitCache.get(identifier);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return {
      success: cached.success,
      remaining: cached.remaining,
      reset: cached.reset,
      cached: true,
    };
  }

  const rateLimiter = getRateLimiter();
  
  try {
    const startTime = now;
    const result = await rateLimiter.limit(identifier);
    const latency = Date.now() - startTime;
    
    if (latency > 300) console.warn(`Rate limit check took ${latency}ms`);
    
    rateLimitCache.set(identifier, {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      timestamp: now
    });
    
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.reset ? Math.ceil((result.reset - now) / 1000) : 0,
      cached: false,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    return {
      success: true,
      remaining: 1,
      reset: 0,
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
