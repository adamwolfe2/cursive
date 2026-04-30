import { createAdminClient } from '@/lib/supabase/admin'
import type {
  AutoresearchExperiment,
  AutoresearchExperimentInsert,
  AutoresearchExperimentUpdate,
  ExperimentStatus,
} from '@/types/autoresearch'

export class AutoresearchExperimentRepository {
  private get db() {
    return createAdminClient()
  }

  async findByProgram(programId: string): Promise<AutoresearchExperiment[]> {
    const { data, error } = await this.db
      .from('autoresearch_experiments')
      .select('*')
      .eq('program_id', programId)
      .order('experiment_number', { ascending: false })
    if (error) throw new Error(`Failed to fetch experiments: ${error.message}`)
    return (data ?? []) as AutoresearchExperiment[]
  }

  async findById(id: string): Promise<AutoresearchExperiment | null> {
    const { data, error } = await this.db
      .from('autoresearch_experiments')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`Failed to fetch experiment: ${error.message}`)
    return data as AutoresearchExperiment | null
  }

  async findActive(programId: string): Promise<AutoresearchExperiment[]> {
    const { data, error } = await this.db
      .from('autoresearch_experiments')
      .select('*')
      .eq('program_id', programId)
      .in('status', ['active', 'waiting', 'evaluating'])
    if (error) throw new Error(`Failed to fetch active experiments: ${error.message}`)
    return (data ?? []) as AutoresearchExperiment[]
  }

  async findReadyForEvaluation(): Promise<AutoresearchExperiment[]> {
    const { data, error } = await this.db
      .from('autoresearch_experiments')
      .select('*')
      .eq('status', 'waiting')
      .lte('evaluation_at', new Date().toISOString())
    if (error) throw new Error(`Failed to fetch experiments ready for evaluation: ${error.message}`)
    return (data ?? []) as AutoresearchExperiment[]
  }

  async create(experiment: AutoresearchExperimentInsert): Promise<AutoresearchExperiment> {
    const { data, error } = await this.db
      .from('autoresearch_experiments')
      .insert(experiment)
      .select('*')
      .single()
    if (error) throw new Error(`Failed to create experiment: ${error.message}`)
    return data as AutoresearchExperiment
  }

  async updateStatus(
    id: string,
    status: ExperimentStatus,
    updates?: AutoresearchExperimentUpdate
  ): Promise<AutoresearchExperiment> {
    const { data, error } = await this.db
      .from('autoresearch_experiments')
      .update({
        ...updates,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw new Error(`Failed to update experiment status: ${error.message}`)
    return data as AutoresearchExperiment
  }

  async getNextExperimentNumber(programId: string): Promise<number> {
    const { data, error } = await this.db
      .from('autoresearch_experiments')
      .select('experiment_number')
      .eq('program_id', programId)
      .order('experiment_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(`Failed to get next experiment number: ${error.message}`)
    return data ? data.experiment_number + 1 : 1
  }
}
