/**
 * Funnel Trial Ending Email
 *
 * Sent on customer.subscription.trial_will_end (~3 days before the first
 * charge). Without this, a cold-traffic buyer's first signal that they are
 * being billed is the charge itself — which produces disputes, not customers.
 *
 * Deliberately states the amount, the date, and how to stop it. A trial-end
 * warning that buries the cancel path is worse than no warning at all.
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'
import { FUNNEL_PORTAL_BASE_URL } from '@/lib/stripe/funnel-products'

export async function sendFunnelTrialEndingEmail(data: {
  to: string
  customerName: string | null
  monthlyPriceCents: number
  trialEndsAt: Date | null
}) {
  const firstName = (data.customerName ?? '').trim().split(/\s+/)[0] || 'there'
  const price = `$${(data.monthlyPriceCents / 100).toLocaleString('en-US')}`
  const dateLabel = data.trialEndsAt
    ? data.trialEndsAt.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null
  const whenPhrase = dateLabel ? `on ${dateLabel}` : 'in a few days'

  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Hi ${escapeForEmail(firstName)} — your Cursive free trial ends ${escapeForEmail(whenPhrase)}.
    </p>

    <p class="email-text">
      Nothing has been charged so far. Unless you cancel first, your card will
      be charged ${escapeForEmail(price)} ${escapeForEmail(whenPhrase)}, and
      then monthly after that.
    </p>

    <p class="email-text">
      If Cursive is earning its keep, you don&rsquo;t need to do anything.
      If it isn&rsquo;t, cancel from your portal in one click and you won&rsquo;t
      be charged at all:
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
      <tr>
        <td style="background-color:#111827;border-radius:8px;">
          <a href="${FUNNEL_PORTAL_BASE_URL}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Manage my subscription &rarr;
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <div class="email-signature">
      <p style="margin:0 0 4px;">Adam Wolfe<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
        Reply to this email if you want more time or a different plan — happy to sort it out.
      </p>
    </div>
  `

  try {
    return await sendEmail({
      to: data.to,
      from: 'Adam at Cursive <adam@meetcursive.com>',
      subject: `Your Cursive trial ends ${whenPhrase} — ${price}/month after that`,
      html: createEmailTemplate({
        preheader: `No charge yet. ${price} ${whenPhrase} unless you cancel.`,
        title: 'Your Cursive free trial is ending',
        content,
      }),
      text: [
        `Hi ${firstName} — your Cursive free trial ends ${whenPhrase}.`,
        ``,
        `Nothing has been charged so far. Unless you cancel first, your card`,
        `will be charged ${price} ${whenPhrase}, then monthly after that.`,
        ``,
        `Manage or cancel: ${FUNNEL_PORTAL_BASE_URL}`,
        ``,
        `— Adam Wolfe`,
        `Cursive · https://meetcursive.com`,
      ].join('\n'),
    })
  } catch (err) {
    safeError('[funnel-trial-ending] send failed:', err)
    return { success: false, error: err }
  }
}

function escapeForEmail(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
