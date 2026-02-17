/**
 * Daily Lead Distribution Job
 *
 * Runs every day at 8am CT to distribute leads to active users.
 * Sends email notifications and syncs to GHL for users with CRM enabled.
 * Uses admin client (service role) since this runs server-side with no cookies.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchLeadsFromSegment, type AudienceLabLead } from '@/lib/services/audiencelab.service'
import { syncLeadsToGHL } from '@/lib/services/ghl.service'
import { sendEmail } from '@/lib/email/service'

/**
 * Score a lead based on data completeness.
 * Leads with name + email + company are highest quality.
 */
function scoreLeadQuality(lead: AudienceLabLead): number {
  let score = 0
  if (lead.FIRST_NAME) score += 20
  if (lead.LAST_NAME) score += 20
  if (lead.BUSINESS_VERIFIED_EMAILS?.[0] || lead.BUSINESS_EMAIL || lead.PERSONAL_VERIFIED_EMAILS?.[0]) score += 25
  if (lead.COMPANY_NAME) score += 20
  if (lead.JOB_TITLE || lead.HEADLINE) score += 10
  if (lead.MOBILE_PHONE || lead.DIRECT_NUMBER || lead.PERSONAL_PHONE) score += 5
  return score
}

export const distributeDailyLeads = inngest.createFunction(
  {
    id: 'distribute-daily-leads',
    name: 'Distribute Daily Leads',
    retries: 3,
  },
  { cron: '0 13 * * *' }, // 8am Central = 1pm UTC
  async ({ event, step }) => {
    // Use admin client — this runs server-side with no cookies
    const supabase = createAdminClient()

    // Step 1: Fetch all active users
    const users = await step.run('fetch-active-users', async () => {
      console.log('[DailyLeads] Fetching active users...')

      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, workspace_id, plan, daily_lead_limit, industry_segment, location_segment, ghl_sub_account_id')
        .eq('is_active', true)
        .not('workspace_id', 'is', null)

      if (error) {
        console.error('[DailyLeads] Failed to fetch users:', error)
        throw new Error(`Failed to fetch users: ${error.message}`)
      }

      console.log('[DailyLeads] Found active users:', data.length)
      return data
    })

    if (!users || users.length === 0) {
      console.log('[DailyLeads] No active users found')
      return { processed: 0, success: 0, failed: 0 }
    }

    // Step 2: Process each user
    let successCount = 0
    let failedCount = 0

    for (const user of users) {
      try {
        await step.run(`distribute-leads-${user.id}`, async () => {
          console.log('[DailyLeads] Processing user:', {
            id: user.id,
            email: user.email,
            plan: user.plan,
          })

          // Skip users without industry/location configured
          if (!user.industry_segment || !user.location_segment) {
            console.warn('[DailyLeads] User missing segment data:', user.id)
            return
          }

          // Determine daily lead limit based on plan
          const dailyLimit = user.daily_lead_limit || (user.plan === 'free' ? 10 : 100)

          // Check if user already received their full daily allocation today
          const today = new Date().toISOString().split('T')[0]
          const { count: todayCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', user.workspace_id)
            .gte('delivered_at', `${today}T00:00:00`)
            .lte('delivered_at', `${today}T23:59:59`)

          if (todayCount && todayCount >= dailyLimit) {
            console.log('[DailyLeads] User already received daily limit today:', {
              userId: user.id,
              todayCount,
              dailyLimit,
            })
            return
          }

          const remainingForToday = dailyLimit - (todayCount || 0)

          // Look up the real audience segment from DB (industry + location → segment_id)
          const { data: segmentMapping, error: mappingError } = await supabase
            .from('audience_lab_segments')
            .select('segment_id, segment_name')
            .eq('industry', user.industry_segment)
            .eq('location', user.location_segment)
            .single()

          if (mappingError || !segmentMapping) {
            console.warn('[DailyLeads] No audience mapping for user:', {
              userId: user.id,
              industry: user.industry_segment,
              location: user.location_segment,
            })
            return
          }

          // Fetch more leads than needed so we can filter by quality
          const fetchSize = Math.min(remainingForToday * 3, 300)
          const rawLeads = await fetchLeadsFromSegment(segmentMapping.segment_id, {
            page: 1,
            pageSize: fetchSize,
          })

          if (rawLeads.length === 0) {
            console.log('[DailyLeads] No new leads for user:', user.id)
            return
          }

          // Score and sort leads by quality — prioritize leads with name + email + company
          const scoredLeads = rawLeads
            .map((lead: AudienceLabLead) => ({ lead, score: scoreLeadQuality(lead) }))
            .sort((a: { score: number }, b: { score: number }) => b.score - a.score)

          // Only take leads that have at minimum a name and either email or company (score >= 40)
          const qualityLeads = scoredLeads
            .filter((s: { score: number }) => s.score >= 40)
            .slice(0, remainingForToday)
            .map((s: { lead: AudienceLabLead }) => s.lead)

          if (qualityLeads.length === 0) {
            console.log('[DailyLeads] No quality leads for user:', user.id)
            return
          }

          const leads = qualityLeads

          console.log('[DailyLeads] Selected quality leads:', {
            userId: user.id,
            fetched: rawLeads.length,
            qualified: leads.length,
          })

          // Dedup: check for existing leads with same email in this workspace
          const leadEmails = leads
            .map((l: AudienceLabLead) => l.BUSINESS_VERIFIED_EMAILS?.[0] || l.BUSINESS_EMAIL || l.PERSONAL_VERIFIED_EMAILS?.[0])
            .filter(Boolean)

          let existingEmails = new Set<string>()
          if (leadEmails.length > 0) {
            const { data: existing } = await supabase
              .from('leads')
              .select('email')
              .eq('workspace_id', user.workspace_id)
              .in('email', leadEmails)

            existingEmails = new Set((existing || []).map(e => e.email).filter(Boolean))
          }

          // Save leads to database (map UPPERCASE fields to lowercase)
          const leadsToInsert = leads
            .map((lead: AudienceLabLead) => {
              const email = lead.BUSINESS_VERIFIED_EMAILS?.[0] || lead.BUSINESS_EMAIL || lead.PERSONAL_VERIFIED_EMAILS?.[0] || null
              // Skip duplicate emails
              if (email && existingEmails.has(email)) return null
              return {
                workspace_id: user.workspace_id,
                first_name: lead.FIRST_NAME || null,
                last_name: lead.LAST_NAME || null,
                full_name: `${lead.FIRST_NAME || ''} ${lead.LAST_NAME || ''}`.trim() || null,
                email,
                phone: lead.MOBILE_PHONE || lead.DIRECT_NUMBER || lead.PERSONAL_PHONE || lead.COMPANY_PHONE || null,
                company_name: lead.COMPANY_NAME || null,
                company_domain: lead.COMPANY_DOMAIN || null,
                job_title: lead.JOB_TITLE || lead.HEADLINE || null,
                city: lead.PERSONAL_CITY || lead.COMPANY_CITY || null,
                state: lead.PERSONAL_STATE || lead.COMPANY_STATE || null,
                linkedin_url: lead.LINKEDIN_URL as string || null,
                source: 'audience_labs_daily',
                status: 'new',
                enrichment_status: 'pending',
                delivered_at: new Date().toISOString(),
                metadata: {
                  zip: lead.COMPANY_ZIP || lead.PERSONAL_ZIP,
                  industry: lead.COMPANY_INDUSTRY,
                  employee_count: lead.COMPANY_EMPLOYEE_COUNT,
                  revenue: lead.COMPANY_REVENUE,
                  company_linkedin: lead.COMPANY_LINKEDIN_URL,
                  uuid: lead.UUID,
                },
              }
            })
            .filter(Boolean)

          if (leadsToInsert.length === 0) {
            console.log('[DailyLeads] All leads were duplicates for user:', user.id)
            return
          }

          const { error: insertError } = await supabase
            .from('leads')
            .insert(leadsToInsert)

          if (insertError) {
            console.error('[DailyLeads] Failed to insert leads:', insertError)
            throw new Error(`Failed to insert leads: ${insertError.message}`)
          }

          console.log('[DailyLeads] Leads saved to database:', {
            userId: user.id,
            count: leadsToInsert.length,
          })

          // Send email notification
          await step.run(`send-notification-${user.id}`, async () => {
            const firstName = user.full_name?.split(' ')[0] || 'there'
            const dashboardUrl = 'https://leads.meetcursive.com/leads'
            const previewLeads = leads.slice(0, 3)
            const previewList = previewLeads
              .map((l: AudienceLabLead) => `<li style="padding:6px 0;border-bottom:1px solid #f0f0f0;">${[l.FIRST_NAME, l.LAST_NAME].filter(Boolean).join(' ') || 'New Lead'}${l.COMPANY_NAME ? ` · <span style="color:#6b7280">${l.COMPANY_NAME}</span>` : ''}</li>`)
              .join('')

            await sendEmail({
              to: user.email,
              subject: `${leads.length} new lead${leads.length === 1 ? '' : 's'} delivered — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
              html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;padding:0;margin:0;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#007AFF,#0056CC);padding:28px 32px;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">${leads.length} fresh lead${leads.length === 1 ? '' : 's'} ready, ${firstName}!</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Your daily batch just landed — scored, verified, and waiting for you.</p>
  </div>
  <div style="padding:24px 32px;">
    ${previewLeads.length > 0 ? `
    <p style="font-size:13px;color:#6b7280;margin:0 0 10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Today's leads include</p>
    <ul style="list-style:none;margin:0 0 20px;padding:0;font-size:14px;color:#374151;">
      ${previewList}
      ${leads.length > 3 ? `<li style="padding:6px 0;color:#007AFF;font-size:13px;">+ ${leads.length - 3} more lead${leads.length - 3 === 1 ? '' : 's'}...</li>` : ''}
    </ul>
    ` : ''}
    <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#007AFF,#0056CC);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">View My Leads</a>
    <p style="font-size:12px;color:#9ca3af;margin:20px 0 0;">Each lead can be enriched with phone, email, and LinkedIn for 1 credit.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">You receive ${leads.length} leads daily based on your industry and location targeting.</p>
    <p style="font-size:12px;color:#9ca3af;margin:4px 0 0;"><a href="https://leads.meetcursive.com/my-leads/preferences" style="color:#007AFF;">Update preferences</a> · <a href="https://leads.meetcursive.com/activate" style="color:#007AFF;">Activate a campaign</a></p>
  </div>
</div>
</body>
</html>`,
              text: `${leads.length} fresh leads delivered, ${firstName}!\n\nView them at: ${dashboardUrl}\n\n${previewLeads.map((l: AudienceLabLead) => `- ${[l.FIRST_NAME, l.LAST_NAME].filter(Boolean).join(' ')}${l.COMPANY_NAME ? ` (${l.COMPANY_NAME})` : ''}`).join('\n')}\n\nEach lead can be enriched with full contact details for 1 credit.`,
              tags: [{ name: 'type', value: 'daily-leads' }],
            })

            console.log('[DailyLeads] Email sent to:', user.email)
          })

          // Sync to GHL if user has CRM enabled
          if (user.ghl_sub_account_id) {
            await step.run(`sync-to-ghl-${user.id}`, async () => {
              const ghlLeads = leads.map((lead: AudienceLabLead) => ({
                firstName: lead.FIRST_NAME,
                lastName: lead.LAST_NAME,
                email: lead.BUSINESS_VERIFIED_EMAILS?.[0] || lead.BUSINESS_EMAIL,
                phone: lead.MOBILE_PHONE || lead.DIRECT_NUMBER,
                companyName: lead.COMPANY_NAME,
                title: lead.JOB_TITLE || lead.HEADLINE,
              }))

              const synced = await syncLeadsToGHL(
                user.ghl_sub_account_id!,
                ghlLeads,
                ['cursive-daily-lead', user.industry_segment]
              )

              console.log('[DailyLeads] Synced to GHL:', {
                userId: user.id,
                synced,
                total: ghlLeads.length,
              })
            })
          }

          successCount++
        })
      } catch (error) {
        console.error('[DailyLeads] Failed to process user:', {
          userId: user.id,
          error,
        })
        failedCount++
      }
    }

    console.log('[DailyLeads] Distribution complete:', {
      total: users.length,
      success: successCount,
      failed: failedCount,
    })

    return {
      processed: users.length,
      success: successCount,
      failed: failedCount,
    }
  }
)
