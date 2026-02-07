// Marketplace Upsell Check
// Monitors credit purchases and triggers upsell emails based on lifetime spend thresholds

import { inngest } from '../client'

export const marketplaceUpsellCheck = inngest.createFunction(
  { id: 'marketplace-upsell-check', retries: 2 },
  { event: 'marketplace/credit-purchased' },
  async ({ event, step }) => {
    const { workspace_id, user_id, lifetime_spend } = event.data

    // Only check upsell thresholds
    if (lifetime_spend < 500) {
      return { action: 'none', reason: 'spend_below_threshold' }
    }

    // Check if user already has a service subscription
    const hasSubscription = await step.run('check-subscription', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      const { data } = await supabase
        .from('service_subscriptions')
        .select('id')
        .eq('workspace_id', workspace_id)
        .eq('status', 'active')
        .limit(1)

      return (data?.length || 0) > 0
    })

    if (hasSubscription) {
      return { action: 'none', reason: 'already_subscribed' }
    }

    // Record upsell event
    const { upsellType } = await step.run('record-upsell-event', async () => {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      const upsellType = lifetime_spend > 2000 ? 'outbound' : 'data'

      await supabase.from('upsell_events').insert({
        workspace_id,
        user_id,
        upsell_type: upsellType,
        trigger: 'credit_purchase',
        lifetime_spend: lifetime_spend,
      })

      return { upsellType }
    })

    // Determine which email to send
    if (lifetime_spend > 2000) {
      await step.run('send-outbound-upsell', async () => {
        // Send upsell email for Cursive Outbound
        console.log(`[Upsell] Sending Outbound upsell email to user ${user_id} (spend: $${lifetime_spend})`)
        // In production: send via email service
      })
      return { action: 'outbound_upsell_sent', upsellType }
    }

    if (lifetime_spend > 500) {
      await step.run('send-data-upsell', async () => {
        // Send upsell email for Cursive Data
        console.log(`[Upsell] Sending Data upsell email to user ${user_id} (spend: $${lifetime_spend})`)
        // In production: send via email service
      })
      return { action: 'data_upsell_sent', upsellType }
    }

    return { action: 'none' }
  }
)
