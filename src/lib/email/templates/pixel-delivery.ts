/**
 * Pixel Delivery Email
 *
 * Sent during / after a sales call when Darren provisions a demo pixel via /deck.
 * Delivers the pixel snippet directly to the prospect so they can install it
 * immediately and then sign up at leads.meetcursive.com to see their leads.
 */

import { sendEmail, createEmailTemplate } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'

export interface PixelDeliveryEmailData {
  to: string
  domain: string
  snippet: string
  pixelId: string
}

export async function sendPixelDeliveryEmail(data: PixelDeliveryEmailData) {
  const { to, domain, snippet, pixelId } = data
  const signupUrl = 'https://leads.meetcursive.com/signup'
  const displayDomain = domain.replace(/^www\./, '')

  const content = `
    <h2 class="email-title">Your Cursive SuperPixel is ready 🎯</h2>

    <p class="email-text">
      Here's your custom pixel for <strong>${displayDomain}</strong>. Paste it before the
      closing <code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;">&lt;/head&gt;</code>
      tag on your website — takes about 60 seconds.
    </p>

    <!-- Pixel Snippet Block -->
    <div style="background:#111827;border-radius:8px;padding:20px 24px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">Your pixel snippet</p>
      <code style="display:block;font-family:'SF Mono',Consolas,'Courier New',monospace;font-size:12px;line-height:1.6;color:#34d399;word-break:break-all;">${escapeForEmail(snippet)}</code>
      <p style="margin:10px 0 0;font-size:11px;color:#6b7280;">Pixel ID: ${escapeForEmail(pixelId)}</p>
    </div>

    <!-- Install instructions -->
    <table style="width:100%;border-collapse:collapse;margin:20px 0;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#111827;">How to install in 3 steps:</p>
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#374151;">
                <span style="display:inline-block;width:20px;height:20px;background:#007AFF;color:#fff;border-radius:50%;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:8px;vertical-align:middle;">1</span>
                Copy the snippet above
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#374151;">
                <span style="display:inline-block;width:20px;height:20px;background:#007AFF;color:#fff;border-radius:50%;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:8px;vertical-align:middle;">2</span>
                Paste it before <code style="background:#f4f4f5;padding:1px 5px;border-radius:3px;font-size:12px;">&lt;/head&gt;</code> on every page (or via Google Tag Manager)
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#374151;">
                <span style="display:inline-block;width:20px;height:20px;background:#007AFF;color:#fff;border-radius:50%;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:8px;vertical-align:middle;">3</span>
                Sign up below to see your identified leads in your dashboard
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${signupUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Sign Up to See Your Leads →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
      Once you install the pixel, sign up at <a href="${signupUrl}" style="color:#007AFF;">${signupUrl}</a>
      using the same domain and your 14-day free trial starts automatically.
      Your identified visitors will start appearing in your dashboard within minutes of first traffic.
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <p style="margin:0 0 6px;font-size:13px;color:#6b7280;"><strong>What you'll see in your dashboard:</strong></p>
    <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">→ Name, email, company, and job title of each identified visitor</p>
    <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">→ Which pages they visited and for how long</p>
    <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">→ Intent score and enriched contact data ready to reach out</p>

    <div class="email-signature">
      <p style="margin:0 0 4px;">Darren<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
        Questions? Reply to this email or book time at
        <a href="https://cal.com/gotdarrenhill/30min" style="color:#007AFF;">cal.com/gotdarrenhill/30min</a>
      </p>
    </div>
  `

  try {
    const result = await sendEmail({
      to,
      subject: `Your Cursive SuperPixel for ${displayDomain} is ready — install in 60 seconds`,
      html: createEmailTemplate({
        preheader: `One script tag in your <head> and you're live. Sign up to see your identified leads.`,
        title: 'Your Cursive SuperPixel is Ready',
        content,
      }),
      text: [
        `Your Cursive SuperPixel for ${displayDomain} is ready.`,
        ``,
        `PIXEL SNIPPET:`,
        snippet,
        ``,
        `HOW TO INSTALL:`,
        `1. Copy the snippet above`,
        `2. Paste it before </head> on every page (or via GTM)`,
        `3. Sign up at ${signupUrl} to see your identified leads`,
        ``,
        `Once installed, sign up and your 14-day free trial starts automatically.`,
        ``,
        `— Darren`,
        `Cursive · https://meetcursive.com`,
      ].join('\n'),
    })
    return result
  } catch (err) {
    safeError('[pixel-delivery] Failed to send pixel delivery email:', err)
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
