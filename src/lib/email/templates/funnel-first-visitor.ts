/**
 * Funnel — First Visitor "Aha" Email
 *
 * Fired once, the moment a funnel buyer's pixel identifies its first visitor.
 * This is the single highest-leverage retention moment: it proves the product
 * works with the buyer's own real data and pulls them back into the dashboard.
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'

interface FirstVisitorEmailData {
  to: string
  customerName: string | null
  /** Best label for the identified visitor (e.g. "VP Sales at Acme Corp"). */
  visitorHeadline: string
  /** Optional company name for the subject line. */
  companyName: string | null
  /** One-click dashboard login (passwordless) — falls back to portal. */
  dashboardUrl: string
}

export async function sendFunnelFirstVisitorEmail(data: FirstVisitorEmailData) {
  const { to, customerName, visitorHeadline, companyName, dashboardUrl } = data
  const firstName = (customerName ?? '').trim().split(/\s+/)[0] || 'there'
  const subject = companyName
    ? `🎉 Your first visitor: ${companyName}`
    : '🎉 You just identified your first visitor'

  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      ${escapeForEmail(firstName)}, your pixel is officially working. 🎉
    </p>

    <p class="email-text">
      We just identified the first real person browsing your site:
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0;width:100%;">
      <tr>
        <td style="border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;background:#f9fafb;">
          <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">
            ${escapeForEmail(visitorHeadline)}
          </p>
        </td>
      </tr>
    </table>

    <p class="email-text">
      This is just the first — more identified visitors are flowing into your
      dashboard in real time. Open it to see who else is checking you out and
      reach out while they&apos;re still warm.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${dashboardUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            See who visited →
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <div class="email-signature">
      <p style="margin:0 0 4px;">Adam Wolfe<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
    </div>
  `

  try {
    return await sendEmail({
      to,
      from: 'Adam at Cursive <adam@meetcursive.com>',
      subject,
      html: createEmailTemplate({
        preheader: 'Your pixel just identified its first real visitor.',
        title: subject,
        content,
      }),
      text: [
        `${firstName}, your pixel is officially working.`,
        '',
        `We just identified your first visitor: ${visitorHeadline}`,
        '',
        `More are flowing into your dashboard in real time — see who visited: ${dashboardUrl}`,
        '',
        '— Adam Wolfe, Cursive · https://meetcursive.com',
      ].join('\n'),
    })
  } catch (err) {
    safeError('[funnel-first-visitor] send failed:', err)
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
