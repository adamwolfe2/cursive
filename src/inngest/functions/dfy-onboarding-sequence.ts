/**
 * DFY Onboarding Sequence
 *
 * Triggered when a DFY client completes their onboarding form.
 * Automatically provisions their AudienceLab pixel + imports their first
 * 500 leads, then runs a tier-specific email nurture sequence.
 *
 * Automated flow (runs immediately on sign):
 *   1. Confirmation email → client
 *   2. Emit GHL pipeline event
 *   3. Provision AL pixel for client's website
 *   4. Preview ICP audience count
 *   5. Create AL audience + import up to 500 leads into their workspace
 *   6. Notify admin with automation results (pixel ID, leads imported)
 *
 * Nurture sequence (delayed):
 *   7. Day 3: pixel-live check-in
 *   8. Day 7: first-week tips
 *   9. Day 14: ROI check-in
 */

import { inngest } from '../client'
import { sendEmail, createEmailTemplate } from '@/lib/email/resend-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { sendSlackAlert } from '@/lib/monitoring/alerts'

import {
  previewAudience,
  createAudience,
  fetchAudienceRecords,
  buildWorkspaceAudienceFilters,
  provisionCustomerPixel,
  UNFILTERED_PREVIEW_THRESHOLD,
  AudienceLabUnfilteredError,
  type ALEnrichedProfile,
} from '@/lib/audiencelab/api-client'
import { bulkInsertALRecords } from '@/lib/audiencelab/lead-inserter'

import { APP_URL as _APP_URL, CAL_BOOKING_URL as BOOKING_URL } from '@/lib/config/urls'

const LOG_PREFIX = '[DFY Onboarding]'
const MAX_DFY_INITIAL_LEADS = 500

export const dfyOnboardingSequence = inngest.createFunction(
  {
    id: 'dfy-onboarding-sequence',
    retries: 2,
    timeouts: { finish: '15m' },
    cancelOn: [{ event: 'subscription/cancelled', match: 'data.workspace_id' }],
  },
  { event: 'dfy/onboarding-completed' },
  async ({ event, step }) => {
    const {
      workspace_id,
      subscription_id,
      user_email,
      user_name,
      company_name,
      website_url,
      industries,
      onboarding_data,
    } = event.data

    const firstName = (user_name || user_email.split('@')[0] || '').split(' ')[0]
    const targetStates: string[] = onboarding_data?.target_states || []
    const targetTitles: string = onboarding_data?.target_titles || ''

    // ─── STEP 1: Client confirmation email ──────────────────────────────────
    await step.run('send-setup-confirmation', async () => {
      const html = createEmailTemplate({
        preheader: 'We received your details and are setting everything up',
        title: 'Setup in Progress',
        content: `
          <h1 class="email-title">We're Building Your Pipeline</h1>
          <p class="email-text">Hey ${firstName},</p>
          <p class="email-text">Thanks for completing your onboarding. We're now automatically configuring your pipeline:</p>

          <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <div style="display: flex; margin-bottom: 16px;">
              <div style="min-width: 32px; height: 32px; background: #16a34a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">✓</div>
              <div>
                <p style="margin: 0; font-weight: 600;">CRM Account Created</p>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Your GoHighLevel CRM is ready</p>
              </div>
            </div>
            <div style="display: flex; margin-bottom: 16px;">
              <div style="min-width: 32px; height: 32px; background: #16a34a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">✓</div>
              <div>
                <p style="margin: 0; font-weight: 600;">Onboarding Complete</p>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">We have your ICP details</p>
              </div>
            </div>
            <div style="display: flex; margin-bottom: 16px;">
              <div style="min-width: 32px; height: 32px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">3</div>
              <div>
                <p style="margin: 0; font-weight: 600;">Pixel + Lead Pipeline (In Progress)</p>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Installing tracking on ${website_url} and pulling your first leads</p>
              </div>
            </div>
            <div style="display: flex;">
              <div style="min-width: 32px; height: 32px; background: #e5e7eb; color: #6b7280; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">4</div>
              <div>
                <p style="margin: 0; font-weight: 600;">Campaign Launch</p>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">AI-powered outreach to your ideal prospects</p>
              </div>
            </div>
          </div>

          <p class="email-text">You'll receive a confirmation once your pixel is live and leads are flowing. Most clients see their first leads within minutes.</p>

          <a href="${BOOKING_URL}" class="email-button">Book a Strategy Call</a>

          <div class="email-signature">
            <p style="margin: 0;">— Adam, Founder @ Cursive</p>
          </div>
        `,
      })

      await sendEmail({
        to: user_email,
        subject: `We're setting up your pipeline, ${firstName}`,
        html,
      })
    })

    // ─── STEP 2: GHL pipeline lifecycle event ───────────────────────────────
    await step.run('emit-pipeline-update', async () => {
      try {
        await inngest.send({
          name: 'ghl/pipeline.update',
          data: {
            user_email,
            workspace_id,
            lifecycle_event: 'onboarding_completed',
            metadata: { company_name, website_url, industries },
          },
        })
      } catch {
        // Non-blocking
      }
    })

    // ─── STEP 3: Provision AL pixel for client's website ────────────────────
    const pixelResult = await step.run('al-provision-pixel', async () => {
      if (!process.env.AUDIENCELAB_ACCOUNT_API_KEY) {
        safeLog(`${LOG_PREFIX} No AL API key — skipping pixel provisioning for ${company_name}`)
        return { pixelId: null as string | null, installUrl: null as string | null, error: 'no_api_key' }
      }

      try {
        const pixel = await provisionCustomerPixel({
          websiteName: company_name,
          websiteUrl: website_url,
        })

        safeLog(`${LOG_PREFIX} Pixel created for ${company_name}: ${pixel.pixel_id}`)

        // Store pixel record in DB
        const supabase = createAdminClient()
        await supabase
          .from('audiencelab_pixels')
          .upsert({
            workspace_id,
            pixel_id: pixel.pixel_id,
            website_name: company_name,
            website_url,
            webhook_url: pixel.webhook_url || null,
            provisioned_by_automation: true,
          }, { onConflict: 'pixel_id' })

        return {
          pixelId: pixel.pixel_id,
          installUrl: pixel.install_url || null,
          scriptSnippet: pixel.script || null,
          error: null,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        safeError(`${LOG_PREFIX} Pixel provisioning failed for ${company_name}:`, err)
        return { pixelId: null as string | null, installUrl: null as string | null, error: message }
      }
    })

    // ─── STEP 4: Preview ICP audience to validate size ──────────────────────
    const previewResult = await step.run('al-preview-icp', async () => {
      if (!process.env.AUDIENCELAB_ACCOUNT_API_KEY) {
        return { count: 0, skipped: true, reason: 'no_api_key' }
      }

      try {
        const segmentFilters = buildWorkspaceAudienceFilters({
          industries: industries?.length > 0 ? industries : undefined,
          states: targetStates.length > 0 ? targetStates : undefined,
        })

        const preview = await previewAudience({
          days_back: 7,
          filters: segmentFilters,
          limit: 10,
          include_dnc: false,
          score: false,
        })

        const count = preview.count || 0
        safeLog(`${LOG_PREFIX} ICP audience preview for ${company_name}: ${count} matches`)

        if (count >= UNFILTERED_PREVIEW_THRESHOLD) {
          safeLog(`${LOG_PREFIX} Preview count ${count} exceeds threshold — likely unfiltered, skipping pull`)
          return { count, skipped: true, reason: 'unfiltered' }
        }

        return { count, skipped: false, reason: '' }
      } catch (err) {
        safeError(`${LOG_PREFIX} Preview failed for ${company_name}:`, err)
        return { count: 0, skipped: true, reason: 'preview_error' }
      }
    })

    // ─── STEP 5: Create audience + import leads ──────────────────────────────
    const leadImportResult = await step.run('al-create-and-pull-leads', async () => {
      if (!process.env.AUDIENCELAB_ACCOUNT_API_KEY || previewResult.skipped) {
        return { audienceId: null as string | null, inserted: 0, skipped: 0, errors: 0 }
      }

      try {
        const segmentFilters = buildWorkspaceAudienceFilters({
          industries: industries?.length > 0 ? industries : undefined,
          states: targetStates.length > 0 ? targetStates : undefined,
        })

        const audienceName = `dfy-${company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}-${workspace_id.slice(0, 8)}`
        const audience = await createAudience({
          name: audienceName,
          filters: segmentFilters,
          description: `DFY onboarding pull for ${company_name}. Industries: ${industries?.join(', ') || 'all'}. States: ${targetStates.join(', ') || 'all'}.`,
        })

        const audienceId = audience.audienceId
        safeLog(`${LOG_PREFIX} Audience created for ${company_name}: ${audienceId}`)

        // Fetch and insert leads (up to MAX_DFY_INITIAL_LEADS across pages of 100)
        let totalInserted = 0
        let totalSkipped = 0
        let totalErrors = 0
        const maxPages = Math.ceil(MAX_DFY_INITIAL_LEADS / 100)

        for (let page = 1; page <= maxPages; page++) {
          const pageSize = Math.min(100, MAX_DFY_INITIAL_LEADS - totalInserted)
          if (pageSize <= 0) break

          let records: ALEnrichedProfile[] = []
          try {
            const response = await fetchAudienceRecords(audienceId, page, pageSize)
            records = response.data || []
            if (records.length === 0) break
          } catch (err) {
            if (err instanceof AudienceLabUnfilteredError) {
              safeLog(`${LOG_PREFIX} Unfiltered response (${err.totalRecords} records) — aborting for ${company_name}`)
              break
            }
            safeError(`${LOG_PREFIX} Page ${page} fetch failed:`, err)
            break
          }

          const { inserted, skipped, errors } = await bulkInsertALRecords(records, {
            workspaceId: workspace_id,
            sourceTag: 'dfy_onboarding',
            extraTags: ['dfy'],
            industries: industries || [],
            maxRecords: MAX_DFY_INITIAL_LEADS - totalInserted,
          })

          totalInserted += inserted
          totalSkipped += skipped
          totalErrors += errors

          if (records.length < pageSize) break
        }

        // Record the audience in al_audiences for weekly refresh
        if (audienceId) {
          const supabase = createAdminClient()
          await supabase
            .from('al_audiences')
            .upsert({
              workspace_id,
              al_audience_id: audienceId,
              name: audienceName,
              source: 'dfy_onboarding',
              filters: { industries: industries || [], states: targetStates },
              leads_imported: totalInserted,
              refresh_enabled: true,
            }, { onConflict: 'workspace_id,al_audience_id' })
        }

        safeLog(`${LOG_PREFIX} Lead import done for ${company_name}: ${totalInserted} inserted, ${totalSkipped} skipped`)

        return { audienceId, inserted: totalInserted, skipped: totalSkipped, errors: totalErrors }
      } catch (err) {
        safeError(`${LOG_PREFIX} Lead import failed for ${company_name}:`, err)
        return { audienceId: null as string | null, inserted: 0, skipped: 0, errors: 1 }
      }
    })

    // ─── STEP 6: Notify admin with automation results ───────────────────────
    await step.run('notify-admin-automation-results', async () => {
      safeLog(`${LOG_PREFIX} Notifying admin of automation results for ${company_name}`)

      const pixelStatus = pixelResult.pixelId
        ? `Pixel created: ${pixelResult.pixelId}`
        : `Pixel provisioning failed: ${pixelResult.error}`

      const leadsStatus = leadImportResult.inserted > 0
        ? `${leadImportResult.inserted} leads imported into their workspace`
        : `No leads imported (preview count: ${previewResult.count}, skipped: ${previewResult.skipped})`

      await sendEmail({
        to: 'adam@meetcursive.com',
        subject: `[AUTO-DONE] ${company_name} onboarded — ${leadImportResult.inserted} leads, pixel ${pixelResult.pixelId ? 'live' : 'failed'}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px;">
            <h2 style="color: #16a34a;">DFY Onboarding Automation Complete</h2>
            <p><strong>${company_name}</strong> has been automatically onboarded.</p>

            <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin-top: 0;">Automation Results:</h3>
              <ul style="line-height: 2; margin: 0; padding-left: 20px;">
                <li>${pixelStatus}</li>
                <li>${leadsStatus}</li>
                <li>ICP audience count: ${previewResult.count.toLocaleString()} matches</li>
                ${pixelResult.installUrl ? `<li>Install URL: ${pixelResult.installUrl}</li>` : ''}
              </ul>
            </div>

            ${leadImportResult.inserted === 0 ? `
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #f59e0b;">
              <strong>Manual action may be needed:</strong> No leads were auto-imported.
              Reason: ${previewResult.skipped ? `Audience preview skipped (${previewResult.reason})` : 'Import failed — check logs'}.
            </div>
            ` : ''}

            <h3>Client Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; font-weight: bold;">Company:</td><td>${company_name}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Website:</td><td><a href="${website_url}">${website_url}</a></td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td>${user_email}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Industries:</td><td>${industries?.join(', ') || 'Not specified'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">States:</td><td>${targetStates.join(', ') || 'All'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Target Titles:</td><td>${targetTitles || 'Not specified'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Use Case:</td><td>${onboarding_data?.use_case || 'Not specified'}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Lead Goal:</td><td>${onboarding_data?.monthly_lead_goal || 'Not specified'}/mo</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Workspace:</td><td>${workspace_id}</td></tr>
            </table>

            ${leadImportResult.inserted > 0 ? '' : `
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #6b7280;">
              <h3 style="margin-top: 0;">Remaining Manual Items:</h3>
              <ol style="line-height: 2;">
                ${!pixelResult.pixelId ? `<li>Create pixel in AudienceLab for: <strong>${website_url}</strong></li>` : ''}
                <li>Configure native GHL integration to route leads to their sub-account</li>
                <li>Build initial EmailBison campaign targeting: ${industries?.join(', ') || 'TBD'}</li>
                <li>Mark as active in admin dashboard when complete</li>
              </ol>
            </div>
            `}
          </div>
        `,
      })

      try {
        await sendSlackAlert({
          type: 'dfy_onboarding_complete',
          severity: 'info',
          message: `${company_name} auto-onboarded: ${leadImportResult.inserted} leads, pixel ${pixelResult.pixelId ? pixelResult.pixelId : 'FAILED'}`,
          metadata: {
            company_name,
            website_url,
            user_email,
            workspace_id,
            leads_imported: leadImportResult.inserted,
            pixel_id: pixelResult.pixelId,
            audience_id: leadImportResult.audienceId,
          },
        })
      } catch {
        // Slack is optional
      }
    })

    // ─── Wait 3 days ────────────────────────────────────────────────────────
    await step.sleep('wait-3-days', '3d')

    // ─── STEP 7: Day 3 check-in ─────────────────────────────────────────────
    await step.run('send-day3-checkin', async () => {
      safeLog(`${LOG_PREFIX} Day 3: Check-in for ${user_email}`)

      const supabase = createAdminClient()
      const { data: sub } = await supabase
        .from('service_subscriptions')
        .select('status')
        .eq('id', subscription_id)
        .maybeSingle()

      const isActive = sub?.status === 'active'

      const html = createEmailTemplate({
        preheader: isActive ? 'Your pixel is live — leads are flowing' : 'Quick update on your setup',
        title: isActive ? 'Your Pixel is Live!' : 'Setup Update',
        content: isActive
          ? `
            <h1 class="email-title">Your Pixel is Live!</h1>
            <p class="email-text">Hey ${firstName},</p>
            <p class="email-text">Great news — your visitor tracking pixel is now active on ${website_url}. Here's what that means:</p>

            <div style="background: #f0fdf4; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <ul style="margin: 0; padding-left: 20px; line-height: 2;">
                <li>We're identifying anonymous visitors on your website</li>
                <li>Enriching them with contact data (name, email, phone, company)</li>
                <li>Routing qualified leads directly to your CRM</li>
                <li>AI outreach campaigns are being configured</li>
              </ul>
            </div>

            <p class="email-text">Log in to your CRM to see incoming leads:</p>
            <a href="https://app.gohighlevel.com/" class="email-button">Open Your CRM</a>

            <div class="email-signature">
              <p style="margin: 0;">— Adam, Founder @ Cursive</p>
            </div>
          `
          : `
            <h1 class="email-title">Quick Update</h1>
            <p class="email-text">Hey ${firstName},</p>
            <p class="email-text">We're finalizing your tracking pixel setup for ${website_url}. We'll have it live within the next 24 hours.</p>
            <p class="email-text">In the meantime, log into your CRM to see the leads we've already imported for you:</p>

            <a href="https://app.gohighlevel.com/" class="email-button">Log In to CRM</a>

            <p class="email-text">Questions? Just reply to this email.</p>

            <div class="email-signature">
              <p style="margin: 0;">— Adam, Founder @ Cursive</p>
            </div>
          `,
      })

      await sendEmail({
        to: user_email,
        subject: isActive
          ? `Your tracking pixel is live, ${firstName}!`
          : `Setup update for ${company_name}`,
        html,
      })
    })

    // ─── Wait 4 more days (Day 7) ────────────────────────────────────────────
    await step.sleep('wait-4-days', '4d')

    // ─── STEP 8: Day 7 first-week recap ─────────────────────────────────────
    await step.run('send-day7-recap', async () => {
      safeLog(`${LOG_PREFIX} Day 7: Recap for ${user_email}`)

      const html = createEmailTemplate({
        preheader: 'Your first week with Cursive — tips to maximize ROI',
        title: 'First Week Tips',
        content: `
          <h1 class="email-title">Your First Week with Cursive</h1>
          <p class="email-text">Hey ${firstName},</p>
          <p class="email-text">You've been on Cursive for a week. Here are 3 things that'll help you get the most out of your investment:</p>

          <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0 0 16px;"><strong>1. Check your CRM daily</strong><br/>
            New leads are being delivered automatically. The faster you follow up, the higher your conversion rate. Aim to respond within 1 hour.</p>

            <p style="margin: 0 0 16px;"><strong>2. Review your email campaigns</strong><br/>
            We're sending AI-powered outreach on your behalf. Reply to any leads that respond — we'll flag the interested ones for you.</p>

            <p style="margin: 0;"><strong>3. Tell us what's working</strong><br/>
            The more feedback you give us on lead quality, the better we can tune your targeting and campaigns.</p>
          </div>

          <p class="email-text">Want to review your pipeline together?</p>
          <a href="${BOOKING_URL}" class="email-button">Book a Review Call</a>

          <div class="email-signature">
            <p style="margin: 0;">— Adam, Founder @ Cursive</p>
          </div>
        `,
      })

      await sendEmail({
        to: user_email,
        subject: `Week 1 tips to maximize your leads, ${firstName}`,
        html,
      })
    })

    // ─── Wait 7 more days (Day 14) ───────────────────────────────────────────
    await step.sleep('wait-7-days', '7d')

    // ─── STEP 9: Day 14 ROI check-in ────────────────────────────────────────
    await step.run('send-day14-roi-checkin', async () => {
      safeLog(`${LOG_PREFIX} Day 14: ROI check-in for ${user_email}`)

      const html = createEmailTemplate({
        preheader: 'Two weeks in — how are your leads converting?',
        title: 'Two Week Check-In',
        content: `
          <h1 class="email-title">How's It Going?</h1>
          <p class="email-text">Hey ${firstName},</p>
          <p class="email-text">You've been on Cursive for 2 weeks. I'd love to hear how the leads are converting for ${company_name}.</p>

          <p class="email-text">Quick questions:</p>
          <ul style="line-height: 2; color: #374151;">
            <li>Are you seeing enough leads in your CRM?</li>
            <li>Are the leads matching your ideal customer profile?</li>
            <li>Have any converted to meetings or deals?</li>
          </ul>

          <p class="email-text">Just reply to this email with your feedback — I read every response personally.</p>

          <p class="email-text">If you'd prefer to chat live, grab a time:</p>
          <a href="${BOOKING_URL}" class="email-button">Schedule a Call</a>

          <div class="email-signature">
            <p style="margin: 0;">— Adam, Founder @ Cursive</p>
          </div>
        `,
      })

      await sendEmail({
        to: user_email,
        subject: `How are your Cursive leads converting?`,
        html,
      })
    })

    return {
      completed: true,
      user_email,
      company_name,
      pixel_id: pixelResult.pixelId,
      leads_imported: leadImportResult.inserted,
      audience_id: leadImportResult.audienceId,
    }
  }
)
