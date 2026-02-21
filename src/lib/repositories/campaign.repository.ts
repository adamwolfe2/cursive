// Campaign Repository
// Database access layer for email campaigns using repository pattern

import { createClient } from '@/lib/supabase/server'
import type {
  EmailCampaign,
  EmailCampaignInsert,
  EmailCampaignUpdate,
  CampaignLead,
  CampaignLeadInsert,
  CampaignReview,
  CampaignReviewInsert,
} from '@/types'
import { DatabaseError } from '@/types'

export class CampaignRepository {
  /**
   * Find all campaigns for a workspace
   */
  async findByWorkspace(workspaceId: string): Promise<EmailCampaign[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailCampaign[]
  }

  /**
   * Find campaigns by status
   */
  async findByStatus(workspaceId: string, status: string): Promise<EmailCampaign[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailCampaign[]
  }

  /**
   * Find a single campaign by ID
   */
  async findById(id: string, workspaceId: string): Promise<EmailCampaign | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(error.message)
    }

    return data as EmailCampaign
  }

  /**
   * Find campaign with full details (leads count, review status, etc.)
   */
  async findByIdWithDetails(
    id: string,
    workspaceId: string
  ): Promise<{
    campaign: EmailCampaign
    leadsCount: number
    pendingReview: CampaignReview | null
  } | null> {
    const supabase = await createClient()

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (campaignError) {
      if (campaignError.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(campaignError.message)
    }

    // Get leads count
    // Note: campaign is already workspace-filtered above; RLS provides secondary defense
    // PERFORMANCE: Use estimated count for campaign stats
    const { count: leadsCount, error: leadsError } = await supabase
      .from('campaign_leads')
      .select('*', { count: 'estimated', head: true })
      .eq('campaign_id', id)

    if (leadsError) {
      throw new DatabaseError(leadsError.message)
    }

    // Get pending review if any
    const { data: pendingReview, error: reviewError } = await supabase
      .from('campaign_reviews')
      .select('*')
      .eq('campaign_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Ignore not found error for review
    if (reviewError && reviewError.code !== 'PGRST116') {
      throw new DatabaseError(reviewError.message)
    }

    return {
      campaign: campaign as EmailCampaign,
      leadsCount: leadsCount || 0,
      pendingReview: pendingReview as CampaignReview | null,
    }
  }

  /**
   * Create a new campaign
   */
  async create(campaign: EmailCampaignInsert): Promise<EmailCampaign> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_campaigns')
      .insert(campaign)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailCampaign
  }

  /**
   * Update a campaign
   */
  async update(
    id: string,
    workspaceId: string,
    campaign: EmailCampaignUpdate
  ): Promise<EmailCampaign> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_campaigns')
      .update(campaign)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailCampaign
  }

  /**
   * Delete a campaign
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * Submit campaign for review
   */
  async submitForReview(
    id: string,
    workspaceId: string,
    sampleEmails: object[] = []
  ): Promise<CampaignReview> {
    const supabase = await createClient()

    // Update campaign status
    const { error: updateError } = await supabase
      .from('email_campaigns')
      .update({
        status: 'pending_review',
        submitted_for_review_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (updateError) {
      throw new DatabaseError(updateError.message)
    }

    // Create review record
    const { data: review, error: reviewError } = await supabase
      .from('campaign_reviews')
      .insert({
        campaign_id: id,
        review_type: 'internal',
        sample_emails_reviewed: sampleEmails,
      })
      .select('*')
      .maybeSingle()

    if (reviewError) {
      throw new DatabaseError(reviewError.message)
    }

    return review as CampaignReview
  }

  // ============================================================================
  // Campaign Leads Methods
  // ============================================================================

  /**
   * Get leads for a campaign
   * Verifies campaign belongs to the specified workspace before returning leads
   */
  async getCampaignLeads(campaignId: string, workspaceId: string): Promise<CampaignLead[]> {
    const supabase = await createClient()

    // Verify campaign belongs to workspace
    const campaign = await this.findById(campaignId, workspaceId)
    if (!campaign) {
      throw new DatabaseError('Campaign not found or does not belong to workspace')
    }

    const { data, error } = await supabase
      .from('campaign_leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as CampaignLead[]
  }

  /**
   * Add leads to a campaign
   * Verifies campaign belongs to the specified workspace before adding leads
   */
  async addLeadsToCampaign(
    campaignId: string,
    workspaceId: string,
    leadIds: string[]
  ): Promise<CampaignLead[]> {
    const supabase = await createClient()

    // Verify campaign belongs to workspace
    const campaign = await this.findById(campaignId, workspaceId)
    if (!campaign) {
      throw new DatabaseError('Campaign not found or does not belong to workspace')
    }

    // SECURITY: Verify all leads belong to the same workspace before adding to campaign
    const { data: verifiedLeads, error: verifyError } = await supabase
      .from('leads')
      .select('id')
      .eq('workspace_id', workspaceId)
      .in('id', leadIds)

    if (verifyError) throw new DatabaseError(verifyError.message)

    const verifiedLeadIds = new Set((verifiedLeads || []).map((l) => l.id))
    const validLeadIds = leadIds.filter((id) => verifiedLeadIds.has(id))

    if (validLeadIds.length === 0) {
      throw new DatabaseError('None of the specified leads belong to this workspace')
    }

    const campaignLeads = validLeadIds.map((leadId) => ({
      campaign_id: campaignId,
      lead_id: leadId,
    }))

    const { data, error } = await supabase
      .from('campaign_leads')
      .insert(campaignLeads)
      .select('*')

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as CampaignLead[]
  }

  /**
   * Remove a lead from a campaign
   * SECURITY: Verifies campaign belongs to workspace before removing lead
   */
  async removeLeadFromCampaign(campaignId: string, leadId: string, workspaceId: string): Promise<void> {
    // Verify campaign belongs to workspace
    const campaign = await this.findById(campaignId, workspaceId)
    if (!campaign) {
      throw new DatabaseError('Campaign not found or does not belong to workspace')
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('campaign_leads')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('lead_id', leadId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * Update campaign lead status
   * SECURITY: Verifies campaign lead belongs to a campaign in the workspace
   */
  async updateCampaignLeadStatus(
    campaignLeadId: string,
    status: string,
    workspaceId: string
  ): Promise<CampaignLead> {
    const supabase = await createClient()

    // First get the campaign lead to find its campaign_id
    const { data: campaignLead, error: lookupError } = await supabase
      .from('campaign_leads')
      .select('campaign_id')
      .eq('id', campaignLeadId)
      .maybeSingle()

    if (lookupError || !campaignLead) {
      throw new DatabaseError('Campaign lead not found')
    }

    // Verify the campaign belongs to the workspace
    const campaign = await this.findById(campaignLead.campaign_id, workspaceId)
    if (!campaign) {
      throw new DatabaseError('Campaign not found or does not belong to workspace')
    }

    const { data, error } = await supabase
      .from('campaign_leads')
      .update({ status })
      .eq('id', campaignLeadId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as CampaignLead
  }

  // ============================================================================
  // Campaign Reviews Methods
  // ============================================================================

  /**
   * Get reviews for a campaign
   * SECURITY: Verifies campaign belongs to workspace before returning reviews
   */
  async getCampaignReviews(campaignId: string, workspaceId: string): Promise<CampaignReview[]> {
    // Verify campaign belongs to workspace
    const campaign = await this.findById(campaignId, workspaceId)
    if (!campaign) {
      throw new DatabaseError('Campaign not found or does not belong to workspace')
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('campaign_reviews')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as CampaignReview[]
  }

  /**
   * Get pending reviews for a workspace (review queue)
   */
  async getPendingReviews(workspaceId: string): Promise<
    Array<{
      review: CampaignReview
      campaign: EmailCampaign
    }>
  > {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('campaign_reviews')
      .select(`
        *,
        email_campaigns!inner (*)
      `)
      .eq('status', 'pending')
      .eq('email_campaigns.workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return (data || []).map((item: any) => ({
      review: {
        id: item.id,
        campaign_id: item.campaign_id,
        reviewer_id: item.reviewer_id,
        review_type: item.review_type,
        status: item.status,
        notes: item.notes,
        requested_changes: item.requested_changes,
        sample_emails_reviewed: item.sample_emails_reviewed,
        created_at: item.created_at,
        completed_at: item.completed_at,
      } as CampaignReview,
      campaign: item.email_campaigns as EmailCampaign,
    }))
  }

  /**
   * Complete a review (approve/reject/request changes)
   * SECURITY: Verifies review's campaign belongs to workspace before updating
   */
  async completeReview(
    reviewId: string,
    reviewerId: string,
    status: 'approved' | 'approved_with_changes' | 'rejected' | 'changes_requested',
    workspaceId: string,
    notes?: string,
    requestedChanges?: object[]
  ): Promise<CampaignReview> {
    const supabase = await createClient()

    // First get the review to find its campaign_id
    const { data: existingReview, error: lookupError } = await supabase
      .from('campaign_reviews')
      .select('campaign_id')
      .eq('id', reviewId)
      .maybeSingle()

    if (lookupError || !existingReview) {
      throw new DatabaseError('Review not found')
    }

    // SECURITY: Verify the campaign belongs to the workspace
    const campaign = await this.findById(existingReview.campaign_id, workspaceId)
    if (!campaign) {
      throw new DatabaseError('Campaign not found or does not belong to workspace')
    }

    // Update review
    const { data: review, error: reviewError } = await supabase
      .from('campaign_reviews')
      .update({
        reviewer_id: reviewerId,
        status,
        notes,
        requested_changes: requestedChanges || [],
        completed_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select('*')
      .maybeSingle()

    if (reviewError) {
      throw new DatabaseError(reviewError.message)
    }

    // Get campaign ID for status update
    const campaignId = (review as CampaignReview).campaign_id

    // Update campaign status based on review outcome
    let campaignStatus: string
    if (status === 'approved' || status === 'approved_with_changes') {
      campaignStatus = 'approved'
    } else if (status === 'rejected') {
      campaignStatus = 'rejected'
    } else {
      campaignStatus = 'draft' // changes_requested
    }

    // SECURITY: Filter campaign update by workspace_id
    const { error: campaignError } = await supabase
      .from('email_campaigns')
      .update({
        status: campaignStatus,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes,
      })
      .eq('id', campaignId)
      .eq('workspace_id', workspaceId)

    if (campaignError) {
      throw new DatabaseError(campaignError.message)
    }

    return review as CampaignReview
  }

  /**
   * Count campaigns by status for a workspace
   */
  async countByStatus(workspaceId: string): Promise<Record<string, number>> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_campaigns')
      .select('status')
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new DatabaseError(error.message)
    }

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      counts[row.status] = (counts[row.status] || 0) + 1
    }

    return counts
  }
}
