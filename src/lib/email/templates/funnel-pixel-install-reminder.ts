/**
 * Funnel Pixel Install Reminder
 *
 * Sent 24h after a funnel pixel is provisioned IF no visitor events have
 * fired yet. Single nudge — we never re-send (pixel_install_reminded_at
 * is set on send).
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function sendFunnelPixelInstallReminderEmail(data: {
  to: string
  customerName: string | null
  domain: string | null
  snippet: string
  portalUrl: string
  testPixelUrl: string
}) {
  const firstName = (data.customerName ?? '').trim().split(/\s+/)[0] || 'there'
  const domain = data.domain ?? 'your site'

  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Hi ${escapeForEmail(firstName)} — did the snippet make it onto ${escapeForEmail(domain)}?
    </p>

    <p class="email-text">
      Your pixel was generated yesterday but we haven&rsquo;t seen any
      traffic come through it yet. That usually means one of two things:
    </p>

    <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#374151;line-height:1.7;">
      <li>The snippet hasn&rsquo;t been pasted on your site yet, or</li>
      <li>Your site doesn&rsquo;t have any visitors yet (in which case,
        you&rsquo;re all good &mdash; it&rsquo;ll start working the moment
        someone lands).</li>
    </ol>

    <!-- Snippet block -->
    <div style="background:#111827;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#6b7280;">
        Your pixel snippet — paste before &lt;/head&gt;
      </p>
      <code style="display:block;font-family:'SF Mono',Consolas,monospace;font-size:11px;line-height:1.5;color:#34d399;word-break:break-all;">${escapeForEmail(data.snippet)}</code>
    </div>

    <p class="email-text" style="font-size:14px;">
      Quickest way: paste before <code style="background:#f4f4f5;padding:1px 5px;border-radius:3px;font-size:12px;">&lt;/head&gt;</code>
      on your site (or add a Custom HTML tag in Google Tag Manager firing
      on All Pages).
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 16px;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${data.portalUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Open Your Portal &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#374151;margin:0 0 20px;">
      Once it&rsquo;s pasted, hit the
      <strong>&ldquo;Test my install&rdquo;</strong> button in your portal
      and we&rsquo;ll check if the snippet is live on your site.
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <div class="email-signature">
      <p style="margin:0 0 4px;">Adam Wolfe<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
        Stuck? Just reply &mdash; takes 1 minute to debug together.
      </p>
    </div>
  `

  try {
    return await sendEmail({
      to: data.to,
      from: 'Adam at Cursive <adam@meetcursive.com>',
      subject: `Did the Cursive snippet land on ${domain}?`,
      html: createEmailTemplate({
        preheader: `Your pixel is ready — we just haven't seen traffic yet.`,
        title: 'Did the snippet make it onto your site?',
        content,
      }),
      text: [
        `Hi ${firstName} — did the snippet make it onto ${domain}?`,
        ``,
        `Your pixel was generated yesterday but we haven't seen any traffic come through yet.`,
        ``,
        `Snippet (paste before </head> on every page):`,
        data.snippet,
        ``,
        `Open your portal: ${data.portalUrl}`,
        `Click "Test my install" to confirm the snippet is live.`,
        ``,
        `Stuck? Reply to this email.`,
        ``,
        `— Adam Wolfe`,
        `Cursive · https://meetcursive.com`,
      ].join('\n'),
    })
  } catch (err) {
    safeError('[funnel-pixel-install-reminder] send failed:', err)
    return { success: false, error: err }
  }
}

function escapeForEmail(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
