// Nightly Balance Audit Function
// Verifies partner balance denormalization is accurate
// Runs at 2 AM daily to detect discrepancies

import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { sendSlackAlert } from '@/lib/monitoring/alerts'

interface BalanceDiscrepancy {
  partner_id: string
  partner_name: string
  stored_pending: number
  calculated_pending: number
  pending_diff: number
  stored_available: number
  calculated_available: number
  available_diff: number
  has_discrepancy: boolean
}

export const nightlyBalanceAudit = inngest.createFunction(
  {
    id: 'nightly-balance-audit',
    name: 'Nightly Partner Balance Audit',
    retries: 2,
  },
  { cron: '0 2 * * *' }, // 2 AM daily
  async ({ step }) => {
    const supabase = createAdminClient()

    // Step 1: Run balance audit function
    const discrepancies = await step.run('check-balances', async () => {
      safeLog('Running nightly balance audit...')

      const { data, error } = await supabase.rpc('audit_partner_balances')

      if (error) {
        safeError('Failed to run balance audit:', error)
        throw new Error(`Balance audit failed: ${error.message}`)
      }

      const results = (data || []) as BalanceDiscrepancy[]
      const withDiscrepancies = results.filter(d => d.has_discrepancy)

      safeLog('Balance audit complete', {
        total_partners: results.length,
        discrepancies_found: withDiscrepancies.length,
      })

      return withDiscrepancies
    })

    // Step 2: Alert if discrepancies found
    if (discrepancies.length > 0) {
      await step.run('alert-discrepancies', async () => {
        safeError('Partner balance discrepancies detected!', {
          count: discrepancies.length,
          partners: discrepancies.map((d: BalanceDiscrepancy) => ({
            partner_id: d.partner_id,
            partner_name: d.partner_name,
            pending_diff: d.pending_diff,
            available_diff: d.available_diff,
          })),
        })

        // Log to platform_alerts table for admin dashboard
        await supabase.from('platform_alerts').insert({
          alert_type: 'balance_discrepancy',
          severity: 'high',
          title: `${discrepancies.length} Partner Balance Discrepancies`,
          message: `Found ${discrepancies.length} partners with balance discrepancies during nightly audit.`,
          metadata: {
            discrepancy_count: discrepancies.length,
            partners: discrepancies,
            audit_timestamp: new Date().toISOString(),
          },
        })

        // Send Slack notification to admin
        await sendSlackAlert({
          type: 'system_health',
          severity: 'critical',
          message: `Balance Discrepancies Detected - ${discrepancies.length} Partners`,
          metadata: {
            discrepancy_count: discrepancies.length,
            partners: discrepancies.map((d: BalanceDiscrepancy) => d.partner_name).join(', '),
            action_required: 'Review in admin dashboard and reconcile manually',
            audit_timestamp: new Date().toISOString(),
          },
        })
      })

      // Step 3: Auto-fix discrepancies (optional - can be manually triggered instead)
      // Commenting out for now to require manual review
      // await step.run('fix-discrepancies', async () => {
      //   for (const discrepancy of discrepancies) {
      //     await supabase.rpc('fix_partner_balance', {
      //       p_partner_id: discrepancy.partner_id,
      //     })
      //   }
      // })

      return {
        status: 'discrepancies_found',
        count: discrepancies.length,
        partners: discrepancies.map((d: BalanceDiscrepancy) => d.partner_id),
      }
    }

    // No discrepancies found
    safeLog('Nightly balance audit: All balances accurate')

    return {
      status: 'all_clear',
      count: 0,
    }
  }
)
