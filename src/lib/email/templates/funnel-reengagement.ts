/**
 * Founder Re-Engagement Email
 *
 * Sent to a visitor who entered their email at the pricing gate but did not buy.
 * Deliberately plain and personal: it looks like a 1:1 note from the founder,
 * and it dogfoods the product (our pixel "found" them) as the hook.
 */

import { sendEmail } from '../resend-client'
import { safeError } from '@/lib/utils/log-sanitizer'

const FOUNDER_FROM = 'Adam Wolfe <adam@meetcursive.com>'

interface ReengagementEmailData {
  to: string
  offerUrl: string
}

function escapeForEmail(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendFunnelReengagementEmail(data: ReengagementEmailData): Promise<boolean> {
  const { to, offerUrl } = data

  const body =
    "I just wanted to personally reach out cause our pixel told me you visited our offer page, " +
    "stayed for about 30 seconds, then left! I don't know what else to say other than I'm using " +
    "our own product to convince you to try our product cause it's just that good! Funny enough, " +
    "95% of the business we get comes from me reaching out like this after my pixel told me we had " +
    "a recent website visitor that left without buying, and I'd love to get a pixel live for you in " +
    "less than 60 seconds + a custom audience built of your exact ICP in the next 24 hours so you'll " +
    "never have a lead problem ever again."

  // Intentionally minimal HTML so it reads like a personal note, not a campaign.
  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#ffffff;">
    <div style="max-width:520px;margin:0 auto;padding:28px 20px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#111827;">
      <p style="margin:0 0 16px;">Hey,</p>
      <p style="margin:0 0 20px;">${escapeForEmail(body)}</p>
      <p style="margin:0 0 24px;">
        <a href="${offerUrl}" style="color:#2563eb;font-weight:600;text-decoration:none;">Get your pixel live now &rarr;</a>
      </p>
      <p style="margin:0;color:#111827;">Adam</p>
      <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">Founder, Cursive</p>
    </div>
  </body>
</html>`

  const text = `Hey,\n\n${body}\n\nGet your pixel live now: ${offerUrl}\n\nAdam\nFounder, Cursive`

  try {
    await sendEmail({
      to,
      subject: 'our pixel told me you stopped by',
      html,
      text,
      from: FOUNDER_FROM,
    })
    return true
  } catch (err) {
    safeError('[funnel/reengagement] send failed:', err)
    return false
  }
}
