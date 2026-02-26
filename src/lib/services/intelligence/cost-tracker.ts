import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export interface CostEntry {
  workspace_id: string
  lead_id?: string
  tier: 'auto' | 'intel' | 'deep_research' | 'nl_query'
  provider: string
  credits_charged?: number
  api_cost_usd?: number
  status?: 'pending' | 'completed' | 'failed' | 'rate_limited'
  metadata?: Record<string, unknown>
}

export async function trackCost(entry: CostEntry): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('enrichment_costs').insert({
      workspace_id: entry.workspace_id,
      lead_id: entry.lead_id ?? null,
      tier: entry.tier,
      provider: entry.provider,
      credits_charged: entry.credits_charged ?? 0,
      api_cost_usd: entry.api_cost_usd ?? 0,
      status: entry.status ?? 'completed',
      metadata: entry.metadata ?? {},
    })
  } catch (err) {
    safeError('[CostTracker] Failed to log cost entry', err)
    // Non-fatal — never let cost tracking break enrichment
  }
}
