// Cache Strategies
// Reusable caching patterns for common data types

import {
  getCached,
  setCache,
  deleteCache,
  deleteCachePattern,
  buildCacheKey,
  CACHE_TTL,
  CACHE_PREFIX,
} from './client'
import { createClient } from '@/lib/supabase/server'

/**
 * Cache user data
 */
export async function getCachedUser(userId: string) {
  const key = buildCacheKey(CACHE_PREFIX.USER, userId)

  return getCached(
    key,
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      return data
    },
    CACHE_TTL.MEDIUM
  )
}

/**
 * Invalidate user cache
 */
export async function invalidateUserCache(userId: string) {
  const key = buildCacheKey(CACHE_PREFIX.USER, userId)
  await deleteCache(key)
}

/**
 * Cache workspace data
 */
export async function getCachedWorkspace(workspaceId: string) {
  const key = buildCacheKey(CACHE_PREFIX.WORKSPACE, workspaceId)

  return getCached(
    key,
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single()

      return data
    },
    CACHE_TTL.LONG
  )
}

/**
 * Invalidate workspace cache
 */
export async function invalidateWorkspaceCache(workspaceId: string) {
  const key = buildCacheKey(CACHE_PREFIX.WORKSPACE, workspaceId)
  await deleteCache(key)
}

/**
 * Cache query list
 */
export async function getCachedQueries(workspaceId: string) {
  const key = buildCacheKey(CACHE_PREFIX.QUERY, workspaceId, 'list')

  return getCached(
    key,
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('queries')
        .select('*, global_topics(topic, category)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      return data
    },
    CACHE_TTL.SHORT
  )
}

/**
 * Invalidate query cache for workspace
 */
export async function invalidateQueryCache(workspaceId: string) {
  const pattern = buildCacheKey(CACHE_PREFIX.QUERY, workspaceId, '*')
  await deleteCachePattern(pattern)
}

/**
 * Cache lead counts by status
 */
export async function getCachedLeadCounts(workspaceId: string) {
  const key = buildCacheKey(CACHE_PREFIX.LEAD, workspaceId, 'counts')

  return getCached(
    key,
    async () => {
      const supabase = await createClient()

      const [
        { count: total },
        { count: delivered },
        { count: pending },
      ] = await Promise.all([
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId),
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('delivery_status', 'delivered'),
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('delivery_status', 'pending'),
      ])

      return { total, delivered, pending }
    },
    CACHE_TTL.SHORT
  )
}

/**
 * Invalidate lead cache for workspace
 */
export async function invalidateLeadCache(workspaceId: string) {
  const pattern = buildCacheKey(CACHE_PREFIX.LEAD, workspaceId, '*')
  await deleteCachePattern(pattern)
}

/**
 * Cache global topics (for autocomplete)
 */
export async function getCachedTopics(searchQuery?: string) {
  const key = searchQuery
    ? buildCacheKey(CACHE_PREFIX.TOPIC, 'search', searchQuery)
    : buildCacheKey(CACHE_PREFIX.TOPIC, 'all')

  return getCached(
    key,
    async () => {
      const supabase = await createClient()
      let query = supabase
        .from('global_topics')
        .select('*')
        .order('current_volume', { ascending: false })
        .limit(100)

      if (searchQuery) {
        query = query.textSearch('topic', searchQuery, { type: 'websearch' })
      }

      const { data } = await query
      return data
    },
    CACHE_TTL.LONG
  )
}

/**
 * Cache trending topics
 */
export async function getCachedTrendingTopics() {
  const key = buildCacheKey(CACHE_PREFIX.TOPIC, 'trending')

  return getCached(
    key,
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('global_topics')
        .select('*')
        .in('trend_direction', ['up', 'stable'])
        .order('current_volume', { ascending: false })
        .limit(50)

      return data
    },
    CACHE_TTL.LONG
  )
}

/**
 * Cache credit status
 */
export async function getCachedCreditStatus(userId: string) {
  const key = buildCacheKey(CACHE_PREFIX.CREDIT, userId, 'status')

  return getCached(
    key,
    async () => {
      const supabase = await createClient()
      const { data: user } = await supabase
        .from('users')
        .select('daily_credits_used, plan, daily_credits_reset_at')
        .eq('id', userId)
        .single()

      if (!user) return null

      const limit = user.plan === 'pro' ? 1000 : 3
      const remaining = Math.max(0, limit - user.daily_credits_used)

      return {
        remaining,
        used: user.daily_credits_used,
        limit,
        resetAt: user.daily_credits_reset_at,
        plan: user.plan,
      }
    },
    CACHE_TTL.SHORT
  )
}

/**
 * Invalidate credit cache
 */
export async function invalidateCreditCache(userId: string) {
  const key = buildCacheKey(CACHE_PREFIX.CREDIT, userId, 'status')
  await deleteCache(key)
}

/**
 * Cache workspace analytics
 */
export async function getCachedAnalytics(workspaceId: string) {
  const key = buildCacheKey(CACHE_PREFIX.ANALYTICS, workspaceId, 'dashboard')

  return getCached(
    key,
    async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('workspace_analytics')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single()

      return data
    },
    CACHE_TTL.MEDIUM
  )
}

/**
 * Invalidate analytics cache
 */
export async function invalidateAnalyticsCache(workspaceId: string) {
  const pattern = buildCacheKey(CACHE_PREFIX.ANALYTICS, workspaceId, '*')
  await deleteCachePattern(pattern)
}

/**
 * Cache with stale-while-revalidate pattern
 */
export async function getCachedSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  return getCached(key, fetcher, ttl)
}
