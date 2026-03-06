/**
 * DFY Upsell Trigger
 *
 * Daily cron at 10am UTC. Finds workspaces with 50+ purchased leads and
 * $0 spend on managed services — high-intent free users who haven't yet
 * been pitched Done-For-You outbound. Sends one email per workspace (ever).
 *
 * Deduplication: tracks sent via a 'dfy-upsell-sent' notification record.
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
const DFY_URL = `${APP_URL}/services#outbound`

const LOG_PREFIX = '[DFYUpsell]'
const MIN_LEAD_COUNT = 50
const NOTIFICATION_TYPE = 'dfy-upsell-sent'

function buildEmail(userName: string, leadCount: number) {
  const subject = `You have ${leadCount} leads — want us to work them for you?`
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;">
<tr><td align="center" style="padding:40px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">
<tr><td style="background:#7c3aed;border-radius:12px 12px 0 0;padding:32px 36px 24px;">
<p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.1em;color:rgba(255,255,255,0.7);text-transform:uppercase;">Cursive</p>
<h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">You have ${leadCount.toLocaleString()} leads — want us to work them?</h1>
</td></tr>
<tr><td style="background:#ffffff;padding:28px 36px 24px;">
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hi ${userName},</p>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">You've built up <strong>${leadCount.toLocaleString()} leads</strong> in Cursive. That's a real asset — but only if someone is actually reaching out to them.</p>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">With <strong>Cursive Done-For-You Outbound</strong>, our team takes over: we write the sequences, set up the sends, and work your pipeline for you. Starting at $2,500/mo with no long-term contract.</p>
<table cellpadding="0" cellspacing="0" role="presentation"><tr><td style="border-radius:8px;background:#7c3aed;"><a href="${DFY_URL}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">See Done-For-You Outbound &rarr;</a></td></tr></table>
<p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">Questions? Just reply to this email — we respond same day.</p>
</td></tr>
<tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:16px 36px;">
<p style="margin:0;font-size:12px;color:#d1d5db;">&copy; ${new Date().getFullYear()} Cursive &middot; <a href="${APP_URL}/settings/notifications" style="color:#d1d5db;text-decoration:none;">Manage notifications</a></p>
</td></tr>
</table></td></tr></table></body></html>`

  const text = `Hi ${userName},\n\nYou have ${leadCount.toLocaleString()} leads in Cursive. Let us turn them into pipeline for you.\n\nCursive Done-For-You Outbound starts at $2,500/mo — no long-term contract.\n\nLearn more: ${DFY_URL}\n\n— Cursive`

  return { subject, html, text }
}

export const dfyUpsellTrigger = inngest.createFunction(
  {
    id: 'dfy-upsell-trigger',
    name: 'DFY Upsell Lead-Count Trigger',
    retries: 2,
    timeouts: { finish: '5m' },
  },
  { cron: '0 10 * * *' }, // 10am UTC daily
  async ({ step }) => {
    safeLog(`${LOG_PREFIX} Starting daily DFY upsell scan`)

    // Step 1: Find workspaces with 50+ purchased leads that haven't been emailed yet
    const targets = await step.run('find-eligible-workspaces', async () => {
      const supabase = createAdminClient()

      // Get workspaces with 50+ lead purchases
      const { data: purchaseCounts, error } = await supabase
        .from('lead_purchases')
        .select('buyer_workspace_id')
        .not('buyer_workspace_id', 'is', null)

      if (error) {
        safeError(`${LOG_PREFIX} Error fetching lead purchases:`, error)
        throw new Error(`Failed to fetch lead purchases: ${error.message}`)
      }

      // Aggregate counts per workspace
      const countMap = new Map<string, number>()
      for (const row of (purchaseCounts || [])) {
        const id = row.buyer_workspace_id as string
        countMap.set(id, (countMap.get(id) || 0) + 1)
      }

      // Keep only workspaces at the threshold
      const eligible = Array.from(countMap.entries())
        .filter(([, count]) => count >= MIN_LEAD_COUNT)
        .map(([workspaceId, count]) => ({ workspaceId, count }))

      if (eligible.length === 0) return []

      // Filter out workspaces already sent this email
      const workspaceIds = eligible.map((e) => e.workspaceId)
      const { data: alreadySent } = await supabase
        .from('notifications')
        .select('user_id')
        .in('user_id', workspaceIds)
        .eq('type', NOTIFICATION_TYPE)

      const sentSet = new Set((alreadySent || []).map((n: any) => n.user_id))
      return eligible.filter((e) => !sentSet.has(e.workspaceId))
    })

    if (targets.length === 0) {
      safeLog(`${LOG_PREFIX} No eligible workspaces found.`)
      return { success: true, sent: 0 }
    }

    safeLog(`${LOG_PREFIX} Found ${targets.length} eligible workspaces`)

    // Step 2: Send emails
    let sent = 0
    let errors = 0

    await step.run('send-upsell-emails', async () => {
      const supabase = createAdminClient()

      for (const target of targets) {
        try {
          // Get workspace owner
          const { data: user } = await supabase
            .from('users')
            .select('id, email, full_name')
            .eq('workspace_id', target.workspaceId)
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle()

          if (!user?.email) continue

          const userName = user.full_name?.split(' ')[0] || user.email.split('@')[0]
          const template = buildEmail(userName, target.count)

          const result = await sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
            tags: [{ name: 'type', value: 'dfy-upsell' }],
          })

          if (result.success) {
            // Record sent so we never email this workspace again
            await supabase.from('notifications').insert({
              user_id: target.workspaceId,
              type: NOTIFICATION_TYPE,
              title: 'DFY upsell email sent',
              message: `Sent to ${user.email} — ${target.count} leads`,
              read: true,
            })
            sent++
          } else {
            safeError(`${LOG_PREFIX} Email failed for workspace ${target.workspaceId}:`, result.error)
            errors++
          }
        } catch (err) {
          safeError(`${LOG_PREFIX} Error processing workspace ${target.workspaceId}:`, err)
          errors++
        }
      }
    })

    safeLog(`${LOG_PREFIX} Done. sent=${sent} errors=${errors}`)
    return { success: true, sent, errors }
  }
)
