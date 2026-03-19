/**
 * Trial Countdown Emails
 *
 * Runs daily at 9am UTC. Sends reminder emails at 3 key moments before trial expiry:
 *   -7 days: "Your trial ends in 7 days"
 *   -3 days: "3 days left — here's what you'll lose"
 *   day-of:  "Your trial expires today"
 *
 * Queries audiencelab_pixels for active trial pixels where trial_ends_at
 * matches one of the target offsets (±12 hour window to handle timezone drift).
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
const UPGRADE_URL = `${APP_URL}/settings/billing`
const _DASHBOARD_URL = `${APP_URL}/leads`

function daysFromNow(n: number): { start: string; end: string } {
  const base = new Date()
  base.setDate(base.getDate() + n)
  const start = new Date(base)
  start.setHours(0, 0, 0, 0)
  const end = new Date(base)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function trialEmail7Day({
  userName,
  trialEndsAt,
  leadCount,
}: {
  userName: string
  trialEndsAt: string
  leadCount: number
}) {
  const subject = `Your Cursive trial ends in 7 days`
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">
<tr><td style="background:#6366f1;border-radius:12px 12px 0 0;padding:32px 36px 24px;">
<p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.1em;color:rgba(255,255,255,0.7);text-transform:uppercase;">Cursive</p>
<h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">7 days left on your pixel trial</h1>
</td></tr>
<tr><td style="background:#ffffff;padding:28px 36px 24px;">
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi ${userName},</p>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Your Cursive trial expires on <strong>${formatDate(trialEndsAt)}</strong>. So far, your pixel has identified <strong>${leadCount.toLocaleString()} visitor${leadCount === 1 ? '' : 's'}</strong> on your website.</p>
<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">When your trial ends, new visitor identification stops. Upgrade now to keep your pixel running 24/7.</p>
<table cellpadding="0" cellspacing="0" role="presentation"><tr><td style="border-radius:8px;background:#6366f1;"><a href="${UPGRADE_URL}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Upgrade My Plan &rarr;</a></td></tr></table>
<p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">Questions? Reply to this email — we're here to help.</p>
</td></tr>
<tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:16px 36px;">
<p style="margin:0;font-size:12px;color:#d1d5db;">&copy; ${new Date().getFullYear()} Cursive &middot; <a href="${APP_URL}/settings/notifications" style="color:#d1d5db;text-decoration:none;">Manage notifications</a></p>
</td></tr>
</table></td></tr></table></body></html>`

  const text = `Hi ${userName},\n\nYour Cursive trial expires on ${formatDate(trialEndsAt)}. Your pixel has identified ${leadCount.toLocaleString()} visitor${leadCount === 1 ? '' : 's'} so far.\n\nUpgrade now to keep your pixel running: ${UPGRADE_URL}\n\n— Cursive`
  return { subject, html, text }
}

function trialEmail3Day({
  userName,
  trialEndsAt,
  leadCount,
  sampleLeads,
}: {
  userName: string
  trialEndsAt: string
  leadCount: number
  sampleLeads: Array<{ name: string; company: string }>
}) {
  const subject = `3 days left — ${leadCount} leads you'll lose if you don't upgrade`
  const leadList = sampleLeads.slice(0, 3).map(l => `<li style="margin-bottom:6px;font-size:14px;color:#374151;">${l.name}${l.company ? ` at ${l.company}` : ''}</li>`).join('')

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">
<tr><td style="background:#ef4444;border-radius:12px 12px 0 0;padding:32px 36px 24px;">
<p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.1em;color:rgba(255,255,255,0.7);text-transform:uppercase;">Cursive</p>
<h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">3 days left — don't lose your leads</h1>
</td></tr>
<tr><td style="background:#ffffff;padding:28px 36px 24px;">
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi ${userName},</p>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Your trial expires <strong>${formatDate(trialEndsAt)}</strong>. After that, your pixel goes dark — no new visitors identified.</p>
${sampleLeads.length > 0 ? `<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111111;">Recent leads you'd stop receiving:</p><ul style="margin:0 0 20px;padding-left:20px;">${leadList}</ul>` : ''}
<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Your pixel has identified <strong>${leadCount.toLocaleString()} visitor${leadCount === 1 ? '' : 's'}</strong> during your trial. Upgrade now to keep the momentum going.</p>
<table cellpadding="0" cellspacing="0" role="presentation"><tr><td style="border-radius:8px;background:#ef4444;"><a href="${UPGRADE_URL}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Upgrade Before It Expires &rarr;</a></td></tr></table>
<p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">Questions? Reply to this email — we're here to help.</p>
</td></tr>
<tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:16px 36px;">
<p style="margin:0;font-size:12px;color:#d1d5db;">&copy; ${new Date().getFullYear()} Cursive &middot; <a href="${APP_URL}/settings/notifications" style="color:#d1d5db;text-decoration:none;">Manage notifications</a></p>
</td></tr>
</table></td></tr></table></body></html>`

  const text = `Hi ${userName},\n\nYour trial expires ${formatDate(trialEndsAt)}. Your pixel has identified ${leadCount.toLocaleString()} visitor${leadCount === 1 ? '' : 's'}.\n\nUpgrade now to keep identifying visitors: ${UPGRADE_URL}\n\n— Cursive`
  return { subject, html, text }
}

function trialEmailDayOf({ userName, trialEndsAt: _trialEndsAt }: { userName: string; trialEndsAt: string }) {
  const subject = `Your Cursive trial expires today`
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">
<tr><td style="background:#111111;border-radius:12px 12px 0 0;padding:32px 36px 24px;">
<p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.1em;color:rgba(255,255,255,0.5);text-transform:uppercase;">Cursive</p>
<h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Your trial expires today</h1>
</td></tr>
<tr><td style="background:#ffffff;padding:28px 36px 24px;">
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi ${userName},</p>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Today is the last day of your Cursive trial. After midnight tonight, your pixel will stop identifying website visitors.</p>
<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Upgrade now — takes 30 seconds — and your pixel stays live without interruption.</p>
<table cellpadding="0" cellspacing="0" role="presentation"><tr><td style="border-radius:8px;background:#6366f1;"><a href="${UPGRADE_URL}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Upgrade Now — 30 seconds &rarr;</a></td></tr></table>
<p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">Still have questions? <a href="mailto:support@meetcursive.com" style="color:#6366f1;">Email us</a> and we'll help you decide.</p>
</td></tr>
<tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:16px 36px;">
<p style="margin:0;font-size:12px;color:#d1d5db;">&copy; ${new Date().getFullYear()} Cursive &middot; <a href="${APP_URL}/settings/notifications" style="color:#d1d5db;text-decoration:none;">Manage notifications</a></p>
</td></tr>
</table></td></tr></table></body></html>`

  const text = `Hi ${userName},\n\nToday is the last day of your Cursive trial. Upgrade now to keep your pixel running: ${UPGRADE_URL}\n\n— Cursive`
  return { subject, html, text }
}

export const trialCountdownEmails = inngest.createFunction(
  {
    id: 'trial-countdown-emails',
    name: 'Trial Countdown Emails',
    retries: 2,
    timeouts: { finish: '10m' },
  },
  { cron: '0 9 * * *' }, // 9am UTC daily
  async ({ step }) => {
    const supabase = createAdminClient()

    const results = { sent7d: 0, sent3d: 0, sentDayOf: 0, errors: 0 }

    // ── 7-day reminder ──────────────────────────────────────────────────────
    await step.run('send-7day-reminders', async () => {
      const { start, end } = daysFromNow(7)
      const { data: pixels } = await supabase
        .from('audiencelab_pixels')
        .select('workspace_id, trial_ends_at, workspaces(id, users(id, email, full_name))')
        .eq('trial_status', 'active')
        .gte('trial_ends_at', start)
        .lte('trial_ends_at', end)

      for (const pixel of (pixels || [])) {
        try {
          const workspace = pixel.workspaces as unknown as { id: string; users: Array<{ id: string; email: string; full_name: string | null }> } | null
          const user = workspace?.users?.[0]
          if (!user?.email) continue

          // Count leads identified during trial
          const { count: leadCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', pixel.workspace_id)
            .or('source.ilike.%pixel%,source.ilike.%superpixel%')

          const template = trialEmail7Day({
            userName: user.full_name?.split(' ')[0] || user.email.split('@')[0],
            trialEndsAt: pixel.trial_ends_at,
            leadCount: leadCount || 0,
          })

          await sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
            tags: [{ name: 'type', value: 'trial-countdown-7d' }],
          })
          results.sent7d++
        } catch (err) {
          safeError('[TrialCountdown] 7d email failed:', err)
          results.errors++
        }
      }
    })

    // ── 3-day reminder ──────────────────────────────────────────────────────
    await step.run('send-3day-reminders', async () => {
      const { start, end } = daysFromNow(3)
      const { data: pixels } = await supabase
        .from('audiencelab_pixels')
        .select('workspace_id, trial_ends_at, workspaces(id, users(id, email, full_name))')
        .eq('trial_status', 'active')
        .gte('trial_ends_at', start)
        .lte('trial_ends_at', end)

      for (const pixel of (pixels || [])) {
        try {
          const workspace = pixel.workspaces as unknown as { id: string; users: Array<{ id: string; email: string; full_name: string | null }> } | null
          const user = workspace?.users?.[0]
          if (!user?.email) continue

          const { count: leadCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', pixel.workspace_id)
            .or('source.ilike.%pixel%,source.ilike.%superpixel%')

          // Fetch 3 recent leads for the email
          const { data: recentLeads } = await supabase
            .from('leads')
            .select('full_name, first_name, last_name, company_name')
            .eq('workspace_id', pixel.workspace_id)
            .or('source.ilike.%pixel%,source.ilike.%superpixel%')
            .order('created_at', { ascending: false })
            .limit(3)

          const sampleLeads = (recentLeads || []).map(l => ({
            name: l.full_name || [l.first_name, l.last_name].filter(Boolean).join(' ') || 'Unknown',
            company: l.company_name || '',
          }))

          const template = trialEmail3Day({
            userName: user.full_name?.split(' ')[0] || user.email.split('@')[0],
            trialEndsAt: pixel.trial_ends_at,
            leadCount: leadCount || 0,
            sampleLeads,
          })

          await sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
            tags: [{ name: 'type', value: 'trial-countdown-3d' }],
          })
          results.sent3d++
        } catch (err) {
          safeError('[TrialCountdown] 3d email failed:', err)
          results.errors++
        }
      }
    })

    // ── Day-of reminder ─────────────────────────────────────────────────────
    await step.run('send-dayof-reminders', async () => {
      const { start, end } = daysFromNow(0)
      const { data: pixels } = await supabase
        .from('audiencelab_pixels')
        .select('workspace_id, trial_ends_at, workspaces(id, users(id, email, full_name))')
        .eq('trial_status', 'active')
        .gte('trial_ends_at', start)
        .lte('trial_ends_at', end)

      for (const pixel of (pixels || [])) {
        try {
          const workspace = pixel.workspaces as unknown as { id: string; users: Array<{ id: string; email: string; full_name: string | null }> } | null
          const user = workspace?.users?.[0]
          if (!user?.email) continue

          const template = trialEmailDayOf({
            userName: user.full_name?.split(' ')[0] || user.email.split('@')[0],
            trialEndsAt: pixel.trial_ends_at,
          })

          await sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
            tags: [{ name: 'type', value: 'trial-countdown-dayof' }],
          })
          results.sentDayOf++
        } catch (err) {
          safeError('[TrialCountdown] day-of email failed:', err)
          results.errors++
        }
      }
    })

    safeLog(`[TrialCountdown] Sent: 7d=${results.sent7d} 3d=${results.sent3d} day-of=${results.sentDayOf} errors=${results.errors}`)
    return results
  }
)
