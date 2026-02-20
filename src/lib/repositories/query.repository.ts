// Query Repository
// Database access layer for queries using repository pattern

import { createClient } from '@/lib/supabase/server'
import type { Query, QueryInsert, QueryUpdate } from '@/types'
import { DatabaseError } from '@/types'

export class QueryRepository {
  /**
   * Find all queries for a workspace
   */
  async findByWorkspace(workspaceId: string): Promise<Query[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('queries')
      .select('*, global_topics(id, topic, category)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as unknown as Query[]
  }

  /**
   * Find a single query by ID
   */
  async findById(id: string, workspaceId: string): Promise<Query | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('queries')
      .select('*, global_topics(id, topic, category)')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(error.message)
    }

    return data as unknown as Query
  }

  /**
   * Create a new query
   */
  async create(query: QueryInsert): Promise<Query> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('queries')
      .insert(query)
      .select('*, global_topics(id, topic, category)')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as unknown as Query
  }

  /**
   * Update a query
   */
  async update(
    id: string,
    workspaceId: string,
    query: QueryUpdate
  ): Promise<Query> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('queries')
      .update(query)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*, global_topics(id, topic, category)')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as unknown as Query
  }

  /**
   * Delete a query
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('queries')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * Count active queries for a workspace
   */
  async countActiveByWorkspace(workspaceId: string): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('queries')
      .select('*', { count: 'estimated', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')

    if (error) {
      throw new DatabaseError(error.message)
    }

    return count || 0
  }

  /**
   * Update query status
   */
  async updateStatus(
    id: string,
    workspaceId: string,
    status: 'active' | 'paused' | 'completed'
  ): Promise<Query> {
    return this.update(id, workspaceId, { status })
  }
}
