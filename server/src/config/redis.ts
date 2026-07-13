import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: redisUrl,
});

let isRedisConnected = false;

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
  isRedisConnected = false;
});

redisClient.on('connect', () => {
  isRedisConnected = true;
  console.log('Connected to Redis Cache successfully.');
});

redisClient.on('end', () => {
  isRedisConnected = false;
  console.log('Redis connection closed.');
});

export async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('Could not connect to Redis, caching will be bypassed:', error);
    isRedisConnected = false;
  }
}

export function getRedisStatus(): boolean {
  return isRedisConnected && redisClient.isOpen;
}
