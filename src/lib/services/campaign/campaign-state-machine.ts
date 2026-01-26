/**
 * Campaign State Machine
 * Manages campaign status transitions with validation
 */

import { createClient } from '@/lib/supabase/server'

// Campaign statuses
export type CampaignStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'

// Valid status transitions
const VALID_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['pending_review'],
  pending_review: ['approved', 'rejected', 'draft'],
  approved: ['scheduled', 'active', 'draft'],
  rejected: ['draft'],
  scheduled: ['active', 'paused', 'draft'],
  active: ['paused', 'completed'],
  paused: ['active', 'completed', 'draft'],
  completed: ['draft'], // Allow restarting completed campaigns
}

// Transition error messages
const TRANSITION_ERRORS: Record<string, string> = {
  'draft->active': 'Campaign must be reviewed and approved before activating',
  'draft->scheduled': 'Campaign must be reviewed and approved before scheduling',
  'pending_review->active': 'Campaign must be approved before activating',
  'pending_review->scheduled': 'Campaign must be approved before scheduling',
  'rejected->active': 'Rejected campaigns cannot be activated. Return to draft first.',
  'completed->active': 'Completed campaigns cannot be reactivated. Create a new campaign or return to draft.',
}

export interface TransitionResult {
  success: boolean
  previousStatus?: CampaignStatus
  newStatus?: CampaignStatus
  error?: string
}

export interface CampaignTransitionContext {
  campaignId: string
  workspaceId: string
  userId?: string
  reason?: string
  scheduledStartAt?: Date
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
  currentStatus: CampaignStatus,
  newStatus: CampaignStatus
): boolean {
  const validTargets = VALID_TRANSITIONS[currentStatus] || []
  return validTargets.includes(newStatus)
}

/**
 * Get human-readable error for invalid transition
 */
export function getTransitionError(
  currentStatus: CampaignStatus,
  newStatus: CampaignStatus
): string {
  const key = `${currentStatus}->${newStatus}`
  return (
    TRANSITION_ERRORS[key] ||
    `Invalid transition from "${currentStatus}" to "${newStatus}". Valid transitions: ${VALID_TRANSITIONS[currentStatus]?.join(', ') || 'none'}`
  )
}

/**
 * Get valid next statuses from current status
 */
export function getValidNextStatuses(currentStatus: CampaignStatus): CampaignStatus[] {
  return VALID_TRANSITIONS[currentStatus] || []
}

/**
 * Transition campaign status with validation
 */
export async function transitionCampaignStatus(
  context: CampaignTransitionContext,
  newStatus: CampaignStatus
): Promise<TransitionResult> {
  const supabase = await createClient()

  // Fetch current campaign status
  const { data: campaign, error: fetchError } = await supabase
    .from('email_campaigns')
    .select('id, status, workspace_id, name, scheduled_start_at')
    .eq('id', context.campaignId)
    .eq('workspace_id', context.workspaceId)
    .single()

  if (fetchError || !campaign) {
    return {
      success: false,
      error: fetchError?.message || 'Campaign not found',
    }
  }

  const currentStatus = campaign.status as CampaignStatus

  // Check if transition is valid
  if (!isValidTransition(currentStatus, newStatus)) {
    return {
      success: false,
      previousStatus: currentStatus,
      error: getTransitionError(currentStatus, newStatus),
    }
  }

  // Build update payload
  const updatePayload: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }

  // Handle specific transitions
  switch (newStatus) {
    case 'scheduled':
      if (context.scheduledStartAt) {
        updatePayload.scheduled_start_at = context.scheduledStartAt.toISOString()
      } else if (!campaign.scheduled_start_at) {
        return {
          success: false,
          previousStatus: currentStatus,
          error: 'Scheduled campaigns require a scheduled_start_at date',
        }
      }
      break

    case 'active':
      // Clear scheduled_start_at when manually activating
      if (currentStatus === 'approved' || currentStatus === 'scheduled') {
        updatePayload.started_at = new Date().toISOString()
      }
      break

    case 'completed':
      updatePayload.completed_at = new Date().toISOString()
      break

    case 'paused':
      updatePayload.paused_at = new Date().toISOString()
      break

    case 'pending_review':
      updatePayload.submitted_for_review_at = new Date().toISOString()
      break

    case 'approved':
      updatePayload.reviewed_at = new Date().toISOString()
      if (context.userId) {
        updatePayload.reviewed_by = context.userId
      }
      break

    case 'rejected':
      updatePayload.reviewed_at = new Date().toISOString()
      if (context.userId) {
        updatePayload.reviewed_by = context.userId
      }
      if (context.reason) {
        updatePayload.review_notes = context.reason
      }
      break

    case 'draft':
      // Reset timestamps when returning to draft
      updatePayload.submitted_for_review_at = null
      updatePayload.reviewed_at = null
      updatePayload.reviewed_by = null
      break
  }

  // Perform the update
  const { error: updateError } = await supabase
    .from('email_campaigns')
    .update(updatePayload)
    .eq('id', context.campaignId)
    .eq('workspace_id', context.workspaceId)

  if (updateError) {
    return {
      success: false,
      previousStatus: currentStatus,
      error: `Failed to update campaign: ${updateError.message}`,
    }
  }

  return {
    success: true,
    previousStatus: currentStatus,
    newStatus,
  }
}

/**
 * Bulk transition campaigns (e.g., for scheduled activation)
 */
export async function bulkTransitionCampaigns(
  workspaceId: string,
  campaignIds: string[],
  newStatus: CampaignStatus
): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
  const results = {
    success: [] as string[],
    failed: [] as Array<{ id: string; error: string }>,
  }

  for (const campaignId of campaignIds) {
    const result = await transitionCampaignStatus(
      { campaignId, workspaceId },
      newStatus
    )

    if (result.success) {
      results.success.push(campaignId)
    } else {
      results.failed.push({ id: campaignId, error: result.error || 'Unknown error' })
    }
  }

  return results
}

/**
 * Check if a campaign can be activated
 * Returns validation errors if any
 */
export async function validateCampaignForActivation(
  campaignId: string,
  workspaceId: string
): Promise<{ valid: boolean; errors: string[] }> {
  const supabase = await createClient()
  const errors: string[] = []

  // Fetch campaign with related data
  const { data: campaign, error } = await supabase
    .from('email_campaigns')
    .select(`
      *,
      campaign_leads:campaign_leads(count),
      templates:email_templates!selected_template_ids(id)
    `)
    .eq('id', campaignId)
    .eq('workspace_id', workspaceId)
    .single()

  if (error || !campaign) {
    return { valid: false, errors: ['Campaign not found'] }
  }

  // Check status
  if (!['approved', 'scheduled', 'paused'].includes(campaign.status)) {
    errors.push(`Campaign must be approved, scheduled, or paused to activate (current: ${campaign.status})`)
  }

  // Check for leads
  const { count: leadCount } = await supabase
    .from('campaign_leads')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (!leadCount || leadCount === 0) {
    errors.push('Campaign has no leads. Add leads before activating.')
  }

  // Check for templates
  const templateIds = campaign.selected_template_ids || []
  if (templateIds.length === 0) {
    errors.push('Campaign has no templates selected. Select at least one template.')
  }

  // Check for value propositions
  const valueProps = campaign.value_propositions || []
  if (valueProps.length === 0) {
    errors.push('Campaign has no value propositions defined.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get campaigns ready for scheduled activation
 */
export async function getScheduledCampaignsToActivate(): Promise<
  Array<{ id: string; workspace_id: string; name: string }>
> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('email_campaigns')
    .select('id, workspace_id, name')
    .eq('status', 'scheduled')
    .lte('scheduled_start_at', now)

  if (error) {
    console.error('Error fetching scheduled campaigns:', error)
    return []
  }

  return data || []
}

/**
 * Auto-complete campaigns that have finished their sequences
 */
export async function autoCompleteCampaigns(): Promise<string[]> {
  const supabase = await createClient()
  const completedIds: string[] = []

  // Find active campaigns where all leads have finished
  const { data: activeCampaigns, error } = await supabase
    .from('email_campaigns')
    .select('id, workspace_id, sequence_steps')
    .eq('status', 'active')

  if (error || !activeCampaigns) {
    return completedIds
  }

  for (const campaign of activeCampaigns) {
    // Check if all leads have completed the sequence
    const { count: pendingCount } = await supabase
      .from('campaign_leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .in('status', ['pending', 'enriching', 'ready', 'awaiting_approval', 'in_sequence'])

    if (pendingCount === 0) {
      // All leads have finished - complete the campaign
      const result = await transitionCampaignStatus(
        { campaignId: campaign.id, workspaceId: campaign.workspace_id },
        'completed'
      )

      if (result.success) {
        completedIds.push(campaign.id)
      }
    }
  }

  return completedIds
}
