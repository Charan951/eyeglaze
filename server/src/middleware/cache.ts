import { Request, Response, NextFunction } from 'express';
import { redisClient, getRedisStatus } from '../config/redis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 3600)
  keyPrefix?: string; // Prefix for cache keys
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  const ttl = options.ttl || 3600;
  const prefix = options.keyPrefix || 'cache';

  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    if (!getRedisStatus()) {
      return next();
    }

    // Generate unique cache key based on route path and query parameters
    const cacheKey = `${prefix}:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        return res.send(cachedData);
      }

      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);

      res.json = (body: any): any => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setEx(cacheKey, ttl, JSON.stringify(body))
            .catch((err) => console.error('Redis setEx error:', err));
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Scan and clear all keys matching a specific pattern (e.g. 'cache:/api/products*')
 */
export async function clearCachePattern(pattern: string) {
  if (!getRedisStatus()) return;

  try {
    let cursor = 0;
    do {
      const reply = await redisClient.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });
      cursor = reply.cursor;
      const keys = reply.keys;
      if (keys && keys.length > 0) {
        await redisClient.del(keys);
      }
    } while (cursor !== 0);
    console.log(`Cache cleared for pattern: ${pattern}`);
  } catch (error) {
    console.error(`Failed to clear cache for pattern: ${pattern}`, error);
  }
}
