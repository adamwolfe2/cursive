import { createAdminClient } from '@/lib/supabase/admin'
import type {
  AutoresearchResult,
  AutoresearchResultInsert,
} from '@/types/autoresearch'

export class AutoresearchResultRepository {
  private get db() {
    return createAdminClient()
  }

  async findByExperiment(experimentId: string): Promise<AutoresearchResult[]> {
    const { data, error } = await this.db
      .from('autoresearch_results')
      .select('*')
      .eq('experiment_id', experimentId)
    if (error) throw new Error(`Failed to fetch results: ${error.message}`)
    return (data ?? []) as AutoresearchResult[]
  }

  async findByVariant(
    experimentId: string,
    variantId: string
  ): Promise<AutoresearchResult | null> {
    const { data, error } = await this.db
      .from('autoresearch_results')
      .select('*')
      .eq('experiment_id', experimentId)
      .eq('variant_id', variantId)
      .maybeSingle()
    if (error) throw new Error(`Failed to fetch variant result: ${error.message}`)
    return data as AutoresearchResult | null
  }

  async upsert(result: AutoresearchResultInsert): Promise<AutoresearchResult> {
    const { data, error } = await this.db
      .from('autoresearch_results')
      .upsert(
        { ...result, snapshot_at: new Date().toISOString() },
        { onConflict: 'experiment_id,variant_id' }
      )
      .select('*')
      .single()
    if (error) throw new Error(`Failed to upsert result: ${error.message}`)
    return data as AutoresearchResult
  }

  async markFinal(experimentId: string): Promise<void> {
    const { error } = await this.db
      .from('autoresearch_results')
      .update({
        is_final: true,
        snapshot_at: new Date().toISOString(),
      })
      .eq('experiment_id', experimentId)
    if (error) throw new Error(`Failed to mark results as final: ${error.message}`)
  }
}
