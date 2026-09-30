/**
 * Slack alerts for the free-leads flow (claim, upgrade intent) on SLACK_SALES_WEBHOOK_URL.
 * A missing webhook or a Slack outage is logged and never fails the user's request.
 * Never include the lead-database vendor's name.
 */
import { safeError, safeWarn } from '@/lib/utils/log-sanitizer'

export async function notifySales(text: string): Promise<void> {
  const url = process.env.SLACK_SALES_WEBHOOK_URL
  if (!url) {
    safeWarn('[free-leads/notify] SLACK_SALES_WEBHOOK_URL not set; alert skipped')
    return
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(3_000),
    })
    if (!res.ok) safeError('[free-leads/notify] Slack rejected alert', { status: res.status })
  } catch (err) {
    safeError('[free-leads/notify] Slack alert failed', String(err))
  }
}

/** Slack mrkdwn-safe: user text cannot inject links, mentions or formatting. */
export function slackSafe(s: string, max = 200): string {
  return s.replace(/[<>&*_~`|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}
