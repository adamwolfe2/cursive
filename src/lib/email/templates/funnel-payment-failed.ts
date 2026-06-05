/**
 * Funnel Payment Failed (Dunning) Email
 *
 * Sent on invoice.payment_failed when a funnel subscription card declines.
 * Surfaces the Stripe hosted invoice URL so the buyer can pay in 1 click.
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function sendFunnelPaymentFailedEmail(data: {
  to: string
  customerName: string | null
  hostedInvoiceUrl: string | null
}) {
  const firstName = (data.customerName ?? '').trim().split(/\s+/)[0] || 'there'
  const invoiceCta = data.hostedInvoiceUrl
    ? `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
      <tr>
        <td style="background-color:#dc2626;border-radius:8px;">
          <a href="${data.hostedInvoiceUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Update card &amp; pay invoice &rarr;
          </a>
        </td>
      </tr>
    </table>`
    : ''

  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Hi ${escapeForEmail(firstName)} — your last Cursive payment didn&rsquo;t go through.
    </p>

    <p class="email-text">
      No big deal &mdash; usually it&rsquo;s an expired card or a billing
      address mismatch. Update your card in 30 seconds and you&rsquo;re
      back to normal:
    </p>

    ${invoiceCta}

    <p class="email-text" style="font-size:13px;color:#6b7280;">
      Your visitor feed and audience refreshes are paused until the payment
      goes through. Once it does, everything picks back up automatically &mdash;
      no settings to change.
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <div class="email-signature">
      <p style="margin:0 0 4px;">Adam Wolfe<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
        Stripe will retry automatically over the next few days. Reply if
        you&rsquo;d rather we sort it out directly.
      </p>
    </div>
  `

  try {
    return await sendEmail({
      to: data.to,
      from: 'Adam at Cursive <adam@meetcursive.com>',
      subject: 'Your Cursive payment didn\'t go through',
      html: createEmailTemplate({
        preheader: 'Update your card to keep your visitor feed + audience live.',
        title: 'Your Cursive payment didn\'t go through',
        content,
      }),
      text: [
        `Hi ${firstName} — your last Cursive payment didn't go through.`,
        ``,
        data.hostedInvoiceUrl ? `Update your card and pay: ${data.hostedInvoiceUrl}` : '',
        ``,
        `Your visitor feed and audience refreshes are paused until the payment goes through.`,
        ``,
        `— Adam Wolfe`,
        `Cursive · https://meetcursive.com`,
      ]
        .filter(Boolean)
        .join('\n'),
    })
  } catch (err) {
    safeError('[funnel-payment-failed] send failed:', err)
    return { success: false, error: err }
  }
}

function escapeForEmail(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
