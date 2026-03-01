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
    <p class="email-text" style="font-size:16px;color:#111827;">
      Great talking with you today! As promised, here's your SuperPixel for
      <strong>${escapeForEmail(displayDomain)}</strong>.
    </p>

    <p class="email-text">
      Paste the snippet below before the closing
      <code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;">&lt;/head&gt;</code>
      tag on your site — takes about 60 seconds. Then sign up at the link below
      and your first identified visitors will start showing up in your dashboard immediately.
    </p>

    <!-- Pixel Snippet Block -->
    <div style="background:#111827;border-radius:8px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">Your pixel snippet — paste before &lt;/head&gt;</p>
      <code style="display:block;font-family:'SF Mono',Consolas,'Courier New',monospace;font-size:12px;line-height:1.6;color:#34d399;word-break:break-all;">${escapeForEmail(snippet)}</code>
      <p style="margin:10px 0 0;font-size:11px;color:#6b7280;">Pixel ID: ${escapeForEmail(pixelId)}</p>
    </div>

    <!-- Install steps -->
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#111827;">3 steps and you&apos;re live:</p>
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#374151;">
                <span style="display:inline-block;width:20px;height:20px;background:#007AFF;color:#fff;border-radius:50%;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:8px;vertical-align:middle;">1</span>
                Copy the snippet above and paste it into your site&apos;s <code style="background:#f4f4f5;padding:1px 5px;border-radius:3px;font-size:12px;">&lt;/head&gt;</code> (or via GTM)
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#374151;">
                <span style="display:inline-block;width:20px;height:20px;background:#007AFF;color:#fff;border-radius:50%;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:8px;vertical-align:middle;">2</span>
                Sign up below — your 14-day free trial starts automatically, no credit card required
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#374151;">
                <span style="display:inline-block;width:20px;height:20px;background:#007AFF;color:#fff;border-radius:50%;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:8px;vertical-align:middle;">3</span>
                Watch your first identified visitors appear — usually within a few minutes of traffic
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${signupUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Create Your Account &amp; See Your Leads →
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <p class="email-text" style="font-size:13px;color:#374151;">
      I&apos;ll check in with you in about 14 days to see how things are going and answer any
      questions. In the meantime, reply to this email any time — I&apos;m happy to help.
    </p>

    <div class="email-signature">
      <p style="margin:0 0 4px;">Darren Hill<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
        Need anything? Reply here or grab time at
        <a href="https://cal.com/gotdarrenhill/30min" style="color:#007AFF;">cal.com/gotdarrenhill/30min</a>
      </p>
    </div>
  `

  try {
    const result = await sendEmail({
      to,
      from: 'Darren at Cursive <darren@meetcursive.com>',
      subject: `Great talking today — here's your SuperPixel for ${displayDomain}`,
      html: createEmailTemplate({
        preheader: `Paste this snippet before </head> and your first leads will appear within minutes.`,
        title: `Your Cursive SuperPixel for ${displayDomain}`,
        content,
      }),
      text: [
        `Great talking with you today!`,
        ``,
        `As promised, here's your SuperPixel for ${displayDomain}.`,
        ``,
        `PIXEL SNIPPET (paste before </head> on every page, or via GTM):`,
        snippet,
        ``,
        `Pixel ID: ${pixelId}`,
        ``,
        `NEXT STEPS:`,
        `1. Paste the snippet into your site's </head> (or via GTM)`,
        `2. Sign up at ${signupUrl} — 14-day free trial, no credit card`,
        `3. Watch your first identified visitors appear within minutes`,
        ``,
        `I'll check in with you in about 14 days. Reply any time if you need anything.`,
        ``,
        `— Darren Hill`,
        `Cursive · https://meetcursive.com`,
      ].join('\n'),
    })
    return result
  } catch (err) {
    safeError('[pixel-delivery] Failed to send pixel delivery email:', err)
    return { success: false, error: err }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Post-Call Recap Email
// Sent instead of the basic pixel delivery email when a full recap is needed.
// Includes pixel snippet, login CTA, next steps, and upsell tease.
// ────────────────────────────────────────────────────────────────────────────

export interface PostCallRecapEmailData {
  to: string
  domain: string
  snippet: string
  pixelId: string
}

export async function sendPostCallRecapEmail(data: PostCallRecapEmailData) {
  const { to, domain, snippet, pixelId } = data
  const loginUrl = 'https://leads.meetcursive.com/welcome?ref=call'
  const calendarLink = 'https://cal.com/gotdarrenhill/30min'
  const displayDomain = domain.replace(/^www\./, '')

  const content = `
    <p class="email-text" style="font-size:16px;color:#111827;">
      Great talking with you today! Here's everything you need to get started — it takes about 60 seconds
      to install and you'll start seeing identified visitors within minutes.
    </p>

    <!-- Pixel Snippet Block -->
    <div style="background:#111827;border-radius:8px;padding:20px 24px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">
        Your SuperPixel for ${escapeForEmail(displayDomain)} — paste before &lt;/head&gt;
      </p>
      <code style="display:block;font-family:'SF Mono',Consolas,'Courier New',monospace;font-size:12px;line-height:1.6;color:#34d399;word-break:break-all;">
        ${escapeForEmail(snippet)}
      </code>
      <p style="margin:10px 0 0;font-size:11px;color:#6b7280;">Pixel ID: ${escapeForEmail(pixelId)}</p>
    </div>

    <!-- Install Instructions -->
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#111827;">Install in 1 line:</p>
      <ol style="margin:0;padding-left:20px;font-size:13px;color:#374151;line-height:1.8;">
        <li>Paste the snippet above before <code style="background:#e5e7eb;padding:1px 5px;border-radius:3px;font-size:12px;">&lt;/head&gt;</code> on your site (or add via Google Tag Manager)</li>
        <li>That's it — your pixel is live immediately</li>
      </ol>
    </div>

    <!-- Login CTA -->
    <p style="font-size:15px;color:#111827;margin:0 0 16px;">
      <strong>Next: claim your account and see your leads</strong>
    </p>
    <p style="font-size:14px;color:#374151;margin:0 0 20px;">
      Log in at the link below. Your pixel is already registered under your domain — as soon as you sign up, your dashboard will start populating with identified visitors.
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
      <tr>
        <td style="background-color:#007AFF;border-radius:8px;">
          <a href="${loginUrl}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            Claim Your Account &amp; See Your Leads →
          </a>
        </td>
      </tr>
    </table>

    <!-- What Happens Next -->
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0c4a6e;">After you log in:</p>
      <ol style="margin:0;padding-left:20px;font-size:13px;color:#0369a1;line-height:1.8;">
        <li>Set your targeting preferences (industry, location, company size)</li>
        <li>We'll immediately pull 200 high-intent leads matching your profile</li>
        <li>Your pixel starts capturing real visitors — each one becomes a named lead in your dashboard</li>
      </ol>
    </div>

    <!-- Upsell Tease -->
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="font-size:13px;color:#374151;margin:0 0 8px;">
      <strong>Want us to do the outreach for you?</strong> Our Outbound team can email and follow up with every identified visitor on your behalf — fully done-for-you, no extra work on your end. Just reply to this email and I'll put together a quick overview.
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

    <div class="email-signature">
      <p style="margin:0 0 4px;">Darren Hill<br/>
      <span style="color:#6b7280;font-size:13px;">Cursive · <a href="https://meetcursive.com" style="color:#007AFF;">meetcursive.com</a></span></p>
      <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
        Questions? Reply here or grab time at
        <a href="${calendarLink}" style="color:#007AFF;">cal.com/gotdarrenhill/30min</a>
      </p>
    </div>
  `

  try {
    const result = await sendEmail({
      to,
      from: 'Darren at Cursive <darren@meetcursive.com>',
      subject: `Your Cursive account is ready — here's what happens next`,
      html: createEmailTemplate({
        preheader: `Your pixel is set up. Log in to see your first leads — takes 60 seconds.`,
        title: `Your Cursive account is ready`,
        content,
      }),
      text: [
        `Great talking with you today!`,
        ``,
        `Your SuperPixel for ${displayDomain}:`,
        snippet,
        ``,
        `Pixel ID: ${pixelId}`,
        ``,
        `INSTALL: Paste the snippet above before </head> on your site (or via GTM).`,
        ``,
        `NEXT STEP — Claim your account:`,
        loginUrl,
        ``,
        `After you log in:`,
        `1. Set your targeting preferences`,
        `2. We pull 200 high-intent leads immediately`,
        `3. Your pixel starts capturing real visitors`,
        ``,
        `Want us to do the outreach for you? Reply to this email and I'll put together a quick overview.`,
        ``,
        `— Darren Hill`,
        `Cursive · https://meetcursive.com`,
        `Questions? ${calendarLink}`,
      ].join('\n'),
    })
    return result
  } catch (err) {
    safeError('[post-call-recap] Failed to send recap email:', err)
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
