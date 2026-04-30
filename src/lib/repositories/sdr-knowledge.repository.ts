import { createAdminClient } from '@/lib/supabase/admin'
import type {
  SdrKnowledgeEntry,
  SdrKnowledgeInsert,
  SdrKnowledgeUpdate,
  KnowledgeCategory,
} from '@/types/sdr'

export class SdrKnowledgeRepository {
  private get db() {
    return createAdminClient()
  }

  async findByWorkspace(workspaceId: string): Promise<SdrKnowledgeEntry[]> {
    const { data, error } = await this.db
      .from('sdr_knowledge_base')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('priority', { ascending: false })
    if (error) throw new Error(`Failed to fetch knowledge base: ${error.message}`)
    return (data ?? []) as SdrKnowledgeEntry[]
  }

  async findByCategory(
    workspaceId: string,
    category: KnowledgeCategory
  ): Promise<SdrKnowledgeEntry[]> {
    const { data, error } = await this.db
      .from('sdr_knowledge_base')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('category', category)
      .eq('is_active', true)
      .order('priority', { ascending: false })
    if (error) throw new Error(`Failed to fetch knowledge by category: ${error.message}`)
    return (data ?? []) as SdrKnowledgeEntry[]
  }

  async findByKeywords(
    workspaceId: string,
    keywords: string[]
  ): Promise<SdrKnowledgeEntry[]> {
    const { data, error } = await this.db
      .from('sdr_knowledge_base')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .overlaps('keywords', keywords)
      .order('priority', { ascending: false })
      .limit(10)
    if (error) throw new Error(`Failed to search knowledge base: ${error.message}`)
    return (data ?? []) as SdrKnowledgeEntry[]
  }

  async findById(id: string, workspaceId: string): Promise<SdrKnowledgeEntry | null> {
    const { data, error } = await this.db
      .from('sdr_knowledge_base')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()
    if (error) throw new Error(`Failed to fetch knowledge entry: ${error.message}`)
    return data as SdrKnowledgeEntry | null
  }

  async create(entry: SdrKnowledgeInsert): Promise<SdrKnowledgeEntry> {
    const { data, error } = await this.db
      .from('sdr_knowledge_base')
      .insert(entry)
      .select('*')
      .single()
    if (error) throw new Error(`Failed to create knowledge entry: ${error.message}`)
    return data as SdrKnowledgeEntry
  }

  async update(
    id: string,
    workspaceId: string,
    updates: SdrKnowledgeUpdate
  ): Promise<SdrKnowledgeEntry> {
    const { data, error } = await this.db
      .from('sdr_knowledge_base')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .single()
    if (error) throw new Error(`Failed to update knowledge entry: ${error.message}`)
    return data as SdrKnowledgeEntry
  }

  async delete(id: string, workspaceId: string): Promise<void> {
    const { error } = await this.db
      .from('sdr_knowledge_base')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)
    if (error) throw new Error(`Failed to delete knowledge entry: ${error.message}`)
  }

  async incrementUsage(id: string, workspaceId: string, wasSuccessful: boolean): Promise<void> {
    const entry = await this.findById(id, workspaceId)
    if (!entry) throw new Error(`Knowledge entry not found: ${id}`)

    const newUsageCount = entry.usage_count + 1
    const newSuccessCount = wasSuccessful ? entry.success_count + 1 : entry.success_count
    const newSuccessRate = newUsageCount > 0
      ? Math.round((newSuccessCount / newUsageCount) * 100 * 100) / 100
      : 0

    const { error } = await this.db
      .from('sdr_knowledge_base')
      .update({
        usage_count: newUsageCount,
        success_count: newSuccessCount,
        success_rate: newSuccessRate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
    if (error) throw new Error(`Failed to update usage count: ${error.message}`)
  }

  async getStats(workspaceId: string): Promise<{
    totalEntries: number
    byCategory: Record<string, number>
    avgSuccessRate: number
  }> {
    const entries = await this.findByWorkspace(workspaceId)
    const byCategory = entries.reduce<Record<string, number>>((acc, e) => {
      return { ...acc, [e.category]: (acc[e.category] || 0) + 1 }
    }, {})
    const avgSuccessRate = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.success_rate, 0) / entries.length
      : 0
    return { totalEntries: entries.length, byCategory, avgSuccessRate }
  }
}
