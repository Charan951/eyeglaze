import { Request, Response, NextFunction } from 'express';
import { redisClient, getRedisStatus } from '../config/redis';

interface CacheOptions {
  ttl?: number;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const ttl = options.ttl || 300; // default 5 minutes (300 seconds)

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check if Redis is connected
    if (!getRedisStatus()) {
      res.setHeader('X-Cache', 'BYPASS');
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        res.send(cachedData);
        return;
      }

      // Cache miss - intercept response
      res.setHeader('X-Cache', 'MISS');

      const originalJson = res.json;
      res.json = function (body: any): Response {
        // Restore the original json function immediately to avoid infinite recursion
        res.json = originalJson;

        // Cache the successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300 && getRedisStatus()) {
          redisClient.set(key, JSON.stringify(body), {
            EX: ttl,
          }).catch((err) => {
            console.error(`Error saving to Redis for key ${key}:`, err);
          });
        }

        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error(`Cache middleware error for key ${key}:`, error);
      // Fallback: proceed to the controller
      return next();
    }
  };
}

/**
 * Invalidate cached keys matching a specific pattern using scanIterator.
 * For example: 'cache:/api/products*'
 */
export async function clearCachePattern(pattern: string): Promise<void> {
  if (!getRedisStatus()) {
    return;
  }

  try {
    let deletedCount = 0;

    for await (const keys of redisClient.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      if (keys.length > 0) {
        await redisClient.del(keys);
        deletedCount += keys.length;
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleared ${deletedCount} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`Error clearing cache pattern ${pattern}:`, error);
  }
}
