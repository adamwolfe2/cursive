/**
 * Pixel Trial Drip Email System
 * Cursive Platform
 *
 * Two Inngest functions:
 *
 * 1. pixelTrialDrip — Triggered when a pixel is provisioned.
 *    Schedules a 6-email sequence: day 0, 3, 7, 10, 13, 14+.
 *    Each email pulls live visitor stats for personalization.
 *
 * 2. checkPixelTrialExpiry — Daily cron. Disables pixels past their
 *    trial end date, fires the expiry email, and notifies Slack.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/service'
import {
  pixelTrialWelcomeEmail,
  pixelTrialDay3Email,
  pixelTrialDay7Email,
  pixelTrialDay10Email,
  pixelTrialDay13Email,
  pixelTrialExpiredEmail,
  type PixelTrialEmailData,
  type VisitorPreview,
} from '@/lib/email/templates/pixel-trial'
import { sendSlackAlert } from '@/lib/monitoring/alerts'

// ============================================================
// HELPERS
// ============================================================

/** Pull visitor stats + top identified visitors for email personalization */
async function getPixelStats(pixelId: string, workspaceId: string): Promise<{
  visitorCount: number
  identifiedCount: number
  topVisitors: VisitorPreview[]
}> {
  const supabase = createAdminClient()

  // Aggregate pixel event counts from leads table (source = pixel)
  const { data: stats } = await supabase
    .from('leads')
    .select('id, first_name, last_name, full_name, company_name, job_title, city')
    .eq('workspace_id', workspaceId)
    .ilike('source', '%pixel%')
    .order('created_at', { ascending: false })
    .limit(10)

  const identified = stats ?? []
  const identifiedCount = identified.length

  // Also count total pixel events (includes anonymous)
  const { count: visitorCount } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .ilike('source', '%pixel%')

  const topVisitors: VisitorPreview[] = identified.slice(0, 3).map((l) => ({
    name: l.full_name || [l.first_name, l.last_name].filter(Boolean).join(' ') || 'Unknown Visitor',
    company: l.company_name,
    title: l.job_title,
    city: l.city,
  }))

  return {
    visitorCount: visitorCount ?? identifiedCount,
    identifiedCount,
    topVisitors,
  }
}

/** Build email data object for a given workspace + pixel */
async function buildEmailData(
  workspaceId: string,
  pixelId: string,
  domain: string,
  trialEndsAt: string
): Promise<PixelTrialEmailData & { userEmail: string }> {
  const supabase = createAdminClient()

  // Get workspace owner's name + email
  const { data: owner } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('workspace_id', workspaceId)
    .in('role', ['owner', 'admin'])
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const userName = owner?.full_name?.split(' ')?.[0] || 'there'
  const userEmail = owner?.email || ''

  const stats = await getPixelStats(pixelId, workspaceId)
  const daysLeft = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000))

  return {
    userName,
    userEmail,
    domain,
    pixelId,
    trialEndsAt,
    daysLeft,
    ...stats,
  }
}

// ============================================================
// FUNCTION 1: Pixel Trial Drip (event-triggered)
// ============================================================

export const pixelTrialDrip = inngest.createFunction(
  {
    id: 'pixel-trial-drip',
    name: 'Pixel Trial Email Drip',
    retries: 2,
    concurrency: { limit: 20 },
  },
  { event: 'pixel/provisioned' },
  async ({ event, step }) => {
    const { workspace_id, pixel_id, domain, trial_ends_at } = event.data as {
      workspace_id: string
      pixel_id: string
      domain: string
      trial_ends_at: string
    }

    // ── Day 0: Welcome ──
    await step.run('send-day0-welcome', async () => {
      const data = await buildEmailData(workspace_id, pixel_id, domain, trial_ends_at)
      if (!data.userEmail) return { skipped: true, reason: 'no email' }

      const email = pixelTrialWelcomeEmail(data)
      await sendEmail({ to: data.userEmail, subject: email.subject, html: email.html, text: email.text })
      return { sent: true }
    })

    // ── Day 3: First visitor report ──
    await step.sleepUntil('wait-3-days', new Date(Date.now() + 3 * 86_400_000).toISOString())

    await step.run('send-day3-visitor-report', async () => {
      // Check trial is still active
      const supabase = createAdminClient()
      const { data: pixel } = await supabase
        .from('audiencelab_pixels')
        .select('trial_status, trial_notified_day3')
        .eq('pixel_id', pixel_id)
        .maybeSingle()

      if (pixel?.trial_status === 'expired' || pixel?.trial_notified_day3) return { skipped: true }

      const data = await buildEmailData(workspace_id, pixel_id, domain, trial_ends_at)
      if (!data.userEmail) return { skipped: true }

      const email = pixelTrialDay3Email(data)
      await sendEmail({ to: data.userEmail, subject: email.subject, html: email.html, text: email.text })

      await supabase
        .from('audiencelab_pixels')
        .update({ trial_notified_day3: true })
        .eq('pixel_id', pixel_id)

      return { sent: true, identified: data.identifiedCount }
    })

    // ── Day 7: Mid-trial results + tease ──
    await step.sleepUntil('wait-7-days', new Date(Date.now() + 7 * 86_400_000).toISOString())

    await step.run('send-day7-midtrial', async () => {
      const supabase = createAdminClient()
      const { data: pixel } = await supabase
        .from('audiencelab_pixels')
        .select('trial_status, trial_notified_day7')
        .eq('pixel_id', pixel_id)
        .maybeSingle()

      if (pixel?.trial_status === 'expired' || pixel?.trial_notified_day7) return { skipped: true }

      const data = await buildEmailData(workspace_id, pixel_id, domain, trial_ends_at)
      if (!data.userEmail) return { skipped: true }

      const email = pixelTrialDay7Email(data)
      await sendEmail({ to: data.userEmail, subject: email.subject, html: email.html, text: email.text })

      await supabase
        .from('audiencelab_pixels')
        .update({ trial_notified_day7: true })
        .eq('pixel_id', pixel_id)

      return { sent: true }
    })

    // ── Day 10: Urgency warning ──
    await step.sleepUntil('wait-10-days', new Date(Date.now() + 10 * 86_400_000).toISOString())

    await step.run('send-day10-warning', async () => {
      const supabase = createAdminClient()
      const { data: pixel } = await supabase
        .from('audiencelab_pixels')
        .select('trial_status, trial_notified_day10')
        .eq('pixel_id', pixel_id)
        .maybeSingle()

      if (pixel?.trial_status === 'expired' || pixel?.trial_notified_day10) return { skipped: true }

      const data = await buildEmailData(workspace_id, pixel_id, domain, trial_ends_at)
      if (!data.userEmail) return { skipped: true }

      const email = pixelTrialDay10Email(data)
      await sendEmail({ to: data.userEmail, subject: email.subject, html: email.html, text: email.text })

      await supabase
        .from('audiencelab_pixels')
        .update({ trial_notified_day10: true })
        .eq('pixel_id', pixel_id)

      return { sent: true }
    })

    // ── Day 13: Last chance ──
    await step.sleepUntil('wait-13-days', new Date(Date.now() + 13 * 86_400_000).toISOString())

    await step.run('send-day13-lastchance', async () => {
      const supabase = createAdminClient()
      const { data: pixel } = await supabase
        .from('audiencelab_pixels')
        .select('trial_status, trial_notified_day13')
        .eq('pixel_id', pixel_id)
        .maybeSingle()

      if (pixel?.trial_status === 'expired' || pixel?.trial_notified_day13) return { skipped: true }

      const data = await buildEmailData(workspace_id, pixel_id, domain, trial_ends_at)
      if (!data.userEmail) return { skipped: true }

      const email = pixelTrialDay13Email(data)
      await sendEmail({ to: data.userEmail, subject: email.subject, html: email.html, text: email.text })

      await supabase
        .from('audiencelab_pixels')
        .update({ trial_notified_day13: true })
        .eq('pixel_id', pixel_id)

      return { sent: true }
    })

    return { completed: true, domain }
  }
)

// ============================================================
// FUNCTION 2: Daily Trial Expiry Check (cron)
// ============================================================

export const checkPixelTrialExpiry = inngest.createFunction(
  {
    id: 'check-pixel-trial-expiry',
    name: 'Check Pixel Trial Expiry',
    retries: 2,
  },
  { cron: '0 9 * * *' }, // 9am UTC daily
  async ({ step }) => {
    const supabase = createAdminClient()

    // Find pixels whose trial just expired (within last 25 hours)
    const expiredPixels = await step.run('find-expired-trials', async () => {
      const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('audiencelab_pixels')
        .select('pixel_id, workspace_id, domain, trial_ends_at, trial_notified_expired, visitor_count_total, visitor_count_identified')
        .eq('trial_status', 'trial')
        .eq('is_active', true)
        .lt('trial_ends_at', new Date().toISOString())

      if (error) throw error
      return data ?? []
    })

    if (!expiredPixels.length) return { expired: 0 }

    // Process each expired pixel
    let processed = 0
    for (const pixel of expiredPixels) {
      await step.run(`expire-pixel-${pixel.pixel_id}`, async () => {
        // 1. Disable the pixel
        await supabase
          .from('audiencelab_pixels')
          .update({
            trial_status: 'expired',
            is_active: false,
            trial_notified_expired: true,
          })
          .eq('pixel_id', pixel.pixel_id)

        // 2. Send expiry email if not already sent
        if (!pixel.trial_notified_expired) {
          const data = await buildEmailData(
            pixel.workspace_id,
            pixel.pixel_id,
            pixel.domain,
            pixel.trial_ends_at
          )
          if (data.userEmail) {
            const email = pixelTrialExpiredEmail(data)
            await sendEmail({ to: data.userEmail, subject: email.subject, html: email.html, text: email.text })
          }
        }

        processed++
        return { expired: pixel.pixel_id, domain: pixel.domain }
      })
    }

    // Slack summary
    await step.run('slack-summary', async () => {
      if (processed > 0) {
        await sendSlackAlert({
          type: 'pipeline_update',
          severity: 'info',
          message: `Pixel trial expiry: ${processed} pixel(s) disabled, expiry emails sent`,
          metadata: {
            domains: expiredPixels.map((p) => p.domain).join(', '),
          },
        })
      }
    })

    return { expired: processed }
  }
)
