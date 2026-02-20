// Topic Search Service
// Full-text search for global topics

import { createClient } from '@/lib/supabase/server'
import type { GlobalTopic } from '@/types'
import { DatabaseError } from '@/types'

export interface TopicSearchResult {
  id: string
  topic: string
  category: string
  current_volume: number
  trend_direction: 'up' | 'down' | 'stable'
  relevance?: number
}

export class TopicSearchService {
  /**
   * Search topics using full-text search
   */
  async searchTopics(
    query: string,
    limit: number = 20
  ): Promise<TopicSearchResult[]> {
    const supabase = await createClient()

    // Use the search_topics function from database
    const { data, error } = await supabase.rpc('search_topics', {
      search_query: query,
      result_limit: limit,
    })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as TopicSearchResult[]
  }

  /**
   * Get trending topics (gainers)
   */
  async getTrendingGainers(limit: number = 20): Promise<GlobalTopic[]> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_trending_gainers', {
      result_limit: limit,
    })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as GlobalTopic[]
  }

  /**
   * Get trending topics (losers)
   */
  async getTrendingLosers(limit: number = 20): Promise<GlobalTopic[]> {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_trending_losers', {
      result_limit: limit,
    })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as GlobalTopic[]
  }

  /**
   * Get topic by ID
   */
  async getTopicById(id: string): Promise<GlobalTopic | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('global_topics')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(error.message)
    }

    return data as GlobalTopic
  }

  /**
   * Get topics by category
   */
  async getTopicsByCategory(
    category: string,
    limit: number = 50
  ): Promise<GlobalTopic[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('global_topics')
      .select('*')
      .eq('category', category)
      .order('current_volume', { ascending: false })
      .limit(limit)

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as GlobalTopic[]
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('global_topics')
      .select('category')
      .order('category')

    if (error) {
      throw new DatabaseError(error.message)
    }

    // Extract unique categories
    const categories = Array.from(
      new Set(data.map((item: any) => item.category))
    )
    return categories as string[]
  }
}
