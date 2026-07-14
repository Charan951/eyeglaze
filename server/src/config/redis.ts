import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries >= 3) {
        return false; // stop reconnecting
      }
      return Math.min(retries * 500, 2000);
    }
  }
});

let isRedisConnected = false;

redisClient.on('connect', () => {
  console.log('Redis client connecting...');
});

redisClient.on('ready', () => {
  isRedisConnected = true;
  console.log('Connected to Redis Cache successfully.');
});

redisClient.on('error', (err: any) => {
  isRedisConnected = false;
  console.warn('Redis Cache Error/Offline:', err?.message || err);
});

redisClient.on('end', () => {
  isRedisConnected = false;
  console.log('Redis connection closed.');
});

export async function connectRedis() {
  try {
    await redisClient.connect();
  } catch (err: any) {
    isRedisConnected = false;
    console.warn('Could not establish initial connection with Redis. Fallback to MongoDB.');
  }
}

export function getRedisStatus() {
  return isRedisConnected;
}
