import { createAdminClient } from '@/lib/supabase/admin'
import type {
  AutoresearchProgram,
  AutoresearchProgramInsert,
  AutoresearchProgramUpdate,
} from '@/types/autoresearch'

export class AutoresearchProgramRepository {
  private get db() {
    return createAdminClient()
  }

  async findByWorkspace(workspaceId: string): Promise<AutoresearchProgram[]> {
    const { data, error } = await this.db
      .from('autoresearch_programs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(`Failed to fetch programs: ${error.message}`)
    return (data ?? []) as AutoresearchProgram[]
  }

  async findById(id: string, workspaceId: string): Promise<AutoresearchProgram | null> {
    const { data, error } = await this.db
      .from('autoresearch_programs')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()
    if (error) throw new Error(`Failed to fetch program: ${error.message}`)
    return data as AutoresearchProgram | null
  }

  async findActive(workspaceId: string): Promise<AutoresearchProgram[]> {
    const { data, error } = await this.db
      .from('autoresearch_programs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
    if (error) throw new Error(`Failed to fetch active programs: ${error.message}`)
    return (data ?? []) as AutoresearchProgram[]
  }

  async findAllActive(): Promise<AutoresearchProgram[]> {
    const { data, error } = await this.db
      .from('autoresearch_programs')
      .select('*')
      .eq('status', 'active')
    if (error) throw new Error(`Failed to fetch all active programs: ${error.message}`)
    return (data ?? []) as AutoresearchProgram[]
  }

  async create(program: AutoresearchProgramInsert): Promise<AutoresearchProgram> {
    const { data, error } = await this.db
      .from('autoresearch_programs')
      .insert(program)
      .select('*')
      .single()
    if (error) throw new Error(`Failed to create program: ${error.message}`)
    return data as AutoresearchProgram
  }

  async update(
    id: string,
    workspaceId: string,
    updates: AutoresearchProgramUpdate
  ): Promise<AutoresearchProgram> {
    const { data, error } = await this.db
      .from('autoresearch_programs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .single()
    if (error) throw new Error(`Failed to update program: ${error.message}`)
    return data as AutoresearchProgram
  }

  async updateBaseline(
    id: string,
    workspaceId: string,
    baseline: {
      subject: string
      body: string
      positiveReplyRate: number
    }
  ): Promise<AutoresearchProgram> {
    return this.update(id, workspaceId, {
      baseline_subject: baseline.subject,
      baseline_body: baseline.body,
      baseline_positive_reply_rate: baseline.positiveReplyRate,
      baseline_updated_at: new Date().toISOString(),
    })
  }

  async incrementExperimentCount(
    id: string,
    workspaceId: string,
    won: boolean
  ): Promise<void> {
    const program = await this.findById(id, workspaceId)
    if (!program) throw new Error('Program not found')
    await this.update(id, workspaceId, {
      total_experiments_run: program.total_experiments_run + 1,
      total_wins: won ? program.total_wins + 1 : program.total_wins,
    })
  }
}
