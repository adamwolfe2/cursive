/**
 * Gmail Reply Poller — Inngest cron + per-account event
 *
 * Cron (every 5 minutes):
 *   1. Fan out one `gmail/reply.poll-account` event per verified Gmail account
 *
 * Per-account function:
 *   1. Calls pollGmailAccountForReplies(accountId)
 *   2. Best-effort — never throws to the cron, errors are logged
 *
 * This is the Phase 2.5 piece that makes the Outbound Agent's Replying /
 * Meeting Booked stage cards actually move when emails are sent through
 * the workspace's own Gmail account (instead of EmailBison).
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { pollGmailAccountForReplies } from '@/lib/services/gmail/reply-poller.service'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

/**
 * Cron — every 5 minutes, fan out per-account events.
 */
export const gmailReplyPollerCron = inngest.createFunction(
  {
    id: 'gmail-reply-poller-cron',
    name: 'Gmail Reply Poller (cron)',
    retries: 1,
    timeouts: { finish: '2m' },
  },
  { cron: '*/5 * * * *' },
  async ({ step }) => {
    const accountIds = await step.run('list-accounts', async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('provider', 'gmail')
        .eq('is_verified', true)
        .eq('connection_status', 'active')
        .not('oauth_refresh_token_ct', 'is', null)
        .limit(500)

      if (error) {
        safeError('[gmail-poll-cron] failed to list accounts:', error)
        return []
      }
      return (data ?? []).map(r => r.id)
    })

    if (accountIds.length === 0) {
      return { fanned_out: 0 }
    }

    await step.run('fan-out-poll-events', async () => {
      const events = accountIds.map(account_id => ({
        name: 'gmail/reply.poll-account' as const,
        data: { account_id },
      }))
      await inngest.send(events)
    })

    safeLog('[gmail-poll-cron] fanned out', { count: accountIds.length })
    return { fanned_out: accountIds.length }
  }
)

/**
 * Per-account event handler — does the actual polling.
 * Concurrency limited per account so two cron ticks can't race.
 */
export const gmailReplyPollerPerAccount = inngest.createFunction(
  {
    id: 'gmail-reply-poller-per-account',
    name: 'Gmail Reply Poller (per-account)',
    retries: 1,
    timeouts: { finish: '5m' },
    concurrency: { limit: 1, key: 'event.data.account_id' },
    throttle: {
      // Stay well below Gmail's 250 quota units / second per user
      limit: 10,
      period: '1m',
      key: 'event.data.account_id',
    },
  },
  { event: 'gmail/reply.poll-account' },
  async ({ event, logger }) => {
    const { account_id } = event.data
    try {
      const result = await pollGmailAccountForReplies(account_id)
      logger.info(`[gmail-poll] account ${result.email_address}: ${result.inserted}/${result.fetched} new replies`)
      return result
    } catch (err) {
      safeError(`[gmail-poll] account ${account_id} poll failed:`, err)
      return { account_id, error: (err as Error).message }
    }
  }
)
