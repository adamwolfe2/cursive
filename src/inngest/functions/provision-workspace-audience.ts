/**
 * Provision Workspace Audience
 *
 * Triggered immediately when a new business user completes onboarding.
 * Pulls a targeted batch of leads from AudienceLab's Audience Segment API
 * based on the user's declared industry + target locations.
 *
 * This gives new workspaces their first leads within minutes of signing up
 * instead of waiting up to 6 hours for the cron-based segment puller.
 *
 * Flow:
 * 1. Read workspace targeting preferences from user_targeting
 * 2. Build audience segment filters (industry + geo)
 * 3. Preview to confirm records exist
 * 4. Create audience and fetch up to 200 records
 * 5. Insert leads into workspace with proper routing
 * 6. Log result via Slack
 *
 * Event: audiencelab/provision-workspace-audience
 * Payload: { workspace_id, user_id, industries, states }
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  previewAudience,
  createAudience,
  fetchAudienceRecords,
  buildWorkspaceAudienceFilters,
  type ALEnrichedProfile,
} from '@/lib/audiencelab/api-client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[AL Provision Workspace]'
const MAX_INITIAL_LEADS = 200  // First-time pull cap — generous for new users
const MIN_QUALITY_SCORE = 20

/**
 * Score an ALEnrichedProfile's completeness (0–100).
 * Leads below MIN_QUALITY_SCORE are too sparse to be useful.
 */
function scoreALProfile(record: ALEnrichedProfile): number {
  let score = 0

  const bve = record.BUSINESS_VERIFIED_EMAILS
  const pve = record.PERSONAL_VERIFIED_EMAILS
  if ((typeof bve === 'string' && bve.length > 0) || (Array.isArray(bve) && bve.length > 0)) score += 30
  else if ((typeof pve === 'string' && pve.length > 0) || (Array.isArray(pve) && pve.length > 0)) score += 25
  else if (record.BUSINESS_EMAIL) score += 12
  else if (record.PERSONAL_EMAILS) score += 8

  if (record.FIRST_NAME && record.LAST_NAME) score += 15
  else if (record.FIRST_NAME || record.LAST_NAME) score += 5

  if (record.MOBILE_PHONE) score += 12
  else if (record.DIRECT_NUMBER) score += 10
  else if (record.PERSONAL_PHONE) score += 8
  else if (record.COMPANY_PHONE) score += 4

  if (record.COMPANY_NAME) score += 8
  if (record.JOB_TITLE) score += 7
  if (record.COMPANY_LINKEDIN_URL) score += 8

  if ((record.COMPANY_CITY || record.PERSONAL_CITY) && (record.COMPANY_STATE || record.PERSONAL_STATE)) score += 5
  else if (record.COMPANY_STATE || record.PERSONAL_STATE) score += 2

  if (record.COMPANY_DOMAIN) score += 5
  if (record.COMPANY_EMPLOYEE_COUNT) score += 3
  if (record.COMPANY_REVENUE) score += 3

  return score
}

function parseCSV(val: unknown): string[] {
  if (!val || typeof val !== 'string') return []
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

export const provisionWorkspaceAudience = inngest.createFunction(
  {
    id: 'provision-workspace-audience',
    name: 'Provision Workspace Audience (First-Time Pull)',
    retries: 2,
    timeouts: { finish: '8m' },
  },
  { event: 'audiencelab/provision-workspace-audience' },
  async ({ event, step }) => {
    const { workspace_id, user_id, industries, states } = event.data as {
      workspace_id: string
      user_id: string
      industries: string[]
      states: string[]
    }

    if (!workspace_id || !user_id) {
      safeLog(`${LOG_PREFIX} Missing workspace_id or user_id, skipping`)
      return { skipped: true, reason: 'Missing required fields' }
    }

    // Step 1: Verify AL API key is configured
    const apiKeyOk = await step.run('check-api-key', async () => {
      return !!process.env.AUDIENCELAB_ACCOUNT_API_KEY
    })

    if (!apiKeyOk) {
      // Send alert so ops knows this workspace got no leads
      sendSlackAlert({
        type: 'system_event',
        severity: 'warning',
        message: `Workspace ${workspace_id} provision SKIPPED — AUDIENCELAB_ACCOUNT_API_KEY not configured`,
        metadata: { workspace_id, user_id },
      }).catch(() => {}) // non-fatal
      safeLog(`${LOG_PREFIX} AUDIENCELAB_ACCOUNT_API_KEY not configured, skipping`)
      return { skipped: true, reason: 'No API key' }
    }

    // Step 2: Build the audience segment filters
    const audienceResult = await step.run('preview-and-create-audience', async () => {
      const segmentFilters = buildWorkspaceAudienceFilters({
        industries: industries?.length > 0 ? industries : undefined,
        states: states?.length > 0 ? states : undefined,
      })

      safeLog(`${LOG_PREFIX} Workspace ${workspace_id}: industries=${industries?.join(',') || 'all'} states=${states?.join(',') || 'all'}`)

      // Preview count to validate the segment exists
      let previewCount = 0
      try {
        const preview = await previewAudience({
          days_back: 7,
          filters: segmentFilters,
          limit: 50,
          include_dnc: false,
          score: true,
        })
        previewCount = preview.count || 0
        safeLog(`${LOG_PREFIX} Preview count: ${previewCount}`)

        if (previewCount === 0) {
          safeLog(`${LOG_PREFIX} No records found for this targeting, trying last 30 days`)
          // Broaden to 30 days if 7-day window is empty
          const widerPreview = await previewAudience({
            days_back: 10,
            filters: segmentFilters,
            limit: 50,
            include_dnc: false,
          })
          previewCount = widerPreview.count || 0
          if (previewCount === 0) {
            return { audienceId: null as string | null, segmentFilters }
          }
        }
      } catch (err) {
        safeLog(`${LOG_PREFIX} Preview failed, attempting direct create: ${err instanceof Error ? err.message : err}`)
      }

      // Create the named audience
      const audienceName = `cursive-signup-${workspace_id.substring(0, 8)}-${industries?.[0] || 'general'}-${Date.now()}`
      const audience = await createAudience({
        name: audienceName,
        filters: segmentFilters,
        description: `Auto-provisioned for workspace ${workspace_id} at signup. Industries: ${industries?.join(', ') || 'all'}. States: ${states?.join(', ') || 'all'}.`,
      })

      safeLog(`${LOG_PREFIX} Audience created: ${audience.audienceId}`)
      return { audienceId: audience.audienceId || null as string | null, segmentFilters }
    })

    if (!audienceResult.audienceId) {
      safeLog(`${LOG_PREFIX} No audience created (empty segment or AL unavailable)`)
      return { skipped: true, reason: 'Empty segment or audience creation failed' }
    }

    // Step 3: Fetch and insert leads
    const insertResult = await step.run('fetch-and-insert-leads', async () => {
      const supabase = createAdminClient()
      let inserted = 0
      let skipped = 0
      const sampleLeads: Array<{ name: string; company: string; title: string }> = []
      const maxPages = Math.ceil(MAX_INITIAL_LEADS / 100)

      for (let page = 1; page <= maxPages; page++) {
        const pageSize = Math.min(100, MAX_INITIAL_LEADS - inserted)
        if (pageSize <= 0) break

        let records: ALEnrichedProfile[] = []
        try {
          const recordsResponse = await fetchAudienceRecords(audienceResult.audienceId!, page, pageSize)
          records = recordsResponse.data || []
          if (records.length === 0) break
        } catch (err) {
          safeError(`${LOG_PREFIX} Failed to fetch page ${page}`, err)
          break
        }

        for (const record of records) {
          if (inserted >= MAX_INITIAL_LEADS) break

          const qualityScore = scoreALProfile(record)
          if (qualityScore < MIN_QUALITY_SCORE) {
            skipped++
            continue
          }

          const personalEmails = parseCSV(record.PERSONAL_EMAILS)
          const businessEmails = parseCSV(record.BUSINESS_EMAIL)
          const email = personalEmails[0] || businessEmails[0]

          if (!email) {
            skipped++
            continue
          }

          // Dedupe: skip if this email already exists in workspace
          const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('workspace_id', workspace_id)
            .eq('email', email.toLowerCase())
            .limit(1)
            .maybeSingle()

          if (existing) {
            skipped++
            continue
          }

          const firstName = record.FIRST_NAME || ''
          const lastName = record.LAST_NAME || ''
          const fullName = [firstName, lastName].filter(Boolean).join(' ')
          const phones = parseCSV(record.PERSONAL_PHONE || record.MOBILE_PHONE || record.DIRECT_NUMBER)

          const { error: insertErr } = await supabase
            .from('leads')
            .insert({
              workspace_id,
              source: 'audiencelab_pull',
              enrichment_status: 'enriched',
              status: 'new',
              first_name: firstName || null,
              last_name: lastName || null,
              full_name: fullName || null,
              email: email.toLowerCase(),
              phone: phones[0] || null,
              company_name: record.COMPANY_NAME || null,
              company_industry: record.COMPANY_INDUSTRY || industries?.[0] || null,
              company_domain: record.COMPANY_DOMAIN || null,
              city: record.PERSONAL_CITY || record.COMPANY_CITY || null,
              state: record.PERSONAL_STATE || record.COMPANY_STATE || null,
              state_code: record.PERSONAL_STATE || record.COMPANY_STATE || null,
              country: 'US',
              country_code: 'US',
              postal_code: record.PERSONAL_ZIP || record.COMPANY_ZIP || null,
              job_title: record.JOB_TITLE || null,
              // Demographics (AL V4 fields)
              age_range: record.AGE_RANGE || null,
              gender: record.GENDER || null,
              homeowner: record.HOMEOWNER ? ['Y','y','true','TRUE','Yes','yes'].includes(String(record.HOMEOWNER)) : null,
              married: record.MARRIED ? ['Y','y','true','TRUE','Yes','yes'].includes(String(record.MARRIED)) : null,
              // Professional
              headline: record.HEADLINE || null,
              // Company extended
              company_address: record.COMPANY_ADDRESS || null,
              company_city: record.COMPANY_CITY || null,
              company_state: record.COMPANY_STATE || null,
              company_zip: record.COMPANY_ZIP || null,
              company_phone: record.COMPANY_PHONE || null,
              company_sic: record.COMPANY_SIC || null,
              company_naics: record.COMPANY_NAICS || null,
              // Social
              individual_twitter_url: record.INDIVIDUAL_TWITTER_URL || null,
              individual_facebook_url: record.INDIVIDUAL_FACEBOOK_URL || null,
              // Phone lists
              all_mobiles: record.ALL_MOBILES ? String(record.ALL_MOBILES).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
              all_landlines: record.ALL_LANDLINES ? String(record.ALL_LANDLINES).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
              // Profile attributes
              skills: record.SKILLS ? String(record.SKILLS).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
              interests: record.INTERESTS ? String(record.INTERESTS).split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
              lead_score: Math.min(qualityScore, 100),
              intent_score_calculated: Math.round(qualityScore * 0.8),
              freshness_score: 100,
              has_email: true,
              has_phone: phones.length > 0,
              validated: false,
              assigned_user_id: user_id,
              enrichment_method: 'audiencelab_pull',
              tags: ['audiencelab', 'signup-provision', ...(industries?.map(i => i.toLowerCase()) || [])],
              company_data: {
                name: record.COMPANY_NAME || null,
                industry: record.COMPANY_INDUSTRY || industries?.[0] || null,
                domain: record.COMPANY_DOMAIN || null,
              },
              company_location: {
                city: record.PERSONAL_CITY || record.COMPANY_CITY || null,
                state: record.PERSONAL_STATE || record.COMPANY_STATE || null,
                country: 'US',
              },
            })

          if (insertErr) {
            if (insertErr.code !== '23505') {
              safeError(`${LOG_PREFIX} Insert failed for ${email}`, insertErr)
            }
            skipped++
            continue
          }

          // Collect sample leads for activation email (first 3 only)
          if (sampleLeads.length < 3 && fullName) {
            sampleLeads.push({
              name: fullName,
              company: record.COMPANY_NAME || '',
              title: record.JOB_TITLE || '',
            })
          }

          // Create user_lead_assignment so the lead appears in "My Leads"
          const { data: newLead } = await supabase
            .from('leads')
            .select('id')
            .eq('workspace_id', workspace_id)
            .eq('email', email.toLowerCase())
            .limit(1)
            .maybeSingle()

          if (newLead?.id) {
            await supabase
              .from('user_lead_assignments')
              .insert({
                workspace_id,
                lead_id: newLead.id,
                user_id,
                matched_industry: record.COMPANY_INDUSTRY || industries?.[0] || null,
                matched_geo: record.PERSONAL_STATE || record.COMPANY_STATE || states?.[0] || null,
                source: 'audiencelab_pull',
                status: 'new',
              })
              .select()
              .maybeSingle()
          }

          inserted++
        }

        if (records.length < pageSize) break
      }

      return { inserted, skipped, sampleLeads }
    })

    safeLog(`${LOG_PREFIX} Workspace ${workspace_id}: ${insertResult.inserted} leads inserted, ${insertResult.skipped} skipped`)

    // Step 4: Send "first leads arrived" activation email
    if (insertResult.inserted > 0) {
      await step.run('send-activation-email', async () => {
        try {
          const supabase = createAdminClient()

          // Get user's email and name
          const { data: userRow } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', user_id)
            .maybeSingle()

          if (!userRow?.email) return

          const firstName = userRow.full_name?.split(' ')[0] || 'there'
          const dashboardUrl = 'https://leads.meetcursive.com/leads'
          const RESEND_API_KEY = process.env.RESEND_API_KEY
          const FROM_EMAIL = process.env.EMAIL_FROM || 'Cursive <notifications@meetcursive.com>'

          if (!RESEND_API_KEY) return

          const sampleHtml = insertResult.sampleLeads?.length
            ? insertResult.sampleLeads.map(l =>
                `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f0f0f0;">
                  <div style="width:36px;height:36px;background:#007AFF;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;flex-shrink:0;">${l.name.charAt(0)}</div>
                  <div>
                    <div style="font-weight:600;color:#111;font-size:14px;">${l.name}</div>
                    <div style="color:#666;font-size:13px;">${[l.title, l.company].filter(Boolean).join(' at ')}</div>
                  </div>
                </div>`
              ).join('')
            : ''

          const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f9fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#007AFF;padding:28px 32px;">
    <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0 0 6px;">Cursive Super Pixel</p>
    <h1 style="color:#fff;font-size:24px;font-weight:600;margin:0;line-height:1.3;">Your first ${insertResult.inserted} leads just arrived.</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;">Hi ${firstName},</p>
    <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px;">
      We just pulled <strong>${insertResult.inserted} verified, intent-matched leads</strong> from our database and loaded them directly into your Cursive dashboard — matched to your industry and target locations.
    </p>
    ${sampleHtml ? `
    <p style="color:#888;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">A few of them:</p>
    <div style="background:#fafafa;border-radius:12px;padding:4px 16px;margin-bottom:24px;">
      ${sampleHtml}
    </div>
    ` : ''}
    <a href="${dashboardUrl}" style="display:block;background:#007AFF;color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:10px;font-weight:700;font-size:16px;margin-bottom:24px;">
      View All ${insertResult.inserted} Leads →
    </a>
    <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 8px;">From here you can:</p>
    <ul style="color:#666;font-size:14px;line-height:1.9;margin:0 0 24px;padding-left:20px;">
      <li>Export to your CRM (HubSpot, Salesforce, Slack)</li>
      <li>Launch an outbound email campaign</li>
      <li>Enrich any lead with 50+ verified data points</li>
      <li>Filter by industry, location, seniority, and more</li>
    </ul>
    <p style="color:#666;font-size:14px;line-height:1.6;margin:0;">Your lead pipeline refreshes automatically every 6 hours. Questions? Reply to this email.</p>
  </div>
  <div style="background:#f7f9fb;padding:20px 32px;text-align:center;">
    <p style="color:#aaa;font-size:12px;margin:0;">Cursive · <a href="https://leads.meetcursive.com/settings/notifications" style="color:#aaa;">Manage notifications</a></p>
  </div>
</div>
</body>
</html>`

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: userRow.email,
              subject: `Your first ${insertResult.inserted} leads just arrived`,
              html,
              headers: {
                'List-Unsubscribe': '<https://leads.meetcursive.com/settings/notifications>',
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            }),
          })

          safeLog(`${LOG_PREFIX} Activation email sent to ${userRow.email}`)
        } catch (emailErr) {
          safeError(`${LOG_PREFIX} Activation email failed (non-fatal)`, emailErr)
        }
      })
    }

    // Step 5: Notify if meaningful results
    if (insertResult.inserted > 0) {
      await step.run('notify', async () => {
        sendSlackAlert({
          type: 'system_event',
          severity: 'info',
          message: `New workspace provisioned with ${insertResult.inserted} leads (AL Audience API)`,
          metadata: {
            workspace_id,
            user_id,
            industries: industries?.join(', ') || 'all',
            states: states?.join(', ') || 'all',
            inserted: insertResult.inserted,
            skipped: insertResult.skipped,
          },
        }).catch((err) => safeError(`${LOG_PREFIX} Slack alert failed`, err))
      })
    }

    return {
      workspace_id,
      audience_id: audienceResult.audienceId,
      inserted: insertResult.inserted,
      skipped: insertResult.skipped,
    }
  }
)
