/**
 * Lead Routing Service
 *
 * Routes leads to correct workspaces based on industry, geography, and custom rules.
 * Supports multi-tenant white-label platforms with vertical-specific routing.
 *
 * SECURITY HARDENING (P0):
 * - Atomic operations using PostgreSQL locks (prevents race conditions)
 * - Cross-partner deduplication
 * - Retry queue for failed routing
 * - State machine tracking (pending → routing → routed → failed)
 * - RLS-compliant workspace filtering
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import type { Database } from '@/types/database.types'

// No Node.js 'crypto' import needed — crypto.randomUUID() is available globally in Edge runtime

type Lead = Database['public']['Tables']['leads']['Row']
type RoutingRule = Database['public']['Tables']['lead_routing_rules']['Row']
type Workspace = Database['public']['Tables']['workspaces']['Row']

export interface RouteLeadParams {
  leadId: string
  sourceWorkspaceId: string
  userId: string
  maxRetries?: number
}

export interface RoutingResult {
  success: boolean
  destinationWorkspaceId: string | null
  matchedRuleId: string | null
  matchedRuleName: string | null
  routingReason: string
  confidence: number
  isDuplicate?: boolean
  duplicateLeadId?: string
  error?: string
}

export interface BulkRouteResult {
  total: number
  routed: Record<string, number> // workspaceId -> count
  unrouted: number
  failed: number
  duplicates: number
  errors: Array<{ index: number; leadId: string; error: string }>
}

export class LeadRoutingService {
  /**
   * Route a single lead to the correct workspace (ATOMIC)
   *
   * Process:
   * 1. Acquire routing lock (prevents double-processing)
   * 2. Check for cross-partner duplicates
   * 3. Fetch and evaluate routing rules
   * 4. Complete routing or queue for retry on failure
   */
  static async routeLead(params: RouteLeadParams): Promise<RoutingResult> {
    const supabase = createAdminClient() // Use admin client for atomic operations
    const { leadId, sourceWorkspaceId, userId, maxRetries = 3 } = params

    // Generate lock owner ID for this routing operation
    const lockOwnerId = crypto.randomUUID()

    try {
      // STEP 1: Acquire routing lock (atomic operation)
      const { data: lockAcquired, error: lockError } = await supabase.rpc(
        'acquire_routing_lock',
        {
          p_lead_id: leadId,
          p_lock_owner: lockOwnerId,
        }
      )

      if (lockError || !lockAcquired) {
        return {
          success: false,
          destinationWorkspaceId: null,
          matchedRuleId: null,
          matchedRuleName: null,
          routingReason: 'Failed to acquire routing lock (already being processed)',
          confidence: 0,
          error: lockError?.message || 'Lock acquisition failed',
        }
      }

      // STEP 2: Fetch lead data with RLS compliance
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('workspace_id', sourceWorkspaceId) // RLS: explicit workspace filter
        .maybeSingle()

      if (leadError || !lead) {
        await this.handleRoutingFailure(supabase, leadId, lockOwnerId, 'Lead not found', maxRetries)
        return {
          success: false,
          destinationWorkspaceId: null,
          matchedRuleId: null,
          matchedRuleName: null,
          routingReason: 'Lead not found',
          confidence: 0,
          error: leadError?.message || 'Lead not found',
        }
      }

      // STEP 3: Check for cross-partner duplicates
      if (lead.dedupe_hash) {
        const { data: duplicate } = await supabase.rpc(
          'check_cross_partner_duplicate',
          {
            p_dedupe_hash: lead.dedupe_hash,
            p_source_workspace_id: sourceWorkspaceId,
          }
        )

        if (duplicate && duplicate.length > 0) {
          const duplicateLead = duplicate[0]
          safeLog('[Lead Routing] Cross-partner duplicate detected', {
            lead_id: leadId,
            duplicate_lead_id: duplicateLead.duplicate_lead_id,
            duplicate_workspace_id: duplicateLead.duplicate_workspace_id,
          })

          // Mark as routed (keep in source workspace but log duplicate)
          await supabase.rpc('complete_routing', {
            p_lead_id: leadId,
            p_destination_workspace_id: sourceWorkspaceId,
            p_matched_rule_id: null,
            p_lock_owner: lockOwnerId,
          })

          return {
            success: true,
            destinationWorkspaceId: sourceWorkspaceId,
            matchedRuleId: null,
            matchedRuleName: null,
            routingReason: 'Duplicate lead (already exists in partner network)',
            confidence: 1.0,
            isDuplicate: true,
            duplicateLeadId: duplicateLead.duplicate_lead_id,
          }
        }
      }

      // STEP 4: Fetch active routing rules
      const { data: rules, error: rulesError } = await supabase
        .from('lead_routing_rules')
        .select('id, name, workspace_id, destination_workspace_id, priority, is_active, conditions, match_type, rule_name, actions, created_at')
        .eq('workspace_id', sourceWorkspaceId) // RLS: explicit workspace filter
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (rulesError) {
        await this.handleRoutingFailure(supabase, leadId, lockOwnerId, rulesError.message, maxRetries)
        return {
          success: false,
          destinationWorkspaceId: null,
          matchedRuleId: null,
          matchedRuleName: null,
          routingReason: 'Failed to fetch routing rules',
          confidence: 0,
          error: rulesError.message,
        }
      }

      // STEP 5: Evaluate rules to find match
      const matchedRule = rules?.find((rule) => this.doesLeadMatchRule(lead, rule))

      let destinationWorkspaceId: string
      let matchedRuleId: string | null = null
      let matchedRuleName: string | null = null
      let routingReason: string
      let confidence: number

      if (matchedRule && matchedRule.destination_workspace_id) {
        // Rule matched
        destinationWorkspaceId = matchedRule.destination_workspace_id
        matchedRuleId = matchedRule.id
        matchedRuleName = matchedRule.rule_name
        routingReason = `Matched rule: ${matchedRule.rule_name}`
        confidence = matchedRule.priority / 100
      } else {
        // No rule match - check workspace filters
        const filterResult = await this.checkWorkspaceFilters(supabase, lead, sourceWorkspaceId)
        destinationWorkspaceId = filterResult.match ? sourceWorkspaceId : sourceWorkspaceId
        routingReason = filterResult.reason
        confidence = filterResult.confidence
      }

      // STEP 6: Complete routing (atomic operation)
      const { data: completed, error: completeError } = await supabase.rpc('complete_routing', {
        p_lead_id: leadId,
        p_destination_workspace_id: destinationWorkspaceId,
        p_matched_rule_id: matchedRuleId,
        p_lock_owner: lockOwnerId,
      })

      if (completeError || !completed) {
        await this.handleRoutingFailure(
          supabase,
          leadId,
          lockOwnerId,
          completeError?.message || 'Failed to complete routing',
          maxRetries
        )
        return {
          success: false,
          destinationWorkspaceId: null,
          matchedRuleId: null,
          matchedRuleName: null,
          routingReason: 'Failed to complete routing transaction',
          confidence: 0,
          error: completeError?.message || 'Transaction failed',
        }
      }

      safeLog('[Lead Routing] Successfully routed lead', {
        lead_id: leadId,
        destination_workspace_id: destinationWorkspaceId,
        matched_rule_id: matchedRuleId,
      })

      return {
        success: true,
        destinationWorkspaceId,
        matchedRuleId,
        matchedRuleName,
        routingReason,
        confidence,
      }
    } catch (error: any) {
      safeError('[Lead Routing] Unexpected error:', error)
      await this.handleRoutingFailure(supabase, leadId, lockOwnerId, error.message, maxRetries)
      return {
        success: false,
        destinationWorkspaceId: null,
        matchedRuleId: null,
        matchedRuleName: null,
        routingReason: 'Unexpected routing error',
        confidence: 0,
        error: error.message,
      }
    }
  }

  /**
   * Handle routing failure (queue for retry or mark as failed)
   */
  private static async handleRoutingFailure(
    supabase: ReturnType<typeof createAdminClient>,
    leadId: string,
    lockOwnerId: string,
    errorMessage: string,
    maxRetries: number
  ): Promise<void> {
    try {
      await supabase.rpc('fail_routing', {
        p_lead_id: leadId,
        p_error_message: errorMessage,
        p_lock_owner: lockOwnerId,
        p_max_attempts: maxRetries,
      })
    } catch (error: any) {
      safeError('[Lead Routing] Failed to handle routing failure:', error)
    }
  }

  /**
   * Check if lead matches workspace filters (fallback when no rules match)
   */
  private static async checkWorkspaceFilters(
    supabase: ReturnType<typeof createAdminClient>,
    lead: Lead,
    workspaceId: string
  ): Promise<{ match: boolean; reason: string; confidence: number }> {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('allowed_industries, allowed_regions')
      .eq('id', workspaceId)
      .maybeSingle()

    if (!workspace) {
      return {
        match: false,
        reason: 'Workspace not found',
        confidence: 0,
      }
    }

    const allowedIndustries = workspace.allowed_industries || []
    const allowedRegions = workspace.allowed_regions || []

    const industry = lead.company_industry
    const location = lead.company_location as any
    const country = location?.country || 'US'
    const state = location?.state

    const industryMatch =
      allowedIndustries.length === 0 || (industry && allowedIndustries.includes(industry))

    const regionMatch =
      allowedRegions.length === 0 ||
      (country && allowedRegions.includes(country)) ||
      (state && allowedRegions.includes(state))

    if (industryMatch && regionMatch) {
      return {
        match: true,
        reason: 'Matches workspace filters',
        confidence: 0.7,
      }
    }

    return {
      match: false,
      reason: 'No matching rules or filters, kept in source workspace',
      confidence: 0.5,
    }
  }

  /**
   * Check if a lead matches a routing rule
   */
  private static doesLeadMatchRule(
    leadData: Partial<Lead>,
    rule: RoutingRule
  ): boolean {
    const conditions = rule.conditions as any

    // Extract lead attributes
    const industry = leadData.company_industry
    const companySize = leadData.company_size
    const revenue = leadData.company_revenue
    const location = leadData.company_location as any
    const country = location?.country || 'US'
    const state = location?.state

    // Check industry match
    const industries = conditions.industries || []
    if (industries.length > 0 && industry) {
      if (!industries.includes(industry)) {
        return false
      }
    }

    // Check company size match
    const companySizes = conditions.company_sizes || []
    if (companySizes.length > 0 && companySize) {
      if (!companySizes.includes(companySize)) {
        return false
      }
    }

    // Check revenue match
    const revenueRanges = conditions.revenue_ranges || []
    if (revenueRanges.length > 0 && revenue) {
      if (!revenueRanges.includes(revenue)) {
        return false
      }
    }

    // Check country match
    const countries = conditions.countries || []
    if (countries.length > 0 && country) {
      if (!countries.includes(country)) {
        return false
      }
    }

    // Check state match
    const states = conditions.us_states || []
    if (states.length > 0 && state) {
      if (!states.includes(state)) {
        return false
      }
    }

    // Check regions match (e.g., "Northeast", "West Coast")
    const regions = conditions.regions || []
    if (regions.length > 0 && state) {
      const stateRegionMap = this.getStateRegionMap()
      const leadRegion = stateRegionMap[state]
      if (!leadRegion || !regions.includes(leadRegion)) {
        return false
      }
    }

    // All conditions passed
    return true
  }

  /**
   * Route multiple leads in bulk
   */
  static async routeLeadsBulk(
    leadIds: string[],
    sourceWorkspaceId: string,
    userId: string,
    maxRetries: number = 3
  ): Promise<BulkRouteResult> {
    const result: BulkRouteResult = {
      total: leadIds.length,
      routed: {},
      unrouted: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
    }

    // Process leads sequentially to avoid overwhelming database
    for (let i = 0; i < leadIds.length; i++) {
      try {
        const routingResult = await this.routeLead({
          leadId: leadIds[i],
          sourceWorkspaceId,
          userId,
          maxRetries,
        })

        if (routingResult.success) {
          if (routingResult.isDuplicate) {
            result.duplicates++
          }

          const destId = routingResult.destinationWorkspaceId!
          result.routed[destId] = (result.routed[destId] || 0) + 1

          if (destId === sourceWorkspaceId && !routingResult.matchedRuleId) {
            result.unrouted++
          }
        } else {
          result.failed++
          result.errors.push({
            index: i,
            leadId: leadIds[i],
            error: routingResult.error || 'Unknown error',
          })
        }
      } catch (error: any) {
        result.failed++
        result.errors.push({
          index: i,
          leadId: leadIds[i],
          error: error.message,
        })
      }
    }

    return result
  }

  /**
   * Process leads from retry queue (called by Inngest worker)
   */
  static async processRetryQueue(limit: number = 100): Promise<{
    processed: number
    succeeded: number
    failed: number
    errors: Array<{ leadId: string; error: string }>
  }> {
    const supabase = createAdminClient()

    // Fetch retry queue items that are ready for processing
    const { data: queueItems, error: queueError } = await supabase
      .from('lead_routing_queue')
      .select('id, lead_id, workspace_id, attempt_number, max_attempts')
      .lte('next_retry_at', new Date().toISOString())
      .is('processed_at', null)
      .limit(limit)

    if (queueError || !queueItems) {
      safeError('[Lead Routing] Failed to fetch retry queue:', queueError)
      return { processed: 0, succeeded: 0, failed: 0, errors: [] }
    }

    const result = {
      processed: queueItems.length,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ leadId: string; error: string }>,
    }

    for (const item of queueItems) {
      try {
        // Attempt routing with remaining retries
        const routingResult = await this.routeLead({
          leadId: item.lead_id,
          sourceWorkspaceId: item.workspace_id,
          userId: 'system', // System user for retry queue
          maxRetries: item.max_attempts,
        })

        if (routingResult.success) {
          result.succeeded++

          // Mark queue item as processed
          const { error: processedError } = await supabase
            .from('lead_routing_queue')
            .update({ processed_at: new Date().toISOString() })
            .eq('id', item.id)

          if (processedError) {
            safeError('[Lead Routing] Failed to mark queue item as processed:', processedError)
          }
        } else {
          result.failed++
          result.errors.push({
            leadId: item.lead_id,
            error: routingResult.error || 'Routing failed',
          })

          // Update error count in queue
          const { error: queueUpdateError } = await supabase
            .from('lead_routing_queue')
            .update({
              last_error: routingResult.error,
              error_count: item.attempt_number + 1,
            })
            .eq('id', item.id)

          if (queueUpdateError) {
            safeError('[Lead Routing] Failed to update queue error count:', queueUpdateError)
          }
        }
      } catch (error: any) {
        result.failed++
        result.errors.push({
          leadId: item.lead_id,
          error: error.message,
        })
        safeError('[Lead Routing] Error processing retry queue item:', error)
      }
    }

    safeLog('[Lead Routing] Processed retry queue', {
      total: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
    })

    return result
  }

  /**
   * Find best workspace for a lead based on industry and geography
   */
  static async findBestWorkspace(
    leadData: Partial<Lead>
  ): Promise<string | null> {
    const supabase = await createClient()

    const industry = leadData.company_industry
    const location = leadData.company_location as any
    const country = location?.country || 'US'
    const state = location?.state

    // Find workspaces that match industry and geography
    let query = supabase
      .from('workspaces')
      .select('id, allowed_industries, allowed_regions, routing_config')
      .eq('is_white_label', true)

    const { data: workspaces } = await query

    if (!workspaces || workspaces.length === 0) {
      return null
    }

    // Score each workspace
    const scored = workspaces.map(ws => {
      let score = 0
      const allowedIndustries = ws.allowed_industries || []
      const allowedRegions = ws.allowed_regions || []

      // Industry match (weight: 10)
      if (industry && allowedIndustries.includes(industry)) {
        score += 10
      } else if (allowedIndustries.length === 0) {
        score += 5 // Accept all industries
      }

      // Region match (weight: 5)
      if ((country && allowedRegions.includes(country)) ||
          (state && allowedRegions.includes(state))) {
        score += 5
      } else if (allowedRegions.length === 0) {
        score += 2 // Accept all regions
      }

      return { workspaceId: ws.id, score }
    })

    // Sort by score and return best match
    scored.sort((a, b) => b.score - a.score)

    return scored[0]?.score > 0 ? scored[0].workspaceId : null
  }

  /**
   * Get US state to region mapping
   */
  private static getStateRegionMap(): Record<string, string> {
    return {
      // Northeast
      'CT': 'Northeast', 'ME': 'Northeast', 'MA': 'Northeast', 'NH': 'Northeast',
      'RI': 'Northeast', 'VT': 'Northeast', 'NY': 'Northeast', 'NJ': 'Northeast',
      'PA': 'Northeast',

      // Southeast
      'DE': 'Southeast', 'FL': 'Southeast', 'GA': 'Southeast', 'MD': 'Southeast',
      'NC': 'Southeast', 'SC': 'Southeast', 'VA': 'Southeast', 'WV': 'Southeast',
      'KY': 'Southeast', 'TN': 'Southeast', 'AL': 'Southeast', 'MS': 'Southeast',
      'AR': 'Southeast', 'LA': 'Southeast',

      // Midwest
      'IL': 'Midwest', 'IN': 'Midwest', 'MI': 'Midwest', 'OH': 'Midwest',
      'WI': 'Midwest', 'IA': 'Midwest', 'KS': 'Midwest', 'MN': 'Midwest',
      'MO': 'Midwest', 'NE': 'Midwest', 'ND': 'Midwest', 'SD': 'Midwest',

      // Southwest
      'AZ': 'Southwest', 'NM': 'Southwest', 'OK': 'Southwest', 'TX': 'Southwest',

      // West
      'CO': 'West', 'ID': 'West', 'MT': 'West', 'NV': 'West',
      'UT': 'West', 'WY': 'West', 'AK': 'West', 'CA': 'West',
      'HI': 'West', 'OR': 'West', 'WA': 'West'
    }
  }

  /**
   * Get routing statistics for a workspace
   */
  static async getRoutingStats(workspaceId: string, days: number = 30) {
    const supabase = await createClient()

    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: leads } = await supabase
      .from('leads')
      .select('workspace_id, routing_rule_id, routing_metadata, company_industry, company_location')
      .or(`workspace_id.eq.${workspaceId},routing_metadata->original_workspace_id.eq."${workspaceId}"`)
      .gte('created_at', since.toISOString())

    if (!leads) {
      return {
        totalLeads: 0,
        routedAway: 0,
        routedIn: 0,
        byIndustry: {},
        byRegion: {},
        byRule: {}
      }
    }

    const stats = {
      totalLeads: leads.length,
      routedAway: 0,
      routedIn: 0,
      byIndustry: {} as Record<string, number>,
      byRegion: {} as Record<string, number>,
      byRule: {} as Record<string, number>
    }

    leads.forEach(lead => {
      const metadata = lead.routing_metadata as any
      const originalWorkspace = metadata?.original_workspace_id

      if (originalWorkspace === workspaceId && lead.workspace_id !== workspaceId) {
        stats.routedAway++
      }

      if (originalWorkspace && originalWorkspace !== workspaceId && lead.workspace_id === workspaceId) {
        stats.routedIn++
      }

      // Count by industry
      if (lead.company_industry) {
        stats.byIndustry[lead.company_industry] = (stats.byIndustry[lead.company_industry] || 0) + 1
      }

      // Count by region
      const location = lead.company_location as any
      const state = location?.state
      if (state) {
        const region = this.getStateRegionMap()[state]
        if (region) {
          stats.byRegion[region] = (stats.byRegion[region] || 0) + 1
        }
      }

      // Count by rule
      if (lead.routing_rule_id) {
        stats.byRule[lead.routing_rule_id] = (stats.byRule[lead.routing_rule_id] || 0) + 1
      }
    })

    return stats
  }

  /**
   * Cleanup stale routing locks (called periodically by cron job)
   */
  static async cleanupStaleLocks(): Promise<{ released: number }> {
    const supabase = createAdminClient()

    try {
      const { data: released, error } = await supabase.rpc('release_stale_routing_locks')

      if (error) {
        safeError('[Lead Routing] Failed to cleanup stale locks:', error)
        return { released: 0 }
      }

      if (released && released > 0) {
        safeLog('[Lead Routing] Released stale locks', { count: released })
      }

      return { released: released || 0 }
    } catch (error: any) {
      safeError('[Lead Routing] Error cleaning up stale locks:', error)
      return { released: 0 }
    }
  }

  /**
   * Mark expired leads (called periodically by cron job)
   */
  static async markExpiredLeads(): Promise<{ expired: number }> {
    const supabase = createAdminClient()

    try {
      const { data: expired, error } = await supabase.rpc('mark_expired_leads')

      if (error) {
        safeError('[Lead Routing] Failed to mark expired leads:', error)
        return { expired: 0 }
      }

      if (expired && expired > 0) {
        safeLog('[Lead Routing] Marked expired leads', { count: expired })
      }

      return { expired: expired || 0 }
    } catch (error: any) {
      safeError('[Lead Routing] Error marking expired leads:', error)
      return { expired: 0 }
    }
  }

  /**
   * Get routing health metrics
   */
  static async getRoutingHealth(workspaceId: string): Promise<{
    pendingCount: number
    routingCount: number
    failedCount: number
    retryQueueCount: number
    staleLockCount: number
  }> {
    const supabase = createAdminClient()

    const [pending, routing, failed, retryQueue, staleLocks] = await Promise.all([
      // Pending leads
      supabase
        .from('leads')
        .select('id', { count: 'estimated', head: true })
        .eq('workspace_id', workspaceId)
        .eq('routing_status', 'pending'),

      // Currently routing
      supabase
        .from('leads')
        .select('id', { count: 'estimated', head: true })
        .eq('workspace_id', workspaceId)
        .eq('routing_status', 'routing'),

      // Failed routing
      supabase
        .from('leads')
        .select('id', { count: 'estimated', head: true })
        .eq('workspace_id', workspaceId)
        .eq('routing_status', 'failed'),

      // Retry queue
      supabase
        .from('lead_routing_queue')
        .select('id', { count: 'estimated', head: true })
        .eq('workspace_id', workspaceId)
        .is('processed_at', null),

      // Stale locks (routing for > 5 minutes)
      supabase
        .from('leads')
        .select('id', { count: 'estimated', head: true })
        .eq('workspace_id', workspaceId)
        .eq('routing_status', 'routing')
        .lt('routing_locked_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    ])

    return {
      pendingCount: pending.count || 0,
      routingCount: routing.count || 0,
      failedCount: failed.count || 0,
      retryQueueCount: retryQueue.count || 0,
      staleLockCount: staleLocks.count || 0,
    }
  }
}
