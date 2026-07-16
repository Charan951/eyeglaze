import { Request, Response, NextFunction } from 'express';

interface CacheOptions {
  ttl?: number;
}

interface CachedResponse {
  body: string;
  contentType: string;
  expiresAt: number;
}

// In-memory cache map
const cacheMap = new Map<string, CachedResponse>();

export function cacheMiddleware(options: CacheOptions = {}) {
  const ttl = options.ttl || 300; // default 5 minutes (300 seconds)

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cached = cacheMap.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', cached.contentType || 'application/json');
        res.send(cached.body);
        return;
      }

      // Cache miss - intercept response
      res.setHeader('X-Cache', 'MISS');

      const originalJson = res.json;
      res.json = function (body: any): Response {
        // Restore the original json function immediately to avoid infinite recursion
        res.json = originalJson;

        // Cache the successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheMap.set(key, {
            body: JSON.stringify(body),
            contentType: res.getHeader('Content-Type') as string || 'application/json',
            expiresAt: Date.now() + ttl * 1000,
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
 * Invalidate cached keys matching a specific pattern.
 * For example: 'cache:/api/products*'
 */
export async function clearCachePattern(pattern: string): Promise<void> {
  try {
    // Escape regex characters except '*' which we translate to '.*'
    const escapedPattern = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const regexPattern = escapedPattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);

    let deletedCount = 0;

    for (const key of cacheMap.keys()) {
      if (regex.test(key)) {
        cacheMap.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleared ${deletedCount} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`Error clearing cache pattern ${pattern}:`, error);
  }
}

