/**
 * Send Limits Service
 * Manages daily sending limits for campaigns and workspaces
 */

import { createClient } from '@/lib/supabase/server'

export interface SendLimitsStatus {
  canSend: boolean
  campaignLimit: number
  campaignSent: number
  campaignRemaining: number
  workspaceLimit: number
  workspaceSent: number
  workspaceRemaining: number
  limitReached: boolean
  limitType: 'campaign' | 'workspace' | null
}

/**
 * Check if sending is allowed based on daily limits
 */
export async function checkSendLimits(
  campaignId: string,
  workspaceId: string
): Promise<SendLimitsStatus> {
  const supabase = await createClient()

  // Use the database function for atomic check
  const { data, error } = await supabase.rpc('check_send_limits', {
    p_campaign_id: campaignId,
    p_workspace_id: workspaceId,
  })

  if (error || !data) {
    // On error, be conservative and check manually
    return await checkSendLimitsManual(campaignId, workspaceId)
  }

  return {
    canSend: data.can_send,
    campaignLimit: data.campaign_limit,
    campaignSent: data.campaign_sent,
    campaignRemaining: data.campaign_remaining,
    workspaceLimit: data.workspace_limit,
    workspaceSent: data.workspace_sent,
    workspaceRemaining: data.workspace_remaining,
    limitReached: data.limit_reached,
    limitType: data.limit_type,
  }
}

/**
 * Manual fallback for checking send limits
 */
async function checkSendLimitsManual(
  campaignId: string,
  workspaceId: string
): Promise<SendLimitsStatus> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Get campaign limits
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('daily_send_limit, sends_today, last_send_reset_at')
    .eq('id', campaignId)
    .single()

  // Get workspace limits
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('global_daily_send_limit, sends_today, last_send_reset_at')
    .eq('id', workspaceId)
    .single()

  const campaignLimit = campaign?.daily_send_limit || 50
  const campaignSent =
    campaign?.last_send_reset_at === today ? (campaign?.sends_today || 0) : 0

  const workspaceLimit = workspace?.global_daily_send_limit || 200
  const workspaceSent =
    workspace?.last_send_reset_at === today ? (workspace?.sends_today || 0) : 0

  const campaignLimitReached = campaignSent >= campaignLimit
  const workspaceLimitReached = workspaceSent >= workspaceLimit

  return {
    canSend: !campaignLimitReached && !workspaceLimitReached,
    campaignLimit,
    campaignSent,
    campaignRemaining: Math.max(0, campaignLimit - campaignSent),
    workspaceLimit,
    workspaceSent,
    workspaceRemaining: Math.max(0, workspaceLimit - workspaceSent),
    limitReached: campaignLimitReached || workspaceLimitReached,
    limitType: campaignLimitReached ? 'campaign' : workspaceLimitReached ? 'workspace' : null,
  }
}

/**
 * Increment send count after successful send
 */
export async function incrementSendCount(
  campaignId: string,
  workspaceId: string
): Promise<boolean> {
  const supabase = await createClient()

  // Use the database function for atomic increment
  const { error } = await supabase.rpc('increment_send_count', {
    p_campaign_id: campaignId,
    p_workspace_id: workspaceId,
  })

  if (error) {
    // Fallback to manual update
    return await incrementSendCountManual(campaignId, workspaceId)
  }

  return true
}

/**
 * Manual fallback for incrementing send count
 */
async function incrementSendCountManual(
  campaignId: string,
  workspaceId: string
): Promise<boolean> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    // Update campaign
    await supabase
      .from('email_campaigns')
      .update({
        sends_today: supabase.sql`
          CASE
            WHEN last_send_reset_at < '${today}'::date THEN 1
            ELSE sends_today + 1
          END
        `,
        last_send_reset_at: today,
      })
      .eq('id', campaignId)

    // Update workspace
    await supabase
      .from('workspaces')
      .update({
        sends_today: supabase.sql`
          CASE
            WHEN last_send_reset_at < '${today}'::date THEN 1
            ELSE sends_today + 1
          END
        `,
        last_send_reset_at: today,
      })
      .eq('id', workspaceId)

    return true
  } catch {
    return false
  }
}

/**
 * Update daily send limit for a campaign
 */
export async function updateCampaignDailyLimit(
  campaignId: string,
  workspaceId: string,
  newLimit: number
): Promise<{ success: boolean; error?: string }> {
  if (newLimit < 1 || newLimit > 500) {
    return { success: false, error: 'Daily limit must be between 1 and 500' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('email_campaigns')
    .update({ daily_send_limit: newLimit })
    .eq('id', campaignId)
    .eq('workspace_id', workspaceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update global daily send limit for a workspace
 */
export async function updateWorkspaceDailyLimit(
  workspaceId: string,
  newLimit: number
): Promise<{ success: boolean; error?: string }> {
  if (newLimit < 1 || newLimit > 2000) {
    return { success: false, error: 'Global daily limit must be between 1 and 2000' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('workspaces')
    .update({ global_daily_send_limit: newLimit })
    .eq('id', workspaceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get send stats for a workspace (for dashboard)
 */
export async function getWorkspaceSendStats(
  workspaceId: string
): Promise<{
  globalLimit: number
  globalSent: number
  globalRemaining: number
  campaigns: Array<{
    id: string
    name: string
    limit: number
    sent: number
    remaining: number
  }>
}> {
  const supabase = await createClient()

  // Get workspace stats
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('global_daily_send_limit, sends_today')
    .eq('id', workspaceId)
    .single()

  // Get active campaigns stats
  const { data: campaigns } = await supabase
    .from('email_campaigns')
    .select('id, name, daily_send_limit, sends_today')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')

  const globalLimit = workspace?.global_daily_send_limit || 200
  const globalSent = workspace?.sends_today || 0

  return {
    globalLimit,
    globalSent,
    globalRemaining: Math.max(0, globalLimit - globalSent),
    campaigns: (campaigns || []).map((c) => ({
      id: c.id,
      name: c.name,
      limit: c.daily_send_limit || 50,
      sent: c.sends_today || 0,
      remaining: Math.max(0, (c.daily_send_limit || 50) - (c.sends_today || 0)),
    })),
  }
}
