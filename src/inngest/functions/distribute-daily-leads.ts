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
import { meetsQualityBar } from '@/lib/services/lead-quality.service'
import { checkWorkspaceDuplicates, logDedupRejections } from '@/lib/services/deduplication.service'

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
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, workspace_id, plan, daily_lead_limit, industry_segment, location_segment, ghl_sub_account_id')
        .eq('is_active', true)
        .not('workspace_id', 'is', null)

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`)
      }

      return data
    })

    if (!users || users.length === 0) {
      return { processed: 0, success: 0, failed: 0 }
    }

    // Step 2: Process each user
    let successCount = 0
    let failedCount = 0

    for (const user of users) {
      try {
        const result = await step.run(`distribute-leads-${user.id}`, async () => {
          // Skip users without industry/location configured
          if (!user.industry_segment || !user.location_segment) {
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
            return
          }

          const remainingForToday = dailyLimit - (todayCount || 0)

          // Look up the real audience segment from DB (industry + location → segment_id)
          const { data: segmentMapping, error: mappingError } = await supabase
            .from('audience_lab_segments')
            .select('segment_id, segment_name')
            .eq('industry', user.industry_segment)
            .eq('location', user.location_segment)
            .maybeSingle()

          if (mappingError || !segmentMapping) {
            return
          }

          // Fetch more leads than needed so we can filter by quality
          const fetchSize = Math.min(remainingForToday * 3, 300)
          const rawLeads = await fetchLeadsFromSegment(segmentMapping.segment_id, {
            page: 1,
            pageSize: fetchSize,
          })

          if (rawLeads.length === 0) {
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
            return
          }

          const leads = qualityLeads

          // Map leads to insert format first, then run dedup
          const mappedLeads = leads
            .map((lead: AudienceLabLead) => {
              const email = lead.BUSINESS_VERIFIED_EMAILS?.[0] || lead.BUSINESS_EMAIL || lead.PERSONAL_VERIFIED_EMAILS?.[0] || null
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
            .filter((lead) => meetsQualityBar(lead).passes)

          // Workspace-scoped dedup: checks email + name+company combos + intra-batch
          const duplicateIndices = await checkWorkspaceDuplicates(
            user.workspace_id!,
            mappedLeads.map((l) => ({
              email: l.email,
              first_name: l.first_name,
              last_name: l.last_name,
              company_name: l.company_name,
              company_domain: l.company_domain,
            }))
          )

          // Log dedup rejections (non-blocking)
          const dedupCandidates = mappedLeads.map((l) => ({
            email: l.email,
            first_name: l.first_name,
            last_name: l.last_name,
            company_name: l.company_name,
          }))
          logDedupRejections(user.workspace_id!, 'daily_distribution', dedupCandidates, duplicateIndices, mappedLeads.length)

          const leadsToInsert = mappedLeads.filter((_, i) => !duplicateIndices.has(i))

          if (leadsToInsert.length === 0) {
            return
          }

          const { error: insertError } = await supabase
            .from('leads')
            .insert(leadsToInsert)

          if (insertError) {
            throw new Error(`Failed to insert leads: ${insertError.message}`)
          }

          // Return data needed for notification/GHL steps
          return {
            inserted: leadsToInsert.length,
            leads,
          }
        })

        // Send email notification as a separate top-level step
        if (result && result.inserted > 0) {
          await step.run(`send-notification-${user.id}`, async () => {
            const firstName = user.full_name?.split(' ')[0] || 'there'
            const dashboardUrl = 'https://leads.meetcursive.com/leads'
            const leadCount = result.inserted
            const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

            // Show top 5 leads as cards
            const previewLeads = result.leads.slice(0, 5)

            // Build lead cards (each lead is a mini-card with name, title, company, source badge)
            const leadCards = previewLeads.map((l: AudienceLabLead) => {
              const fullName = [l.FIRST_NAME, l.LAST_NAME].filter(Boolean).join(' ') || 'New Lead'
              const title = l.JOB_TITLE || l.HEADLINE || null
              const company = l.COMPANY_NAME || null
              const hasEmail = !!(l.BUSINESS_VERIFIED_EMAILS?.[0] || l.BUSINESS_EMAIL || l.PERSONAL_VERIFIED_EMAILS?.[0])

              return `
<div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:16px 18px;margin-bottom:10px;">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;">
    <div style="flex:1;min-width:0;">
      <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:#111111;line-height:1.3;">${fullName}</p>
      ${title ? `<p style="margin:0 0 4px;font-size:13px;color:#6b7280;line-height:1.4;">${title}</p>` : ''}
      ${company ? `<p style="margin:0;font-size:13px;color:#374151;font-weight:500;">${company}</p>` : ''}
    </div>
    <span style="flex-shrink:0;margin-left:12px;display:inline-block;background:#ede9fe;color:#6d28d9;font-size:11px;font-weight:600;letter-spacing:0.04em;padding:3px 8px;border-radius:999px;white-space:nowrap;">Daily Lead</span>
  </div>
  ${hasEmail ? `<p style="margin:8px 0 0;font-size:12px;color:#10b981;font-weight:500;">&#10003; Verified email available</p>` : ''}
</div>`
            }).join('')

            const remainingCount = leadCount - previewLeads.length

            await sendEmail({
              to: user.email,
              subject: `Your ${leadCount} new lead${leadCount === 1 ? '' : 's'} ${leadCount === 1 ? 'is' : 'are'} ready — ${today}`,
              html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Your new leads are ready</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0;padding:0;background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="background:#6366f1;border-radius:12px 12px 0 0;padding:32px 36px 28px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.1em;color:rgba(255,255,255,0.7);text-transform:uppercase;">Cursive</p>
              <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.25;">Your ${leadCount} new lead${leadCount === 1 ? '' : 's'} ${leadCount === 1 ? 'is' : 'are'} ready</h1>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.82);line-height:1.5;">Hi ${firstName} — your daily batch just landed, scored, and verified. Here's a preview of who's waiting for you.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:28px 36px 24px;">

              <!-- Section label -->
              <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;">Today's top leads</p>

              <!-- Lead cards -->
              ${leadCards}

              ${remainingCount > 0 ? `
              <p style="margin:4px 0 24px;font-size:13px;color:#6366f1;font-weight:500;">+ ${remainingCount} more lead${remainingCount === 1 ? '' : 's'} in your dashboard</p>
              ` : '<div style="height:20px;"></div>'}

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border-radius:8px;background:#6366f1;">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">View All Leads &rarr;</a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">Each lead can be enriched with verified phone, email, and LinkedIn for 1 credit.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:18px 36px;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;line-height:1.6;">
                You receive leads daily based on your industry and location targeting.
                <a href="https://leads.meetcursive.com/settings" style="color:#6366f1;text-decoration:none;">Update preferences</a>
              </p>
              <p style="margin:0;font-size:12px;color:#d1d5db;">
                &copy; ${new Date().getFullYear()} Cursive &middot; <a href="https://leads.meetcursive.com/settings/notifications" style="color:#d1d5db;text-decoration:none;">Manage email notifications</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
              text: `Your ${leadCount} new lead${leadCount === 1 ? '' : 's'} ${leadCount === 1 ? 'is' : 'are'} ready — ${today}\n\nHi ${firstName},\n\nYour daily batch just landed. Here's a preview:\n\n${previewLeads.map((l: AudienceLabLead) => `- ${[l.FIRST_NAME, l.LAST_NAME].filter(Boolean).join(' ') || 'New Lead'}${l.JOB_TITLE || l.HEADLINE ? `, ${l.JOB_TITLE || l.HEADLINE}` : ''}${l.COMPANY_NAME ? ` at ${l.COMPANY_NAME}` : ''}`).join('\n')}${remainingCount > 0 ? `\n+ ${remainingCount} more leads` : ''}\n\nView all your leads: ${dashboardUrl}\n\nEach lead can be enriched with verified contact details for 1 credit.\n\n---\nCursive · Manage notifications: https://leads.meetcursive.com/settings/notifications`,
              tags: [{ name: 'type', value: 'daily-leads' }],
            })

          })

          // Sync to GHL if user has CRM enabled
          if (user.ghl_sub_account_id) {
            await step.run(`sync-to-ghl-${user.id}`, async () => {
              const ghlLeads = result.leads.map((lead: AudienceLabLead) => ({
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

            })
          }
        }

        successCount++
      } catch {
        failedCount++
      }
    }

    return {
      processed: users.length,
      success: successCount,
      failed: failedCount,
    }
  }
)
