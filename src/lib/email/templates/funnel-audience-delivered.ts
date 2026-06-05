/**
 * Funnel Audience Delivered Email
 *
 * Sent after admin marks a funnel order delivered with a Google Sheet URL.
 * Includes everything the buyer needs in one place:
 *   - Google Sheet link (the audience itself)
 *   - Portal link (where everything lives long-term + live visitor feed)
 *   - Pixel snippet (so they can re-verify it's installed on every page)
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'

interface FunnelAudienceDeliveredEmailData {
  to: string
  customerName: string | null
  sheetUrl: string
  portalUrl: string
  /** Pixel snippet — included so buyers can re-verify install. */
  pixelSnippet?: string | null
  pixelDomain?: string | null
  pixelId?: string | null
}

export async function sendFunnelAudienceDeliveredEmail(
  data: FunnelAudienceDeliveredEmailData
) {
  const { to, customerName, sheetUrl, portalUrl, pixelSnippet, pixelDomain, pixelId } = data
  const firstName = (customerName ?? '').trim().split(/\s+/)[0] || 'there'
  const hasPixel = !!pixelSnippet

  const pixelSection = hasPixel
    ? `
    <!-- Pixel verification reminder -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#166534;">
        Your Cursive Pixel is live${pixelDomain ? ` on ${escapeForEmail(pixelDomain)}` : ''}
      </p>
      <p style="margin:0 0 12px;font-size:13px;color:#15803d;">
        Identified visitors stream into your portal in real time. If you
        haven&rsquo;t yet, paste the snippet below before
        <code style="background:#fff;padding:1px 5px;border-radius:3px;font-size:12px;">&lt;/head&gt;</code>
        on every page (or via Google Tag Manager).
      </p>
      <div style="background:#111827;border-radius:6px;padding:12px 14px;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#6b7280;">
          Your pixel snippet
        </p>
        <code style="display:block;font-family:'SF Mono',Consolas,monospace;font-size:11px;line-height:1.5;color:#34d399;word-break:break-all;">${escapeForEmail(pixelSnippet ?? '')}</code>
        ${pixelId ? `<p style="margin:8px 0 0;font-size:10px;color:#6b7280;">Pixel ID: ${escapeForEmail(pixelId)}</p>` : ''}
      </div>
    </div>
    `
    : ''

  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Hi ${escapeForEmail(firstName)} — your first audience is live.
    </p>

    <p class="email-text">
      Here&rsquo;s the Google Sheet with your fresh list of people actively
      searching for your product. We&rsquo;ll refresh it every week — same
      link, new rows.
    </p>

    <!-- Primary CTA: open the audience Sheet -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${sheetUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Open Your Audience Sheet &rarr;
          </a>
        </td>
      </tr>
    </table>

    ${pixelSection}

    <!-- Portal CTA — single source of truth for everything -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1e40af;">
        Your portal has everything in one place
      </p>
      <p style="margin:0 0 12px;font-size:13px;color:#1e3a8a;">
        Audience Sheet · live identified-visitor feed${hasPixel ? ' · pixel snippet for re-install' : ''} · billing &amp; subscription.
        Bookmark it — same link forever, fresh data each visit.
      </p>
      <a href="${portalUrl}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:600;color:#1e40af;background:#fff;border:1px solid #bfdbfe;border-radius:6px;text-decoration:none;">
        Open Your Portal &rarr;
      </a>
    </div>

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
        preheader: 'Sheet link + portal + pixel snippet — everything you need.',
        title: 'Your first audience is live',
        content,
      }),
      text: [
        `Hi ${firstName} — your first audience is live.`,
        ``,
        `Open your audience sheet: ${sheetUrl}`,
        ``,
        hasPixel
          ? [
              `Your Cursive Pixel is live${pixelDomain ? ` on ${pixelDomain}` : ''}.`,
              `Identified visitors stream into your portal in real time.`,
              `If you haven't yet, paste this snippet before </head> on every page:`,
              pixelSnippet ?? '',
              pixelId ? `Pixel ID: ${pixelId}` : '',
              '',
            ].join('\n')
          : '',
        `Your portal has everything in one place:`,
        `${portalUrl}`,
        `Audience Sheet · live identified-visitor feed${hasPixel ? ' · pixel snippet' : ''} · billing.`,
        ``,
        `We'll refresh the sheet weekly — same link, new rows.`,
        ``,
        `— Adam Wolfe`,
        `Cursive · https://meetcursive.com`,
      ]
        .filter(Boolean)
        .join('\n'),
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
