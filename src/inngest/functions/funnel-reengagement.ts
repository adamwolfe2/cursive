/**
 * Funnel Pricing-Gate Re-Engagement
 *
 * Hourly. Finds visitors who entered their email at the pricing gate but did NOT
 * buy (no converted_at, no order) at least 1 hour ago, and sends them the
 * founder re-engagement email exactly once.
 */

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendFunnelReengagementEmail } from '@/lib/email/templates/funnel-reengagement'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

const LOG_PREFIX = '[funnel-reengagement]'
const DELAY_MS = 60 * 60 * 1000 // 1 hour after capture
const MAX_PER_RUN = 200

export const funnelReengagement = inngest.createFunction(
  { id: 'funnel-reengagement', name: 'Funnel Pricing-Gate Re-Engagement', retries: 1, concurrency: { limit: 1 } },
  { cron: '0 * * * *' },
  async ({ step }) => {
    const captures = await step.run('load-uncontacted', async () => {
      const supabase = createAdminClient()
      const cutoff = new Date(Date.now() - DELAY_MS).toISOString()
      const { data, error } = await supabase
        .from('funnel_email_captures')
        .select('id, email')
        .is('converted_at', null)
        .is('notified_at', null)
        .lt('captured_at', cutoff)
        .order('captured_at', { ascending: true })
        .limit(MAX_PER_RUN)
      if (error) {
        safeError(`${LOG_PREFIX} load failed:`, error)
        return []
      }
      return data || []
    })

    if (captures.length === 0) return { processed: 0, sent: 0 }

    const offerUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://leads.meetcursive.com').replace(/\/$/, '')}/get-leads`

    const results = await Promise.all(
      captures.map((c) =>
        step.run(`reengage-${c.id}`, async () => {
          const supabase = createAdminClient()

          // Defensive: never email someone who actually bought.
          const { data: order } = await supabase
            .from('funnel_orders')
            .select('id')
            .eq('customer_email', c.email)
            .limit(1)
            .maybeSingle()
          if (order) {
            await supabase
              .from('funnel_email_captures')
              .update({ converted_at: new Date().toISOString() })
              .eq('id', c.id)
            return 0
          }

          const ok = await sendFunnelReengagementEmail({ to: c.email, offerUrl })
          if (ok) {
            await supabase
              .from('funnel_email_captures')
              .update({ notified_at: new Date().toISOString() })
              .eq('id', c.id)
            return 1
          }
          return 0
        })
      )
    )

    const sent = results.reduce<number>((a, b) => a + (b as number), 0)
    safeLog(`${LOG_PREFIX} processed ${captures.length}, sent ${sent}`)
    return { processed: captures.length, sent }
  }
)
