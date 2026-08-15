/**
 * Visitor-Estimate Nurture Sequence
 *
 * Cold-lead drip for the public /visitor-estimate VSL calculator.
 * 3 touches: t0 leak recap + book, +2d proof, +5d breakup.
 * Self-contained (no workspace) — suppression via visitor_estimate_leads.unsubscribed_at.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend-client'
import { APP_URL, CAL_BOOKING_URL } from '@/lib/config/urls'
import { signUnsubscribeToken } from '@/lib/utils/unsubscribe-token'

const FROM = 'Adam at Cursive <adam@meetcursive.com>'

/** Escape user-derived values before interpolating into email HTML (defense in depth). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fmtDollar(n?: number): string {
  if (!n || n <= 0) return 'thousands'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n.toLocaleString()}`
}

function unsubscribeUrl(email: string): string {
  const token = signUnsubscribeToken(email)
  return `${APP_URL}/api/unsubscribe?email=${encodeURIComponent(email)}&t=${token}`
}

function shell(email: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="padding:40px;">
      ${bodyHtml}
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e4e4e7;font-size:13px;color:#6b7280;">
        Adam · Cursive · <a href="https://meetcursive.com" style="color:#2563eb;">meetcursive.com</a>
      </div>
    </div>
    <div style="text-align:center;padding:16px;font-size:12px;color:#9ca3af;">
      Sent to ${escapeHtml(email)} because you ran a visitor estimate at Cursive.
      <a href="${unsubscribeUrl(email)}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
    </div>
  </div>
</body></html>`
}

function button(href: string, label: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">${label}</a>
  </div>`
}

export const visitorEstimateNurture = inngest.createFunction(
  {
    id: 'visitor-estimate-nurture',
    name: 'Visitor-Estimate Nurture',
    retries: 2,
    cancelOn: [
      {
        event: 'visitor-estimate/unsubscribed',
        if: 'event.data.email == async.data.email',
      },
    ],
  },
  { event: 'visitor-estimate/captured' },
  async ({ event, step, logger }) => {
    const { email, domain, revenueLeak } = event.data
    if (!email) {
      logger.warn('visitor-estimate/captured fired with no email — skipping')
      return { skipped: true, reason: 'no_email' }
    }

    const siteSubject = (domain || 'your site').replace(/[\r\n]/g, '') // plain text for subject lines
    const site = escapeHtml(domain || 'your site') // escaped for HTML bodies
    const leak = fmtDollar(revenueLeak)

    // Guard: returns true if the lead has unsubscribed since enrollment.
    // Fails CLOSED — on a DB error we skip the send rather than risk emailing
    // someone who opted out (CAN-SPAM).
    const isUnsubscribed = async (): Promise<boolean> => {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('visitor_estimate_leads')
        .select('unsubscribed_at')
        .eq('email', email)
        .maybeSingle()
      if (error) {
        logger.warn('suppression check failed — skipping send (fail closed)', { error })
        return true
      }
      return !!data?.unsubscribed_at
    }

    // ── Email 1: immediate leak recap + book ──────────────────────────────
    await step.run('email-1-recap', async () => {
      if (await isUnsubscribed()) return { skipped: true }
      await sendEmail({
        to: email,
        from: FROM,
        subject: `Your visitor report for ${siteSubject}`,
        html: shell(
          email,
          `<h1 style="font-size:22px;color:#111827;margin:0 0 16px;">Here's what ${site} is leaving on the table</h1>
           <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">
             Based on your numbers, roughly <strong>${leak}/year</strong> in pipeline is walking off your site
             unidentified. Today, 97% of your visitors leave without ever telling you who they are.</p>
           <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 8px;">
             Cursive's Super Pixel identifies up to 70% of them — name, work email, company, and intent — so your
             team can actually follow up. No cookies, no forms, no guesswork.</p>
           ${button(CAL_BOOKING_URL, 'See it running on your site →')}
           <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0;">Want me to set the pixel up for you? Just reply to this email.</p>`
        ),
      })
      logger.info(`Sent visitor-estimate recap to ${email}`)
      return { sent: true }
    })

    await step.sleep('wait-2-days', '2d')

    // ── Email 2: proof / case study ───────────────────────────────────────
    await step.run('email-2-proof', async () => {
      if (await isUnsubscribed()) return { skipped: true }
      await sendEmail({
        to: email,
        from: FROM,
        subject: `How teams turn anonymous traffic into booked calls`,
        html: shell(
          email,
          `<h1 style="font-size:22px;color:#111827;margin:0 0 16px;">From anonymous to named in minutes</h1>
           <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">
             A quick example: a B2B team installing the Super Pixel went from ~2% form-fill identification to
             surfacing thousands of named, intent-scored visitors a month — and routed the hottest ones straight
             to sales the same day.</p>
           <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 8px;">
             The install is 60 seconds. Leads start appearing the same afternoon. Your estimate for ${site}
             suggested <strong>${leak}/year</strong> in recoverable pipeline — worth a 20-minute look.</p>
           ${button(CAL_BOOKING_URL, 'Grab a time →')}`
        ),
      })
      logger.info(`Sent visitor-estimate proof to ${email}`)
      return { sent: true }
    })

    await step.sleep('wait-3-more-days', '3d')

    // ── Email 3: breakup ──────────────────────────────────────────────────
    await step.run('email-3-breakup', async () => {
      if (await isUnsubscribed()) return { skipped: true }
      await sendEmail({
        to: email,
        from: FROM,
        subject: `Closing the loop on ${siteSubject}`,
        html: shell(
          email,
          `<h1 style="font-size:22px;color:#111827;margin:0 0 16px;">Last note from me</h1>
           <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 16px;">
             I don't want to crowd your inbox, so this is my last one for now. The offer stands: if you'd like to
             see exactly who's visiting ${site} — with names and intent — I'm happy to show you live.</p>
           ${button(CAL_BOOKING_URL, 'Book whenever it suits you →')}
           <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0;">
             Either way, thanks for checking out Cursive.</p>`
        ),
      })
      logger.info(`Sent visitor-estimate breakup to ${email}`)
      return { sent: true }
    })

    return { success: true, completed: true }
  }
)
