// Cache Client
// Redis-compatible caching using Vercel KV

import { kv } from '@vercel/kv'
import { logger } from '@/lib/logging/logger'

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,          // 1 hour
  DAY: 86400,          // 24 hours
  WEEK: 604800,        // 7 days
}

/**
 * Cache key prefixes for namespacing
 */
export const CACHE_PREFIX = {
  USER: 'user',
  WORKSPACE: 'workspace',
  QUERY: 'query',
  LEAD: 'lead',
  TOPIC: 'topic',
  CREDIT: 'credit',
  ANALYTICS: 'analytics',
  RATE_LIMIT: 'ratelimit',
}

/**
 * Build cache key with prefix
 */
export function buildCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`
}

/**
 * Get cached value with fallback
 */
export async function getCached<T>(
  key: string,
  fallback: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  try {
    // Try to get from cache
    const cached = await kv.get<T>(key)

    if (cached !== null) {
      logger.debug({ key, hit: true }, 'Cache hit')
      return cached
    }

    logger.debug({ key, hit: false }, 'Cache miss')

    // Cache miss - execute fallback
    const value = await fallback()

    // Store in cache (fire and forget)
    kv.setex(key, ttl, value).catch(err => {
      logger.warn({ key, error: err }, 'Failed to set cache')
    })

    return value
  } catch (error) {
    logger.error({ key, error }, 'Cache error, using fallback')
    // On error, bypass cache and use fallback
    return fallback()
  }
}

/**
 * Set cache value
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<void> {
  try {
    await kv.setex(key, ttl, value)
    logger.debug({ key, ttl }, 'Cache set')
  } catch (error) {
    logger.warn({ key, error }, 'Failed to set cache')
  }
}

/**
 * Delete cache value
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await kv.del(key)
    logger.debug({ key }, 'Cache deleted')
  } catch (error) {
    logger.warn({ key, error }, 'Failed to delete cache')
  }
}

/**
 * Delete multiple cache values by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    // Get all keys matching pattern
    const keys = await kv.keys(pattern)

    if (keys.length === 0) return

    // Delete all matching keys
    await kv.del(...keys)

    logger.debug({ pattern, count: keys.length }, 'Cache pattern deleted')
  } catch (error) {
    logger.warn({ pattern, error }, 'Failed to delete cache pattern')
  }
}

/**
 * Increment cache value (for counters)
 */
export async function incrementCache(key: string, amount: number = 1): Promise<number> {
  try {
    const value = await kv.incrby(key, amount)
    return value
  } catch (error) {
    logger.warn({ key, error }, 'Failed to increment cache')
    return 0
  }
}

/**
 * Check if cache is available
 */
export async function isCacheAvailable(): Promise<boolean> {
  try {
    await kv.ping()
    return true
  } catch (error) {
    logger.warn('Cache not available')
    return false
  }
}

/**
 * Cache decorator for functions
 */
export function cached<T extends any[], R>(
  keyBuilder: (...args: T) => string,
  ttl: number = CACHE_TTL.MEDIUM
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: T): Promise<R> {
      const cacheKey = keyBuilder(...args)

      return getCached(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttl
      )
    }

    return descriptor
  }
}
