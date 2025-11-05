import { Redis } from '@upstash/redis';

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

class RedisService {
  private static instance: Redis;
  private static isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Redis {
    if (!RedisService.instance) {
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error('Upstash Redis environment variables are not defined');
      }
      
      RedisService.instance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      if (process.env.NODE_ENV === 'development') {
        global.redis = RedisService.instance;
      }
      
      RedisService.isConnected = true;
      console.log('Connected to Upstash Redis');
    }
    
    return RedisService.instance;
  }

  public static async set<T = unknown>(
    key: string, 
    value: T, 
    ttlInSeconds?: number
  ): Promise<void> {
    const redis = RedisService.getInstance();
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttlInSeconds) {
      await redis.set(key, stringValue, { ex: ttlInSeconds });
    } else {
      await redis.set(key, stringValue);
    }
  }

  public static async get<T = unknown>(key: string): Promise<T | null> {
    const redis = RedisService.getInstance();
    const value = await redis.get(key);
    
    if (value === null || value === undefined) return null;
    
    try {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as unknown as T;
        }
      }
      return value as T;
    } catch (error) {
      console.error('Error parsing cached value:', error);
      return null;
    }
  }

  public static async delete(key: string): Promise<number> {
    const redis = RedisService.getInstance();
    const result = await redis.del(key);
    return result;
  }

  public static async clearByPattern(pattern: string): Promise<number> {
    const redis = RedisService.getInstance();
    
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) return 0;
    
    const BATCH_SIZE = 100;
    let deletedCount = 0;
    
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      const count = await redis.del(...batch);
      deletedCount += count;
    }
    
    return deletedCount;
  }

  public static async isHealthy(): Promise<boolean> {
    try {
      await RedisService.instance.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

export default RedisService;
