// Marketplace Upsell Check
// Monitors credit purchases and triggers upsell emails based on lifetime spend thresholds

import { inngest } from '../client'
import { sendEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'

function buildUpsellEmail(type: 'data' | 'outbound', userName: string, lifetimeSpend: number): { subject: string; html: string } {
  const firstName = userName?.split(' ')[0] || 'there'

  if (type === 'outbound') {
    return {
      subject: `You've spent $${lifetimeSpend.toLocaleString()} on leads — let us do the outreach for you`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="padding:40px 40px 24px;text-align:center;border-bottom:1px solid #e5e7eb;">
          <img src="${APP_URL}/cursive-logo.png" alt="Cursive" style="height:36px;" />
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;line-height:30px;">
            Ready for managed outbound, ${firstName}?
          </h1>
          <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:24px;">
            You've invested <strong>$${lifetimeSpend.toLocaleString()}</strong> in leads through Cursive — that's serious commitment. Our <strong>Cursive Outbound</strong> service can turn those leads into booked meetings with:
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f9fafb;border-radius:8px;margin-bottom:32px;">
            <tr><td style="padding:16px;">
              <p style="margin:0 0 8px;font-size:15px;color:#374151;">&#x2714; Multi-channel sequences (email + LinkedIn + phone)</p>
              <p style="margin:0 0 8px;font-size:15px;color:#374151;">&#x2714; AI-personalized messaging at scale</p>
              <p style="margin:0 0 8px;font-size:15px;color:#374151;">&#x2714; Dedicated campaign manager</p>
              <p style="margin:0;font-size:15px;color:#374151;">&#x2714; Pay only for booked meetings</p>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td align="center">
              <a href="${APP_URL}/activate" style="display:inline-block;padding:14px 36px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                Learn About Outbound
              </a>
            </td></tr>
          </table>
          <p style="margin:32px 0 0;font-size:14px;color:#6b7280;line-height:22px;">
            Or reply to this email — we'll set up a quick call to see if it's a fit.
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">Cursive &middot; AI-powered lead intelligence</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }
  }

  // Data tier upsell ($500+)
  return {
    subject: `You're a power user, ${firstName} — unlock Cursive Data`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="padding:40px 40px 24px;text-align:center;border-bottom:1px solid #e5e7eb;">
          <img src="${APP_URL}/cursive-logo.png" alt="Cursive" style="height:36px;" />
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;line-height:30px;">
            You're getting serious about leads, ${firstName}
          </h1>
          <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:24px;">
            You've spent <strong>$${lifetimeSpend.toLocaleString()}</strong> on leads — you clearly know what works. <strong>Cursive Data</strong> gives you an unfair advantage:
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f9fafb;border-radius:8px;margin-bottom:32px;">
            <tr><td style="padding:16px;">
              <p style="margin:0 0 8px;font-size:15px;color:#374151;">&#x2714; Custom audience building (your ICP, at scale)</p>
              <p style="margin:0 0 8px;font-size:15px;color:#374151;">&#x2714; Priority access to new lead sources</p>
              <p style="margin:0 0 8px;font-size:15px;color:#374151;">&#x2714; Bulk enrichment (1,000+ leads/day)</p>
              <p style="margin:0;font-size:15px;color:#374151;">&#x2714; Dedicated data analyst</p>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td align="center">
              <a href="${APP_URL}/services" style="display:inline-block;padding:14px 36px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                Explore Cursive Data
              </a>
            </td></tr>
          </table>
          <p style="margin:32px 0 0;font-size:14px;color:#6b7280;line-height:22px;">
            Questions? Reply to this email — we'd love to help you scale.
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">Cursive &middot; AI-powered lead intelligence</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

export const marketplaceUpsellCheck = inngest.createFunction(
  { id: 'marketplace-upsell-check', retries: 2 },
  { event: 'marketplace/credit-purchased' },
  async ({ event, step }) => {
    const { workspace_id, user_id, lifetime_spend } = event.data

    // Only check upsell thresholds
    if (lifetime_spend < 500) {
      return { action: 'none', reason: 'spend_below_threshold' }
    }

    // Check if user already has a service subscription
    const hasSubscription = await step.run('check-subscription', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      const { data } = await supabase
        .from('service_subscriptions')
        .select('id')
        .eq('workspace_id', workspace_id)
        .eq('status', 'active')
        .limit(1)

      return (data?.length || 0) > 0
    })

    if (hasSubscription) {
      return { action: 'none', reason: 'already_subscribed' }
    }

    // Record upsell event (idempotent — skip if already recorded for this trigger)
    const { upsellType } = await step.run('record-upsell-event', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      const upsellType = lifetime_spend > 2000 ? 'outbound' : 'data'

      // Check if upsell event already recorded for this workspace + type + trigger
      // to prevent duplicates on retry
      const { data: existing } = await supabase
        .from('upsell_events')
        .select('id')
        .eq('workspace_id', workspace_id)
        .eq('user_id', user_id)
        .eq('upsell_type', upsellType)
        .eq('trigger', 'credit_purchase')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Within last hour
        .limit(1)

      if (existing && existing.length > 0) {
        return { upsellType }
      }

      await supabase.from('upsell_events').insert({
        workspace_id,
        user_id,
        upsell_type: upsellType,
        trigger: 'credit_purchase',
        lifetime_spend: lifetime_spend,
      })

      return { upsellType }
    })

    // Get user email for sending
    const userInfo = await step.run('get-user-info', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      const { data } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', user_id)
        .maybeSingle()

      return { email: data?.email, name: data?.full_name }
    })

    if (!userInfo.email) {
      safeError('[Upsell] No email found for user', user_id)
      return { action: 'none', reason: 'no_email' }
    }

    // Determine which email to send
    if (lifetime_spend > 2000) {
      await step.run('send-outbound-upsell', async () => {
        const { subject, html } = buildUpsellEmail('outbound', userInfo.name || '', lifetime_spend)
        const result = await sendEmail({
          to: userInfo.email!,
          subject,
          html,
          tags: [
            { name: 'category', value: 'upsell' },
            { name: 'type', value: 'outbound' },
          ],
        })
        if (result.success) {
          safeLog(`[Upsell] Sent Outbound upsell email to ${userInfo.email} (spend: $${lifetime_spend})`)
        } else {
          safeError(`[Upsell] Failed to send Outbound upsell email to ${userInfo.email}`, result.error)
        }
      })
      return { action: 'outbound_upsell_sent', upsellType }
    }

    if (lifetime_spend > 500) {
      await step.run('send-data-upsell', async () => {
        const { subject, html } = buildUpsellEmail('data', userInfo.name || '', lifetime_spend)
        const result = await sendEmail({
          to: userInfo.email!,
          subject,
          html,
          tags: [
            { name: 'category', value: 'upsell' },
            { name: 'type', value: 'data' },
          ],
        })
        if (result.success) {
          safeLog(`[Upsell] Sent Data upsell email to ${userInfo.email} (spend: $${lifetime_spend})`)
        } else {
          safeError(`[Upsell] Failed to send Data upsell email to ${userInfo.email}`, result.error)
        }
      })
      return { action: 'data_upsell_sent', upsellType }
    }

    return { action: 'none' }
  }
)
