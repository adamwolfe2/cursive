/**
 * Funnel Audience Delivered Email
 *
 * Sent after admin marks a funnel order delivered with a Google Sheet URL.
 * Contains the sheet link and a brief note on what to expect (weekly refresh).
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'

interface FunnelAudienceDeliveredEmailData {
  to: string
  customerName: string | null
  sheetUrl: string
  portalUrl: string
}

export async function sendFunnelAudienceDeliveredEmail(
  data: FunnelAudienceDeliveredEmailData
) {
  const { to, customerName, sheetUrl, portalUrl } = data
  const firstName = (customerName ?? '').trim().split(/\s+/)[0] || 'there'

  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Hi ${escapeForEmail(firstName)} — your first audience is live.
    </p>

    <p class="email-text">
      Here's the Google Sheet with your fresh list of people actively searching
      for your product. We'll refresh it every week — same link, new rows.
    </p>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${sheetUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Open Your Audience Sheet →
          </a>
        </td>
      </tr>
    </table>

    <p class="email-text" style="font-size:13px;color:#6b7280;">
      Your portal also has the link if you ever need it:
      <a href="${portalUrl}" style="color:#007AFF;">${portalUrl}</a>
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <div class="email-signature">
      <p style="margin:0 0 4px;">Adam Wolfe<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
        Reply any time with questions — happy to help you put this to work.
      </p>
    </div>
  `

  try {
    return await sendEmail({
      to,
      from: 'Adam at Cursive <adam@meetcursive.com>',
      subject: 'Your first audience is live',
      html: createEmailTemplate({
        preheader: 'Your weekly audience sheet is ready — open the link to see your list.',
        title: 'Your first audience is live',
        content,
      }),
      text: [
        `Hi ${firstName} — your first audience is live.`,
        '',
        `Open your audience sheet: ${sheetUrl}`,
        '',
        `Portal: ${portalUrl}`,
        '',
        `We'll refresh the sheet weekly — same link, new rows.`,
        '',
        `— Adam Wolfe`,
        `Cursive · https://meetcursive.com`,
      ].join('\n'),
    })
  } catch (err) {
    safeError('[funnel-audience-delivered] send failed:', err)
    return { success: false, error: err }
  }
}

function escapeForEmail(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
