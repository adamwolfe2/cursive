/**
 * Funnel Subscription Cancelled Email
 *
 * Sent when Stripe fires customer.subscription.deleted for a funnel order.
 * Confirms the cancellation and tells the buyer exactly what stops:
 *   - pixel events no longer processed
 *   - audience refreshes stop
 *   - portal access revoked
 * Plus how to come back (single re-purchase link).
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com'
const RESUBSCRIBE_URL = `${SITE_URL}/get-leads`

export async function sendFunnelSubscriptionCancelledEmail(data: {
  to: string
  customerName: string | null
  offerLabel: string
}) {
  const firstName = (data.customerName ?? '').trim().split(/\s+/)[0] || 'there'

  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Hi ${escapeForEmail(firstName)} — your Cursive subscription has been
      cancelled. No further charges.
    </p>

    <p class="email-text">
      Here&rsquo;s exactly what changes from here on:
    </p>

    <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#374151;line-height:1.7;">
      <li>Your visitor pixel stops being processed on our end (you can
        leave the snippet on your site or remove it &mdash; it does
        nothing without our backend).</li>
      <li>Weekly audience refreshes stop.</li>
      <li>Your portal link is no longer active.</li>
      <li>Any leads + visitor data we&rsquo;ve already delivered are yours
        to keep.</li>
    </ul>

    <p class="email-text">
      If you want to come back anytime, just re-purchase below and
      we&rsquo;ll set you up with a fresh pixel + fresh audience build.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${RESUBSCRIBE_URL}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Re-subscribe &rarr;
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <div class="email-signature">
      <p style="margin:0 0 4px;">Adam Wolfe<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
        Reply if anything broke or if there&rsquo;s anything I can do better.
      </p>
    </div>
  `

  try {
    return await sendEmail({
      to: data.to,
      from: 'Adam at Cursive <adam@meetcursive.com>',
      subject: `Your Cursive subscription has been cancelled`,
      html: createEmailTemplate({
        preheader: 'No further charges. Here\'s what changes.',
        title: 'Your Cursive subscription has been cancelled',
        content,
      }),
      text: [
        `Hi ${firstName} — your Cursive subscription has been cancelled. No further charges.`,
        ``,
        `What changes:`,
        `- Your visitor pixel stops being processed on our end.`,
        `- Weekly audience refreshes stop.`,
        `- Your portal link is no longer active.`,
        `- Any leads + visitor data already delivered are yours to keep.`,
        ``,
        `Want to come back? Re-subscribe: ${RESUBSCRIBE_URL}`,
        ``,
        `— Adam Wolfe`,
        `Cursive · https://meetcursive.com`,
      ].join('\n'),
    })
  } catch (err) {
    safeError('[funnel-subscription-cancelled] send failed:', err)
    return { success: false, error: err }
  }
}

function escapeForEmail(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
