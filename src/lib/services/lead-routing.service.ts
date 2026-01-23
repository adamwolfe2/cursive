/**
 * Lead Routing Service
 *
 * Routes leads to correct workspaces based on industry, geography, and custom rules.
 * Supports multi-tenant white-label platforms with vertical-specific routing.
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Lead = Database['public']['Tables']['leads']['Row']
type RoutingRule = Database['public']['Tables']['lead_routing_rules']['Row']
type Workspace = Database['public']['Tables']['workspaces']['Row']

export interface RouteLeadParams {
  leadData: Partial<Lead>
  sourceWorkspaceId: string
  userId: string
}

export interface RoutingResult {
  destinationWorkspaceId: string
  matchedRuleId: string | null
  matchedRuleName: string | null
  routingReason: string
  confidence: number
}

export interface BulkRouteResult {
  total: number
  routed: Record<string, number> // workspaceId -> count
  unrouted: number
  errors: Array<{ index: number; error: string }>
}

export class LeadRoutingService {
  /**
   * Route a single lead to the correct workspace
   */
  static async routeLead(params: RouteLeadParams): Promise<RoutingResult> {
    const supabase = await createClient()
    const { leadData, sourceWorkspaceId, userId } = params

    // Extract routing attributes from lead data
    const industry = leadData.company_industry
    const companySize = leadData.company_size
    const location = leadData.company_location as any
    const country = location?.country || 'US'
    const state = location?.state

    // Fetch all active routing rules for the source workspace
    const { data: rules, error } = await supabase
      .from('lead_routing_rules')
      .select('*')
      .eq('workspace_id', sourceWorkspaceId)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (error) {
      console.error('Error fetching routing rules:', error)
      return {
        destinationWorkspaceId: sourceWorkspaceId,
        matchedRuleId: null,
        matchedRuleName: null,
        routingReason: 'No routing rules found, using source workspace',
        confidence: 0
      }
    }

    // Find first matching rule
    const matchedRule = rules?.find(rule =>
      this.doesLeadMatchRule(leadData, rule)
    )

    if (matchedRule && matchedRule.destination_workspace_id) {
      return {
        destinationWorkspaceId: matchedRule.destination_workspace_id,
        matchedRuleId: matchedRule.id,
        matchedRuleName: matchedRule.rule_name,
        routingReason: `Matched rule: ${matchedRule.rule_name}`,
        confidence: matchedRule.priority / 100
      }
    }

    // No matching rule, check workspace allowed_industries and allowed_regions
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('allowed_industries, allowed_regions')
      .eq('id', sourceWorkspaceId)
      .single()

    if (workspace) {
      const allowedIndustries = workspace.allowed_industries || []
      const allowedRegions = workspace.allowed_regions || []

      // Check if lead matches workspace filters
      const industryMatch = allowedIndustries.length === 0 ||
        (industry && allowedIndustries.includes(industry))

      const regionMatch = allowedRegions.length === 0 ||
        (country && allowedRegions.includes(country)) ||
        (state && allowedRegions.includes(state))

      if (industryMatch && regionMatch) {
        return {
          destinationWorkspaceId: sourceWorkspaceId,
          matchedRuleId: null,
          matchedRuleName: null,
          routingReason: 'Matches workspace filters',
          confidence: 0.7
        }
      }
    }

    // Fallback: keep in source workspace
    return {
      destinationWorkspaceId: sourceWorkspaceId,
      matchedRuleId: null,
      matchedRuleName: null,
      routingReason: 'No matching rules or filters, kept in source workspace',
      confidence: 0.5
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
    leads: Partial<Lead>[],
    sourceWorkspaceId: string,
    userId: string
  ): Promise<BulkRouteResult> {
    const result: BulkRouteResult = {
      total: leads.length,
      routed: {},
      unrouted: 0,
      errors: []
    }

    for (let i = 0; i < leads.length; i++) {
      try {
        const routingResult = await this.routeLead({
          leadData: leads[i],
          sourceWorkspaceId,
          userId
        })

        const destId = routingResult.destinationWorkspaceId
        result.routed[destId] = (result.routed[destId] || 0) + 1

        if (destId === sourceWorkspaceId && !routingResult.matchedRuleId) {
          result.unrouted++
        }
      } catch (error: any) {
        result.errors.push({
          index: i,
          error: error.message
        })
      }
    }

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
}
