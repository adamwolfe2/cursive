// Post-Purchase Nurture Sequence
// 3-email drip triggered after a credit purchase:
//   Email 1 (2h): Getting the most from your leads
//   Email 2 (3d): How top teams use Cursive (social proof)
//   Email 3 (7d): Ready for more? (soft upsell)

import { inngest } from '../client'
import { sendEmail } from '@/lib/email/service'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firstName(fullName?: string | null): string {
  return fullName?.split(' ')[0] || 'there'
}

/**
 * Check whether the user account still exists and the workspace is active.
 * Returns user info when active, null otherwise.
 */
async function getActiveUser(userId: string, workspaceId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, email, full_name, workspace_id')
    .eq('id', userId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!user || !user.email) return null

  // Verify workspace still exists (hasn't been deleted)
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .maybeSingle()

  if (!workspace) return null

  return { email: user.email, name: user.full_name }
}

// ---------------------------------------------------------------------------
// Email builders — branded HTML matching marketplace-upsell style
// ---------------------------------------------------------------------------

function buildEmail1(name: string, credits: number): { subject: string; html: string } {
  const first = firstName(name)
  return {
    subject: `Getting the most from your ${credits} credits, ${first}`,
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
            Get the most from your leads, ${first}
          </h1>
          <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:24px;">
            You just picked up <strong>${credits} credits</strong> &mdash; here are three quick ways to turn them into pipeline:
          </p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f9fafb;border-radius:8px;margin-bottom:32px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:22px;">
                <strong>1. Use filters to find your ICP</strong><br/>
                Industry, company size, job title, location &mdash; narrow down to the leads that actually match your ideal customer.
              </p>
              <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:22px;">
                <strong>2. Check enrichment data</strong><br/>
                Every lead comes with verified email, company info, and intent signals. Use enrichment to prioritize high-intent prospects.
              </p>
              <p style="margin:0;font-size:15px;color:#374151;line-height:22px;">
                <strong>3. Export to your CRM</strong><br/>
                Push leads directly to GoHighLevel, HubSpot, or download as CSV. Skip the manual data entry.
              </p>
            </td></tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td align="center">
              <a href="${APP_URL}/marketplace" style="display:inline-block;padding:14px 36px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                Browse Leads Now
              </a>
            </td></tr>
          </table>
          <p style="margin:32px 0 0;font-size:14px;color:#6b7280;line-height:22px;">
            Questions? Just reply to this email &mdash; a real person reads every one.
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">Cursive &middot; AI-powered lead intelligence</p>
          <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">You're receiving this because you purchased credits on Cursive. <a href="${APP_URL}/settings/notifications" style="color:#9ca3af;">Manage preferences</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

function buildEmail2(name: string): { subject: string; html: string } {
  const first = firstName(name)
  return {
    subject: `How top teams use Cursive to close more deals`,
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
            How top teams use Cursive, ${first}
          </h1>
          <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:24px;">
            We studied the teams with the highest close rates on our platform. Here's what they do differently:
          </p>

          <!-- Case study 1 -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f9fafb;border-radius:8px;margin-bottom:16px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#4f46e5;text-transform:uppercase;letter-spacing:0.5px;">Agency &mdash; B2B SaaS Leads</p>
              <p style="margin:0 0 4px;font-size:15px;color:#374151;line-height:22px;">
                <strong>Strategy:</strong> Filter by intent score 70+, reach out within 24 hours using multi-channel sequences.
              </p>
              <p style="margin:0;font-size:15px;color:#374151;line-height:22px;">
                <strong>Result:</strong> 12% reply rate, 4x higher than industry average cold outreach.
              </p>
            </td></tr>
          </table>

          <!-- Case study 2 -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f9fafb;border-radius:8px;margin-bottom:16px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#4f46e5;text-transform:uppercase;letter-spacing:0.5px;">SaaS Company &mdash; SMB Outbound</p>
              <p style="margin:0 0 4px;font-size:15px;color:#374151;line-height:22px;">
                <strong>Strategy:</strong> Enrich leads, sync to CRM automatically, assign to SDRs same day.
              </p>
              <p style="margin:0;font-size:15px;color:#374151;line-height:22px;">
                <strong>Result:</strong> Cut prospecting time by 60%, doubled meetings booked per rep.
              </p>
            </td></tr>
          </table>

          <!-- Case study 3 -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f9fafb;border-radius:8px;margin-bottom:32px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#4f46e5;text-transform:uppercase;letter-spacing:0.5px;">Consultancy &mdash; Local Service Leads</p>
              <p style="margin:0 0 4px;font-size:15px;color:#374151;line-height:22px;">
                <strong>Strategy:</strong> Location filter + company size, weekly batch export, personalized email sequences.
              </p>
              <p style="margin:0;font-size:15px;color:#374151;line-height:22px;">
                <strong>Result:</strong> 8 new clients in first month, $40K in new revenue from a $500 credit investment.
              </p>
            </td></tr>
          </table>

          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td align="center">
              <a href="${APP_URL}/marketplace" style="display:inline-block;padding:14px 36px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                Find Your Next Customers
              </a>
            </td></tr>
          </table>
          <p style="margin:32px 0 0;font-size:14px;color:#6b7280;line-height:22px;">
            Want a custom strategy for your business? Reply to this email &mdash; we'll share what's working for teams in your industry.
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">Cursive &middot; AI-powered lead intelligence</p>
          <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">You're receiving this because you purchased credits on Cursive. <a href="${APP_URL}/settings/notifications" style="color:#9ca3af;">Manage preferences</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

function buildEmail3(name: string): { subject: string; html: string } {
  const first = firstName(name)
  return {
    subject: `Ready for more leads, ${first}?`,
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
            Ready to scale up, ${first}?
          </h1>
          <p style="margin:0 0 24px;font-size:16px;color:#4b5563;line-height:24px;">
            It's been a week since your last purchase. If you're seeing results (and we hope you are), here are two ways to keep the momentum going:
          </p>

          <!-- Option 1: Buy more credits -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f9fafb;border-radius:8px;margin-bottom:16px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Top up your credits</p>
              <p style="margin:0 0 4px;font-size:15px;color:#374151;line-height:22px;">
                Larger packs get you a lower per-lead cost. Our most popular option:
              </p>
              <p style="margin:8px 0 0;font-size:15px;color:#374151;line-height:22px;">
                &#x2714; <strong>500 credits for $275</strong> ($0.55/lead) &mdash; our best value
              </p>
              <p style="margin:4px 0 0;font-size:15px;color:#374151;line-height:22px;">
                &#x2714; <strong>1,000 credits for $500</strong> ($0.50/lead) &mdash; for power users
              </p>
            </td></tr>
          </table>

          <!-- Option 2: DFY -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f9fafb;border-radius:8px;margin-bottom:32px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;">Go Done-For-You</p>
              <p style="margin:0;font-size:15px;color:#374151;line-height:22px;">
                Let us handle everything &mdash; pixel setup, lead sourcing, enrichment, CRM delivery, and AI-powered outreach. You focus on closing. Starting at <strong>$1,000/mo</strong>.
              </p>
            </td></tr>
          </table>

          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td align="center" style="padding-bottom:12px;">
              <a href="${APP_URL}/marketplace/credits" style="display:inline-block;padding:14px 36px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                Buy More Credits
              </a>
            </td></tr>
            <tr><td align="center">
              <a href="${APP_URL}/services" style="display:inline-block;padding:12px 32px;background-color:#ffffff;color:#4f46e5;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;border:2px solid #4f46e5;">
                Explore Done-For-You
              </a>
            </td></tr>
          </table>
          <p style="margin:32px 0 0;font-size:14px;color:#6b7280;line-height:22px;">
            Not sure which option is right for you? Reply to this email and we'll help you figure it out.
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">Cursive &middot; AI-powered lead intelligence</p>
          <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">You're receiving this because you purchased credits on Cursive. <a href="${APP_URL}/settings/notifications" style="color:#9ca3af;">Manage preferences</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

// ---------------------------------------------------------------------------
// Inngest function
// ---------------------------------------------------------------------------

export const postPurchaseSequence = inngest.createFunction(
  { id: 'post-purchase-sequence', retries: 2 },
  { event: 'marketplace/credit-purchased' },
  async ({ event, step }) => {
    const { workspace_id, user_id, credits } = event.data

    // -----------------------------------------------------------------------
    // Email 1 — 2 hours after purchase
    // "Getting the most from your leads"
    // -----------------------------------------------------------------------

    await step.sleep('wait-2-hours', '2h')

    const email1Result = await step.run('send-email-1-tips', async (): Promise<{ sent: boolean; reason?: string }> => {
      const userInfo = await getActiveUser(user_id, workspace_id)
      if (!userInfo) {
        safeLog('[PostPurchase] Email 1 skipped — user inactive or not found', { user_id })
        return { sent: false, reason: 'user_inactive' }
      }

      const { subject, html } = buildEmail1(userInfo.name || '', credits)
      const result = await sendEmail({
        to: userInfo.email,
        subject,
        html,
        tags: [
          { name: 'category', value: 'post_purchase' },
          { name: 'sequence', value: 'email_1' },
        ],
      })

      if (result.success) {
        safeLog(`[PostPurchase] Email 1 sent to ${userInfo.email}`)
      } else {
        safeError(`[PostPurchase] Email 1 failed for ${userInfo.email}`, result.error)
      }

      return { sent: result.success }
    })

    if (!email1Result.sent && email1Result.reason === 'user_inactive') {
      return { completed: false, reason: 'user_inactive_before_email_1' }
    }

    // -----------------------------------------------------------------------
    // Email 2 — 3 days after purchase
    // "How top teams use Cursive"
    // -----------------------------------------------------------------------

    await step.sleep('wait-3-days', '3d')

    const email2Result = await step.run('send-email-2-social-proof', async (): Promise<{ sent: boolean; reason?: string }> => {
      const userInfo = await getActiveUser(user_id, workspace_id)
      if (!userInfo) {
        safeLog('[PostPurchase] Email 2 skipped — user inactive or not found', { user_id })
        return { sent: false, reason: 'user_inactive' }
      }

      const { subject, html } = buildEmail2(userInfo.name || '')
      const result = await sendEmail({
        to: userInfo.email,
        subject,
        html,
        tags: [
          { name: 'category', value: 'post_purchase' },
          { name: 'sequence', value: 'email_2' },
        ],
      })

      if (result.success) {
        safeLog(`[PostPurchase] Email 2 sent to ${userInfo.email}`)
      } else {
        safeError(`[PostPurchase] Email 2 failed for ${userInfo.email}`, result.error)
      }

      return { sent: result.success }
    })

    if (!email2Result.sent && email2Result.reason === 'user_inactive') {
      return { completed: false, reason: 'user_inactive_before_email_2' }
    }

    // -----------------------------------------------------------------------
    // Email 3 — 7 days after purchase
    // "Ready for more?"
    // -----------------------------------------------------------------------

    await step.sleep('wait-4-more-days', '4d')

    const email3Result = await step.run('send-email-3-upsell', async (): Promise<{ sent: boolean; reason?: string }> => {
      const userInfo = await getActiveUser(user_id, workspace_id)
      if (!userInfo) {
        safeLog('[PostPurchase] Email 3 skipped — user inactive or not found', { user_id })
        return { sent: false, reason: 'user_inactive' }
      }

      const { subject, html } = buildEmail3(userInfo.name || '')
      const result = await sendEmail({
        to: userInfo.email,
        subject,
        html,
        tags: [
          { name: 'category', value: 'post_purchase' },
          { name: 'sequence', value: 'email_3' },
        ],
      })

      if (result.success) {
        safeLog(`[PostPurchase] Email 3 sent to ${userInfo.email}`)
      } else {
        safeError(`[PostPurchase] Email 3 failed for ${userInfo.email}`, result.error)
      }

      return { sent: result.success }
    })

    return {
      completed: true,
      emails_sent: [
        email1Result.sent,
        email2Result.sent,
        email3Result.sent,
      ].filter(Boolean).length,
    }
  }
)
