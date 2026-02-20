import { createAdminClient } from '@/lib/supabase/admin'

export type SdrConfiguration = {
  id: string
  workspace_id: string
  objective: string
  language: string
  do_not_contact_enabled: boolean
  human_in_the_loop: boolean
  trigger_phrases: string[]
  warmup_exclusion_keywords: string[]
  follow_up_enabled: boolean
  follow_up_count: number
  follow_up_interval_days: number
  reply_to_no_thanks: boolean
  no_thanks_template: string | null
  enable_signature: boolean
  auto_bcc_address: string | null
  notification_email: string | null
  cal_booking_url: string | null
  timezone: string
  availability_start: string
  availability_end: string
  exclude_weekends: boolean
  exclude_holidays: boolean
  agent_first_name: string | null
  agent_last_name: string | null
  created_at: string
  updated_at: string
}

export class SdrConfigRepository {
  private get db() {
    return createAdminClient()
  }

  async findByWorkspace(workspaceId: string): Promise<SdrConfiguration | null> {
    const { data } = await this.db
      .from('sdr_configurations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle()
    return data as SdrConfiguration | null
  }

  async upsert(
    workspaceId: string,
    config: Partial<SdrConfiguration>
  ): Promise<SdrConfiguration> {
    const { data, error } = await this.db
      .from('sdr_configurations')
      .upsert(
        { ...config, workspace_id: workspaceId, updated_at: new Date().toISOString() },
        { onConflict: 'workspace_id' }
      )
      .select('*')
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data as SdrConfiguration
  }
}
