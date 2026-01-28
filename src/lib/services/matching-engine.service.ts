/**
 * Lead Matching Engine
 *
 * Core service for routing leads to matching client profiles based on:
 * - Industry (SIC codes)
 * - Geography (state, city, zip, radius)
 * - Quality filters
 * - Lead caps
 *
 * Flow:
 * 1. Lead comes in (from DataShopper, upload, or API)
 * 2. Extract SIC codes from lead's company associations
 * 3. Extract location data
 * 4. Find all client profiles that match the criteria
 * 5. Apply caps and priority sorting
 * 6. Assign to best matching client(s)
 * 7. If no match, add to unroutable queue
 */

import { createClient } from '@/lib/supabase/server'
import type { Lead } from '@/types'
import { DatabaseError } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface ClientProfile {
  id: string
  workspace_id: string
  client_name: string
  target_sic_codes: string[]
  target_industry_categories: string[]
  target_sic_prefix: string[]
  target_states: string[]
  target_cities: string[]
  target_zips: string[]
  target_zip_prefixes: string[]
  target_counties: string[]
  target_dmas: number[]
  target_radius_miles: number | null
  target_radius_center_lat: number | null
  target_radius_center_lng: number | null
  daily_lead_cap: number | null
  weekly_lead_cap: number | null
  monthly_lead_cap: number | null
  total_lead_cap: number | null
  daily_lead_count: number
  weekly_lead_count: number
  monthly_lead_count: number
  total_lead_count: number
  routing_priority: number
  routing_weight: number
  is_exclusive: boolean
  min_quality_score: number | null
  require_email: boolean
  require_phone: boolean
  require_company: boolean
  excluded_domains: string[]
  is_active: boolean
}

interface LeadCompany {
  sic_code: string | null
  sic_description: string | null
  company_name: string
  job_title: string | null
}

interface MatchResult {
  clientId: string
  clientName: string
  matchedSicCodes: string[]
  matchedGeoType: string | null
  matchedGeoValue: string | null
  matchScore: number
  wasExclusive: boolean
  reasons: string[]
}

interface RoutingDecision {
  leadId: string
  matched: boolean
  assignments: MatchResult[]
  unroutableReason?: string
  unroutableDetails?: string
}

interface LeadData {
  id: string
  workspace_id: string
  // Location
  state?: string | null
  state_code?: string | null
  city?: string | null
  postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  dma?: number | null
  county_name?: string | null
  // Contact
  email?: string | null
  phone?: string | null
  // Company
  company_name?: string | null
  company_domain?: string | null
  // Quality
  financial_power?: number | null
  // Companies array (from lead_companies)
  companies?: LeadCompany[]
}

// ============================================================================
// MATCHING ENGINE SERVICE
// ============================================================================

export class MatchingEngineService {
  private workspaceId: string

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
  }

  /**
   * Main entry point: Route a lead to matching clients
   */
  async routeLead(leadId: string): Promise<RoutingDecision> {
    const supabase = await createClient()

    // 1. Get lead data with company associations
    const leadData = await this.getLeadWithCompanies(leadId)
    if (!leadData) {
      throw new DatabaseError(`Lead not found: ${leadId}`)
    }

    // 2. Extract SIC codes from company associations
    const sicCodes = this.extractSicCodes(leadData)

    // 3. Get active client profiles
    const clients = await this.getActiveClients()

    // 4. Find matching clients
    const matches = await this.findMatchingClients(leadData, sicCodes, clients)

    // 5. If no matches, handle unroutable
    if (matches.length === 0) {
      const reason = this.determineUnroutableReason(leadData, sicCodes, clients)
      await this.createUnroutableRecord(leadData, reason.reason, reason.details, sicCodes, clients)

      return {
        leadId,
        matched: false,
        assignments: [],
        unroutableReason: reason.reason,
        unroutableDetails: reason.details,
      }
    }

    // 6. Sort by priority and create assignments
    const sortedMatches = this.sortByPriority(matches)

    // 7. Handle exclusive clients (only first exclusive client gets the lead)
    const assignments = this.applyExclusivity(sortedMatches)

    // 8. Create assignment records
    for (const match of assignments) {
      await this.createAssignment(leadId, match)
    }

    // 9. Log the routing decision
    await this.logRoutingDecision(leadId, matches, assignments)

    return {
      leadId,
      matched: true,
      assignments,
    }
  }

  /**
   * Get lead with company associations
   */
  private async getLeadWithCompanies(leadId: string): Promise<LeadData | null> {
    const supabase = await createClient()

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('workspace_id', this.workspaceId)
      .single()

    if (leadError || !lead) {
      return null
    }

    // Get company associations
    const { data: companies } = await supabase
      .from('lead_companies')
      .select('sic_code, sic_description, company_name, job_title')
      .eq('lead_id', leadId)

    return {
      ...lead,
      companies: companies || [],
    } as LeadData
  }

  /**
   * Extract all SIC codes from lead's company associations
   */
  private extractSicCodes(lead: LeadData): string[] {
    const sicCodes: string[] = []

    // From company associations
    if (lead.companies) {
      for (const company of lead.companies) {
        if (company.sic_code) {
          sicCodes.push(company.sic_code)
        }
      }
    }

    // Deduplicate
    return [...new Set(sicCodes)]
  }

  /**
   * Get all active client profiles
   */
  private async getActiveClients(): Promise<ClientProfile[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('is_active', true)
      .is('paused_at', null)

    if (error) {
      throw new DatabaseError(`Failed to get client profiles: ${error.message}`)
    }

    return (data || []) as ClientProfile[]
  }

  /**
   * Find all clients that match the lead's criteria
   */
  private async findMatchingClients(
    lead: LeadData,
    sicCodes: string[],
    clients: ClientProfile[]
  ): Promise<MatchResult[]> {
    const matches: MatchResult[] = []

    for (const client of clients) {
      // Check if client is at cap
      if (this.isClientAtCap(client)) {
        continue
      }

      // Check quality filters
      if (!this.passesQualityFilters(lead, client)) {
        continue
      }

      // Check excluded domains
      if (this.isExcludedDomain(lead, client)) {
        continue
      }

      // Check SIC code match
      const sicMatch = this.checkSicMatch(sicCodes, client)

      // Check geo match
      const geoMatch = await this.checkGeoMatch(lead, client)

      // Must match at least SIC or geo (depending on client config)
      // For now: require BOTH industry and geo match
      if (sicMatch.matched && geoMatch.matched) {
        const matchScore = this.calculateMatchScore(sicMatch, geoMatch, client)

        matches.push({
          clientId: client.id,
          clientName: client.client_name,
          matchedSicCodes: sicMatch.matchedCodes,
          matchedGeoType: geoMatch.matchType,
          matchedGeoValue: geoMatch.matchValue,
          matchScore,
          wasExclusive: client.is_exclusive,
          reasons: [...sicMatch.reasons, ...geoMatch.reasons],
        })
      }
    }

    return matches
  }

  /**
   * Check if client is at any cap limit
   */
  private isClientAtCap(client: ClientProfile): boolean {
    if (client.daily_lead_cap && client.daily_lead_count >= client.daily_lead_cap) {
      return true
    }
    if (client.weekly_lead_cap && client.weekly_lead_count >= client.weekly_lead_cap) {
      return true
    }
    if (client.monthly_lead_cap && client.monthly_lead_count >= client.monthly_lead_cap) {
      return true
    }
    if (client.total_lead_cap && client.total_lead_count >= client.total_lead_cap) {
      return true
    }
    return false
  }

  /**
   * Check if lead passes client's quality filters
   */
  private passesQualityFilters(lead: LeadData, client: ClientProfile): boolean {
    if (client.require_email && !lead.email) {
      return false
    }
    if (client.require_phone && !lead.phone) {
      return false
    }
    if (client.require_company && !lead.company_name && (!lead.companies || lead.companies.length === 0)) {
      return false
    }
    if (client.min_quality_score && lead.financial_power && lead.financial_power < client.min_quality_score) {
      return false
    }
    return true
  }

  /**
   * Check if lead's domain is in client's exclusion list
   */
  private isExcludedDomain(lead: LeadData, client: ClientProfile): boolean {
    if (!client.excluded_domains || client.excluded_domains.length === 0) {
      return false
    }
    if (lead.company_domain) {
      const domain = lead.company_domain.toLowerCase()
      return client.excluded_domains.some((d) => domain.includes(d.toLowerCase()))
    }
    if (lead.email) {
      const emailDomain = lead.email.split('@')[1]?.toLowerCase()
      if (emailDomain) {
        return client.excluded_domains.some((d) => emailDomain.includes(d.toLowerCase()))
      }
    }
    return false
  }

  /**
   * Check if any of the lead's SIC codes match client targeting
   */
  private checkSicMatch(
    sicCodes: string[],
    client: ClientProfile
  ): { matched: boolean; matchedCodes: string[]; reasons: string[] } {
    const matchedCodes: string[] = []
    const reasons: string[] = []

    // If client has no SIC targeting, consider it a match (geo-only targeting)
    if (
      (!client.target_sic_codes || client.target_sic_codes.length === 0) &&
      (!client.target_sic_prefix || client.target_sic_prefix.length === 0) &&
      (!client.target_industry_categories || client.target_industry_categories.length === 0)
    ) {
      return { matched: true, matchedCodes: [], reasons: ['No industry targeting (matches all)'] }
    }

    for (const sic of sicCodes) {
      // Check exact match
      if (client.target_sic_codes?.includes(sic)) {
        matchedCodes.push(sic)
        reasons.push(`Exact SIC match: ${sic}`)
        continue
      }

      // Check prefix match
      for (const prefix of client.target_sic_prefix || []) {
        if (sic.startsWith(prefix)) {
          matchedCodes.push(sic)
          reasons.push(`SIC prefix match: ${sic} starts with ${prefix}`)
          break
        }
      }
    }

    // TODO: Add industry category matching via database lookup

    return {
      matched: matchedCodes.length > 0,
      matchedCodes,
      reasons,
    }
  }

  /**
   * Check if lead's location matches client's geo targeting
   */
  private async checkGeoMatch(
    lead: LeadData,
    client: ClientProfile
  ): Promise<{ matched: boolean; matchType: string | null; matchValue: string | null; reasons: string[] }> {
    const reasons: string[] = []

    // If client has no geo targeting, consider it a match (industry-only targeting)
    if (
      (!client.target_states || client.target_states.length === 0) &&
      (!client.target_cities || client.target_cities.length === 0) &&
      (!client.target_zips || client.target_zips.length === 0) &&
      (!client.target_zip_prefixes || client.target_zip_prefixes.length === 0) &&
      (!client.target_dmas || client.target_dmas.length === 0) &&
      (!client.target_counties || client.target_counties.length === 0) &&
      !client.target_radius_miles
    ) {
      return { matched: true, matchType: null, matchValue: null, reasons: ['No geo targeting (matches all)'] }
    }

    const leadState = lead.state_code || lead.state
    const leadCity = lead.city
    const leadZip = lead.postal_code

    // Check state match
    if (leadState && client.target_states?.length) {
      if (client.target_states.includes(leadState.toUpperCase())) {
        return {
          matched: true,
          matchType: 'state',
          matchValue: leadState,
          reasons: [`State match: ${leadState}`],
        }
      }
    }

    // Check city match
    if (leadCity && client.target_cities?.length) {
      const cityLower = leadCity.toLowerCase()
      if (client.target_cities.some((c) => c.toLowerCase() === cityLower)) {
        return {
          matched: true,
          matchType: 'city',
          matchValue: leadCity,
          reasons: [`City match: ${leadCity}`],
        }
      }
    }

    // Check exact zip match
    if (leadZip && client.target_zips?.length) {
      if (client.target_zips.includes(leadZip)) {
        return {
          matched: true,
          matchType: 'zip',
          matchValue: leadZip,
          reasons: [`Zip match: ${leadZip}`],
        }
      }
    }

    // Check zip prefix match
    if (leadZip && client.target_zip_prefixes?.length) {
      for (const prefix of client.target_zip_prefixes) {
        if (leadZip.startsWith(prefix)) {
          return {
            matched: true,
            matchType: 'zip_prefix',
            matchValue: prefix,
            reasons: [`Zip prefix match: ${leadZip} starts with ${prefix}`],
          }
        }
      }
    }

    // Check DMA match
    if (lead.dma && client.target_dmas?.length) {
      if (client.target_dmas.includes(lead.dma)) {
        return {
          matched: true,
          matchType: 'dma',
          matchValue: String(lead.dma),
          reasons: [`DMA match: ${lead.dma}`],
        }
      }
    }

    // Check county match
    if (lead.county_name && client.target_counties?.length) {
      const countyLower = lead.county_name.toLowerCase()
      if (client.target_counties.some((c) => c.toLowerCase() === countyLower)) {
        return {
          matched: true,
          matchType: 'county',
          matchValue: lead.county_name,
          reasons: [`County match: ${lead.county_name}`],
        }
      }
    }

    // Check radius match
    if (
      client.target_radius_miles &&
      client.target_radius_center_lat &&
      client.target_radius_center_lng &&
      lead.latitude &&
      lead.longitude
    ) {
      const distance = this.calculateDistance(
        lead.latitude,
        lead.longitude,
        client.target_radius_center_lat,
        client.target_radius_center_lng
      )

      if (distance <= client.target_radius_miles) {
        return {
          matched: true,
          matchType: 'radius',
          matchValue: `${distance.toFixed(1)} miles`,
          reasons: [`Radius match: ${distance.toFixed(1)} miles from center`],
        }
      }
    }

    return { matched: false, matchType: null, matchValue: null, reasons: ['No geo match'] }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  /**
   * Calculate a match score for ranking
   */
  private calculateMatchScore(
    sicMatch: { matched: boolean; matchedCodes: string[] },
    geoMatch: { matched: boolean; matchType: string | null },
    client: ClientProfile
  ): number {
    let score = 0

    // SIC match scoring
    score += sicMatch.matchedCodes.length * 10

    // Geo match scoring (more specific = higher score)
    if (geoMatch.matchType === 'zip') score += 50
    else if (geoMatch.matchType === 'city') score += 40
    else if (geoMatch.matchType === 'radius') score += 30
    else if (geoMatch.matchType === 'county') score += 20
    else if (geoMatch.matchType === 'dma') score += 15
    else if (geoMatch.matchType === 'state') score += 10
    else if (geoMatch.matchType === 'zip_prefix') score += 25

    // Priority boost (lower priority number = higher score)
    score += Math.max(0, 100 - client.routing_priority)

    return score
  }

  /**
   * Sort matches by priority (lower priority number = higher ranking)
   */
  private sortByPriority(matches: MatchResult[]): MatchResult[] {
    return [...matches].sort((a, b) => b.matchScore - a.matchScore)
  }

  /**
   * Apply exclusivity rules - if an exclusive client matches, only they get the lead
   */
  private applyExclusivity(matches: MatchResult[]): MatchResult[] {
    // Find first exclusive client
    const exclusiveMatch = matches.find((m) => m.wasExclusive)

    if (exclusiveMatch) {
      return [exclusiveMatch]
    }

    // If no exclusive, return all matches (can be configured to limit)
    return matches
  }

  /**
   * Determine why a lead is unroutable
   */
  private determineUnroutableReason(
    lead: LeadData,
    sicCodes: string[],
    clients: ClientProfile[]
  ): { reason: string; details: string } {
    if (sicCodes.length === 0 && (!lead.companies || lead.companies.length === 0)) {
      return {
        reason: 'no_sic',
        details: 'Lead has no company associations or SIC codes',
      }
    }

    const leadState = lead.state_code || lead.state
    const leadCity = lead.city
    const leadZip = lead.postal_code

    if (!leadState && !leadCity && !leadZip && !lead.latitude) {
      return {
        reason: 'no_geo',
        details: 'Lead has no location data (state, city, zip, or coordinates)',
      }
    }

    // Check if all clients are at cap
    const activeClients = clients.filter((c) => !this.isClientAtCap(c))
    if (activeClients.length === 0 && clients.length > 0) {
      return {
        reason: 'all_clients_capped',
        details: `All ${clients.length} active clients have reached their lead caps`,
      }
    }

    return {
      reason: 'no_matching_client',
      details: `No client profiles match the lead's criteria (SIC: ${sicCodes.join(', ') || 'none'}, Location: ${leadState || leadCity || leadZip || 'none'})`,
    }
  }

  /**
   * Create an unroutable lead record
   */
  private async createUnroutableRecord(
    lead: LeadData,
    reason: string,
    details: string,
    sicCodes: string[],
    clients: ClientProfile[]
  ): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.from('unroutable_leads').upsert(
      {
        workspace_id: this.workspaceId,
        lead_id: lead.id,
        reason,
        reason_details: details,
        lead_sic_codes: sicCodes,
        lead_city: lead.city,
        lead_state: lead.state_code || lead.state,
        lead_zip: lead.postal_code,
        lead_quality_score: lead.financial_power,
        considered_client_ids: clients.map((c) => c.id),
        rejection_reasons: {},
        status: 'unprocessed',
      },
      { onConflict: 'lead_id' }
    )

    if (error) {
      console.error('Failed to create unroutable record:', error)
    }
  }

  /**
   * Create a lead assignment
   */
  private async createAssignment(leadId: string, match: MatchResult): Promise<void> {
    const supabase = await createClient()

    // Create assignment
    const { error: assignError } = await supabase.from('lead_assignments').insert({
      workspace_id: this.workspaceId,
      lead_id: leadId,
      client_profile_id: match.clientId,
      matched_sic_codes: match.matchedSicCodes,
      matched_geo_type: match.matchedGeoType,
      matched_geo_value: match.matchedGeoValue,
      match_score: match.matchScore,
      was_exclusive: match.wasExclusive,
      assignment_reason: match.reasons.join('; '),
      status: 'pending',
    })

    if (assignError) {
      console.error('Failed to create assignment:', assignError)
      return
    }

    // Increment client's lead count
    const { error: countError } = await supabase.rpc('increment_client_lead_count', {
      p_client_id: match.clientId,
    })

    if (countError) {
      console.error('Failed to increment lead count:', countError)
    }
  }

  /**
   * Log routing decision for audit
   */
  private async logRoutingDecision(
    leadId: string,
    allMatches: MatchResult[],
    selectedMatches: MatchResult[]
  ): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.from('routing_audit_log').insert({
      workspace_id: this.workspaceId,
      lead_id: leadId,
      action: 'matched',
      matched_clients: allMatches.map((m) => ({
        client_id: m.clientId,
        score: m.matchScore,
        reasons: m.reasons,
      })),
      selected_client_id: selectedMatches[0]?.clientId || null,
      selection_reason:
        selectedMatches.length > 0
          ? `Selected ${selectedMatches.length} client(s) based on priority and exclusivity`
          : 'No clients selected',
    })

    if (error) {
      console.error('Failed to log routing decision:', error)
    }
  }

  /**
   * Re-route an unroutable lead (after new clients onboard)
   */
  async retryUnroutableLeads(limit = 100): Promise<number> {
    const supabase = await createClient()

    // Get unroutable leads that haven't been retried recently
    const { data: unroutable, error } = await supabase
      .from('unroutable_leads')
      .select('lead_id')
      .eq('workspace_id', this.workspaceId)
      .eq('status', 'unprocessed')
      .or('next_retry_at.is.null,next_retry_at.lte.now()')
      .limit(limit)

    if (error || !unroutable) {
      return 0
    }

    let routedCount = 0

    for (const record of unroutable) {
      const result = await this.routeLead(record.lead_id)

      if (result.matched) {
        // Remove from unroutable
        await supabase.from('unroutable_leads').delete().eq('lead_id', record.lead_id)
        routedCount++
      } else {
        // Update retry count
        await supabase
          .from('unroutable_leads')
          .update({
            retry_count: supabase.rpc('increment', { x: 1 }),
            last_retry_at: new Date().toISOString(),
            next_retry_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Try again in 24h
          })
          .eq('lead_id', record.lead_id)
      }
    }

    return routedCount
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createMatchingEngine(workspaceId: string): MatchingEngineService {
  return new MatchingEngineService(workspaceId)
}
