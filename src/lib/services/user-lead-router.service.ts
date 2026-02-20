/**
 * User Lead Router Service
 *
 * Routes incoming leads to users based on their targeting preferences.
 * This is for the self-service tier where users receive leads that match
 * their industry + location criteria.
 *
 * Flow:
 * 1. Lead comes in (from DataShopper pixel, upload, etc.)
 * 2. Find all users with matching targeting preferences
 * 3. Check daily/weekly/monthly caps
 * 4. Create assignments and send notifications
 */

import { createClient } from '@/lib/supabase/server'
import { notifyUserNewLead } from '@/lib/notifications/lead-notification'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { Lead } from '@/types'

interface MatchedUser {
  userId: string
  userEmail: string
  userName: string | null
  matchedIndustry: string | null
  matchedSic: string | null
  matchedGeo: string | null
  emailNotifications: boolean
}

interface RoutingResult {
  leadId: string
  matched: boolean
  assignedTo: string[]
  notificationsSent: number
}

export class UserLeadRouterService {
  private workspaceId: string

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
  }

  /**
   * Route a lead to matching users
   */
  async routeLead(leadId: string): Promise<RoutingResult> {
    const supabase = await createClient()

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        lead_companies (sic_code, sic_description, company_name)
      `)
      .eq('id', leadId)
      .eq('workspace_id', this.workspaceId)
      .maybeSingle()

    if (leadError || !lead) {
      safeError('Lead not found:', leadId)
      return { leadId, matched: false, assignedTo: [], notificationsSent: 0 }
    }

    // Find matching users
    const matchingUsers = await this.findMatchingUsers(lead)

    if (matchingUsers.length === 0) {
      return { leadId, matched: false, assignedTo: [], notificationsSent: 0 }
    }

    const assignedTo: string[] = []
    let notificationsSent = 0

    // Create assignments and send notifications
    for (const user of matchingUsers) {
      try {
        // Create assignment
        const { error: assignError } = await supabase
          .from('user_lead_assignments')
          .insert({
            workspace_id: this.workspaceId,
            lead_id: leadId,
            user_id: user.userId,
            matched_industry: user.matchedIndustry,
            matched_sic_code: user.matchedSic,
            matched_geo: user.matchedGeo,
            source: 'auto_route',
            status: 'new',
          })

        if (assignError) {
          // Likely duplicate - skip
          if (assignError.code === '23505') continue
          safeError('Failed to create assignment:', assignError)
          continue
        }

        // Increment user's lead count
        await this.incrementUserLeadCount(user.userId)

        assignedTo.push(user.userEmail)

        // Send notification if enabled
        if (user.emailNotifications) {
          try {
            await notifyUserNewLead({
              email: user.userEmail,
              name: user.userName,
            }, lead as Lead)
            notificationsSent++

            // Mark notification as sent
            await supabase
              .from('user_lead_assignments')
              .update({
                notification_sent: true,
                notification_sent_at: new Date().toISOString(),
              })
              .eq('lead_id', leadId)
              .eq('user_id', user.userId)
          } catch (notifError) {
            safeError('Failed to send notification:', notifError)
          }
        }
      } catch (err) {
        safeError('Error processing user assignment:', err)
      }
    }

    return {
      leadId,
      matched: assignedTo.length > 0,
      assignedTo,
      notificationsSent,
    }
  }

  /**
   * Find users whose targeting matches the lead
   */
  private async findMatchingUsers(lead: any): Promise<MatchedUser[]> {
    const supabase = await createClient()

    // Get lead's location
    const leadState = lead.state_code || lead.state
    const leadCity = lead.city
    const leadZip = lead.postal_code

    // Get lead's industry/SIC
    const leadIndustry = lead.company_industry
    const leadSicCode = lead.lead_companies?.[0]?.sic_code

    // Find users with matching targeting
    const { data: users, error } = await supabase
      .from('user_targeting')
      .select(`
        user_id,
        target_industries,
        target_sic_codes,
        target_states,
        target_cities,
        target_zips,
        daily_lead_cap,
        daily_lead_count,
        weekly_lead_cap,
        weekly_lead_count,
        monthly_lead_cap,
        monthly_lead_count,
        email_notifications,
        users (
          id,
          email,
          full_name
        )
      `)
      .eq('workspace_id', this.workspaceId)
      .eq('is_active', true)

    if (error || !users) {
      safeError('Failed to get user targeting:', error)
      return []
    }

    const matchedUsers: MatchedUser[] = []

    for (const ut of users) {
      // Check caps
      if (ut.daily_lead_cap && ut.daily_lead_count >= ut.daily_lead_cap) continue
      if (ut.weekly_lead_cap && ut.weekly_lead_count >= ut.weekly_lead_cap) continue
      if (ut.monthly_lead_cap && ut.monthly_lead_count >= ut.monthly_lead_cap) continue

      // Check geo match
      let matchedGeo: string | null = null
      const hasGeoTargeting =
        (ut.target_states && ut.target_states.length > 0) ||
        (ut.target_cities && ut.target_cities.length > 0) ||
        (ut.target_zips && ut.target_zips.length > 0)

      if (hasGeoTargeting) {
        if (leadState && ut.target_states?.includes(leadState)) {
          matchedGeo = leadState
        } else if (leadCity && ut.target_cities?.some((c: string) => c.toLowerCase() === (leadCity || '').toLowerCase())) {
          matchedGeo = leadCity
        } else if (leadZip && ut.target_zips?.includes(leadZip)) {
          matchedGeo = leadZip
        } else {
          // No geo match
          continue
        }
      }

      // Check industry match
      let matchedIndustry: string | null = null
      let matchedSic: string | null = null
      const hasIndustryTargeting =
        (ut.target_industries && ut.target_industries.length > 0) ||
        (ut.target_sic_codes && ut.target_sic_codes.length > 0)

      if (hasIndustryTargeting) {
        if (leadIndustry && ut.target_industries?.includes(leadIndustry)) {
          matchedIndustry = leadIndustry
        } else if (leadSicCode && ut.target_sic_codes?.includes(leadSicCode)) {
          matchedSic = leadSicCode
        } else if (leadSicCode) {
          // Check SIC prefix match
          const prefix = leadSicCode.slice(0, 2)
          if (ut.target_sic_codes?.some((sic: string) => sic.startsWith(prefix) || leadSicCode.startsWith(sic))) {
            matchedSic = leadSicCode
          } else {
            continue
          }
        } else {
          continue
        }
      }

      // If no targeting set, don't match (user hasn't configured preferences)
      if (!hasGeoTargeting && !hasIndustryTargeting) {
        continue
      }

      // User matches!
      const userData = (ut.users as any)?.[0] as { id: string; email: string; full_name: string | null } | undefined
      if (!userData?.email) {
        safeError('[UserLeadRouter] User data missing email:', ut.user_id)
        continue
      }

      matchedUsers.push({
        userId: ut.user_id,
        userEmail: userData.email,
        userName: userData.full_name,
        matchedIndustry,
        matchedSic,
        matchedGeo,
        emailNotifications: ut.email_notifications,
      })
    }

    return matchedUsers
  }

  /**
   * Increment user's lead counts (using safe read-modify-write pattern)
   */
  private async incrementUserLeadCount(userId: string): Promise<void> {
    const supabase = await createClient()

    // Get current counts
    const { data: current, error: fetchError } = await supabase
      .from('user_targeting')
      .select('daily_lead_count, weekly_lead_count, monthly_lead_count')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError || !current) {
      safeError('[UserLeadRouter] Failed to fetch targeting for count increment:', fetchError)
      return
    }

    // Increment
    const { error: updateError } = await supabase
      .from('user_targeting')
      .update({
        daily_lead_count: (current.daily_lead_count || 0) + 1,
        weekly_lead_count: (current.weekly_lead_count || 0) + 1,
        monthly_lead_count: (current.monthly_lead_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      safeError('[UserLeadRouter] Failed to increment lead counts:', updateError)
    }
  }

  /**
   * Get user's assigned leads
   */
  async getUserLeads(userId: string, options?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<{ leads: any[]; total: number }> {
    const supabase = await createClient()

    let query = supabase
      .from('user_lead_assignments')
      .select(`
        *,
        leads (
          id,
          first_name,
          last_name,
          full_name,
          email,
          phone,
          company_name,
          job_title,
          city,
          state,
          state_code,
          company_industry,
          created_at
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .eq('workspace_id', this.workspaceId)
      .order('assigned_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit || 10) - 1)
    }

    const { data, count, error } = await query

    if (error) {
      safeError('Failed to get user leads:', error)
      return { leads: [], total: 0 }
    }

    return {
      leads: data || [],
      total: count || 0,
    }
  }

  /**
   * Mark a lead as viewed
   */
  async markLeadViewed(userId: string, leadId: string): Promise<void> {
    const supabase = await createClient()

    await supabase
      .from('user_lead_assignments')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('lead_id', leadId)
      .eq('status', 'new')
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(
    userId: string,
    leadId: string,
    status: 'new' | 'viewed' | 'contacted' | 'converted' | 'archived',
    notes?: string
  ): Promise<void> {
    const supabase = await createClient()

    const update: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'viewed' && !update.viewed_at) {
      update.viewed_at = new Date().toISOString()
    }
    if (status === 'contacted') {
      update.contacted_at = new Date().toISOString()
    }
    if (status === 'converted') {
      update.converted_at = new Date().toISOString()
    }
    if (notes) {
      update.user_notes = notes
    }

    await supabase
      .from('user_lead_assignments')
      .update(update)
      .eq('user_id', userId)
      .eq('lead_id', leadId)
  }
}

// Factory function
export function createUserLeadRouter(workspaceId: string): UserLeadRouterService {
  return new UserLeadRouterService(workspaceId)
}
