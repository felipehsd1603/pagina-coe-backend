import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

/**
 * Redis client for shared state across pods (token blacklist, etc.).
 * Falls back gracefully if Redis is unavailable — logs warning and operates in-memory.
 */
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 5) return null; // Stop retrying after 5 attempts
    return Math.min(times * 200, 2000);
  },
});

let redisAvailable = false;

redis.on('connect', () => {
  redisAvailable = true;
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  if (redisAvailable) {
    logger.warn({ err }, 'Redis connection lost — falling back to in-memory');
  }
  redisAvailable = false;
});

/**
 * Check if Redis is currently connected and usable.
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && redis.status === 'ready';
}

/**
 * Attempt to connect to Redis. Non-blocking — if it fails, the app
 * continues with in-memory fallback.
 */
export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
    redisAvailable = true;
  } catch {
    redisAvailable = false;
    logger.warn('Redis unavailable — using in-memory fallback for token blacklist');
  }
}
