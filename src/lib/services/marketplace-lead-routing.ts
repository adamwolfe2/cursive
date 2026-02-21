/**
 * Marketplace Lead Routing Service
 *
 * Routes marketplace leads (workspace_id=null) to matching users across ALL
 * workspaces based on user_targeting preferences (industry, geo, caps).
 *
 * Called after admin bulk upload or partner upload creates marketplace leads.
 * The same lead can be routed to multiple users across different workspaces
 * while remaining listed on the marketplace.
 *
 * Key difference from edge-processor routing: that routes within ONE workspace
 * (the pixel owner's). This routes across ALL workspaces since marketplace
 * leads are platform-wide.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { notifyNewLead, type LeadNotification } from '@/lib/services/lead-notifications.service'
import { notifyUserNewLead } from '@/lib/notifications/lead-notification'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[Marketplace Routing]'

// Max notifications per routing batch to avoid Edge timeout
const MAX_SLACK_PER_WORKSPACE = 5
const MAX_EMAIL_TOTAL = 20

interface RoutingOptions {
  source?: string
}

interface RoutingResult {
  routed: number
  notified: number
}

/**
 * Route marketplace leads to matching users across all workspaces.
 *
 * For each lead, finds users whose user_targeting preferences match
 * (industry + geo), respects daily/weekly/monthly caps, creates
 * user_lead_assignments, and sends notifications.
 */
export async function routeLeadsToMatchingUsers(
  leadIds: string[],
  options?: RoutingOptions
): Promise<RoutingResult> {
  const result: RoutingResult = { routed: 0, notified: 0 }

  if (leadIds.length === 0) return result

  const source = options?.source || 'marketplace'
  const adminClient = createAdminClient()

  try {
    // Step 1: Fetch all leads by IDs
    const { data: leads, error: leadsError } = await adminClient
      .from('leads')
      .select('id, first_name, last_name, full_name, email, phone, company_name, company_industry, job_title, city, state, state_code, postal_code, intent_score_calculated')
      .in('id', leadIds)

    if (leadsError || !leads?.length) {
      safeError(`${LOG_PREFIX} Failed to fetch leads:`, leadsError?.message)
      return result
    }

    // Step 2: Fetch ALL active user_targeting across ALL workspaces
    const { data: targetingUsers, error: targetingError } = await adminClient
      .from('user_targeting')
      .select(`
        user_id,
        workspace_id,
        target_industries,
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
        users!inner (id, email, full_name)
      `)
      .eq('is_active', true)

    if (targetingError || !targetingUsers?.length) {
      safeLog(`${LOG_PREFIX} No active targeting users found`)
      return result
    }

    // Track caps in memory so multiple leads in the same batch respect caps
    const capTracker = new Map<string, { daily: number; weekly: number; monthly: number }>()
    for (const ut of targetingUsers) {
      capTracker.set(ut.user_id, {
        daily: ut.daily_lead_count || 0,
        weekly: ut.weekly_lead_count || 0,
        monthly: ut.monthly_lead_count || 0,
      })
    }

    // Collect notification data
    const workspaceLeadNotifs = new Map<string, LeadNotification[]>()
    const emailNotifs: Array<{
      user: { email: string; name: string | null }
      lead: typeof leads[0]
      matchInfo: { matchedIndustry?: string | null; matchedGeo?: string | null }
    }> = []

    // Step 3: Match each lead to each user targeting
    for (const lead of leads) {
      const leadState = lead.state_code || lead.state
      const leadIndustry = lead.company_industry

      for (const ut of targetingUsers) {
        const counts = capTracker.get(ut.user_id)
        if (!counts) {
          safeError(`${LOG_PREFIX} Missing cap tracker for user ${ut.user_id}`)
          continue
        }

        // Check caps
        if (ut.daily_lead_cap && counts.daily >= ut.daily_lead_cap) continue
        if (ut.weekly_lead_cap && counts.weekly >= ut.weekly_lead_cap) continue
        if (ut.monthly_lead_cap && counts.monthly >= ut.monthly_lead_cap) continue

        // Check geo match
        let matchedGeo: string | null = null
        const hasGeo =
          ((ut.target_states as string[] | null)?.length ?? 0) > 0 ||
          ((ut.target_cities as string[] | null)?.length ?? 0) > 0 ||
          ((ut.target_zips as string[] | null)?.length ?? 0) > 0

        if (hasGeo) {
          if (leadState && (ut.target_states as string[] | null)?.includes(leadState)) {
            matchedGeo = leadState
          } else if (lead.city && (ut.target_cities as string[] | null)?.some((c: string) => c.toLowerCase() === (lead.city || '').toLowerCase())) {
            matchedGeo = lead.city
          } else if (lead.postal_code && (ut.target_zips as string[] | null)?.includes(lead.postal_code)) {
            matchedGeo = lead.postal_code
          } else {
            continue // Has geo targeting but no match
          }
        }

        // Check industry match
        let matchedIndustry: string | null = null
        const hasIndustry = ((ut.target_industries as string[] | null)?.length ?? 0) > 0
        if (hasIndustry) {
          if (leadIndustry && (ut.target_industries as string[] | null)?.includes(leadIndustry)) {
            matchedIndustry = leadIndustry
          } else {
            continue // Has industry targeting but no match
          }
        }

        // Must have at least one targeting criterion
        if (!hasGeo && !hasIndustry) continue

        // Create user_lead_assignment
        const { error: assignErr } = await adminClient
          .from('user_lead_assignments')
          .insert({
            workspace_id: ut.workspace_id,
            lead_id: lead.id,
            user_id: ut.user_id,
            matched_industry: matchedIndustry,
            matched_geo: matchedGeo,
            source,
            status: 'new',
          } as any)

        if (assignErr) {
          if (assignErr.code === '23505') continue // Duplicate — already assigned
          safeError(`${LOG_PREFIX} Failed to assign lead ${lead.id} to user ${ut.user_id}:`, assignErr.message)
          continue
        }

        // Increment in-memory cap tracker
        counts.daily++
        counts.weekly++
        counts.monthly++

        result.routed++

        // Queue Slack/Zapier notification for this workspace
        if (!workspaceLeadNotifs.has(ut.workspace_id)) {
          workspaceLeadNotifs.set(ut.workspace_id, [])
        }
        const wsNotifs = workspaceLeadNotifs.get(ut.workspace_id)!
        // Only add if under the per-workspace cap and not already queued for this lead
        if (wsNotifs.length < MAX_SLACK_PER_WORKSPACE && !wsNotifs.some(n => n.lead_id === lead.id)) {
          wsNotifs.push({
            lead_id: lead.id,
            email: lead.email || undefined,
            first_name: lead.first_name || undefined,
            last_name: lead.last_name || undefined,
            company_name: lead.company_name || undefined,
            title: lead.job_title || undefined,
            phone: lead.phone || undefined,
            city: lead.city || undefined,
            state: lead.state || undefined,
            intent_score: lead.intent_score_calculated || undefined,
            source,
          })
        }

        // Queue email notification if enabled
        const userData = (ut.users as any)?.[0] as { id: string; email: string; full_name: string | null } | undefined
        if (ut.email_notifications && userData?.email && emailNotifs.length < MAX_EMAIL_TOTAL) {
          emailNotifs.push({
            user: { email: userData.email, name: userData.full_name },
            lead,
            matchInfo: { matchedIndustry, matchedGeo },
          })
        }
      }
    }

    // Step 4: Batch update lead counts in DB
    for (const ut of targetingUsers) {
      const counts = capTracker.get(ut.user_id)
      if (!counts) continue // Skip if missing from tracker

      const originalDaily = ut.daily_lead_count || 0
      if (counts.daily === originalDaily) continue // No change

      await adminClient
        .from('user_targeting')
        .update({
          daily_lead_count: counts.daily,
          weekly_lead_count: counts.weekly,
          monthly_lead_count: counts.monthly,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', ut.user_id)
        .eq('workspace_id', ut.workspace_id)
    }

    // Step 5: Send notifications (best-effort, never throws)
    const notifPromises: Promise<unknown>[] = []

    // Slack/Zapier notifications per workspace
    for (const [workspaceId, notifs] of workspaceLeadNotifs) {
      for (const notif of notifs) {
        notifPromises.push(
          notifyNewLead(workspaceId, notif).catch((err) => safeError('[LeadRouting] notifyNewLead failed:', err))
        )
      }
    }

    // Email notifications per user
    for (const notif of emailNotifs) {
      notifPromises.push(
        notifyUserNewLead(notif.user, notif.lead as any, notif.matchInfo)
          .then(r => { if (r.success) result.notified++ })
          .catch((err) => safeError('[LeadRouting] notifyUserNewLead failed:', err))
      )
    }

    await Promise.allSettled(notifPromises)

    safeLog(
      `${LOG_PREFIX} Routed ${result.routed} lead assignments across ${workspaceLeadNotifs.size} workspace(s), ` +
      `${result.notified} email notifications sent (source: ${source})`
    )
  } catch (error) {
    safeError(`${LOG_PREFIX} Error:`, error instanceof Error ? error.message : error)
  }

  return result
}
