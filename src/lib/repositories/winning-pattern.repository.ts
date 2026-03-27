import { createAdminClient } from '@/lib/supabase/admin'
import type { WinningPattern, WinningPatternInsert } from '@/types/autoresearch'

export class WinningPatternRepository {
  private get db() {
    return createAdminClient()
  }

  async findByProgram(programId: string): Promise<WinningPattern[]> {
    const { data, error } = await this.db
      .from('winning_patterns')
      .select('*')
      .eq('program_id', programId)
      .order('lift_percent', { ascending: false })
    if (error) throw new Error(`Failed to fetch patterns: ${error.message}`)
    return (data ?? []) as WinningPattern[]
  }

  async findByContext(params: {
    niche?: string
    persona?: string
    elementType?: string
    workspaceId?: string
  }): Promise<WinningPattern[]> {
    let query = this.db.from('winning_patterns').select('*')

    if (params.workspaceId) {
      query = query.eq('workspace_id', params.workspaceId)
    }
    if (params.niche) {
      query = query.eq('niche', params.niche)
    }
    if (params.persona) {
      query = query.eq('persona', params.persona)
    }
    if (params.elementType) {
      query = query.eq('element_type', params.elementType)
    }

    const { data, error } = await query.order('lift_percent', { ascending: false })
    if (error) throw new Error(`Failed to fetch patterns by context: ${error.message}`)
    return (data ?? []) as WinningPattern[]
  }

  async create(pattern: WinningPatternInsert): Promise<WinningPattern> {
    const { data, error } = await this.db
      .from('winning_patterns')
      .insert(pattern)
      .select('*')
      .single()
    if (error) throw new Error(`Failed to create pattern: ${error.message}`)
    return data as WinningPattern
  }

  async incrementReplication(id: string): Promise<WinningPattern> {
    const existing = await this.findById(id)
    if (!existing) throw new Error('Pattern not found')

    const { data, error } = await this.db
      .from('winning_patterns')
      .update({
        replication_count: existing.replication_count + 1,
        last_replicated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw new Error(`Failed to increment replication: ${error.message}`)
    return data as WinningPattern
  }

  async findTopPatterns(
    workspaceId: string,
    limit: number = 20
  ): Promise<WinningPattern[]> {
    const { data, error } = await this.db
      .from('winning_patterns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('replication_count', { ascending: false })
      .limit(limit)
    if (error) throw new Error(`Failed to fetch top patterns: ${error.message}`)
    return (data ?? []) as WinningPattern[]
  }

  private async findById(id: string): Promise<WinningPattern | null> {
    const { data, error } = await this.db
      .from('winning_patterns')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`Failed to fetch pattern: ${error.message}`)
    return data as WinningPattern | null
  }
}
