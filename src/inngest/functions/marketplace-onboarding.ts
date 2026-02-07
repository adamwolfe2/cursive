// Marketplace Onboarding Sequence
// Multi-step email drip for first-time marketplace buyers
// Day 0: Welcome, Day 3: Tips, Day 7: Credit check, Day 14: Services upsell

import { inngest } from '../client'

export const marketplaceOnboardingSequence = inngest.createFunction(
  { id: 'marketplace-onboarding-sequence', retries: 2 },
  { event: 'marketplace/first-purchase' },
  async ({ event, step }) => {
    const { workspace_id, user_id, user_email, user_name, credits } = event.data

    // Day 0: Welcome email
    await step.run('send-welcome-email', async () => {
      console.log(`[Onboarding] Day 0: Welcome email to ${user_email}`)
      // In production: send welcome email
      // "Welcome! Here's how to get the most from your leads"
      // Include: how to filter, how to export, how credits work
    })

    // Wait 3 days
    await step.sleep('wait-3-days', '3d')

    // Day 3: Tips email
    await step.run('send-tips-email', async () => {
      console.log(`[Onboarding] Day 3: Tips email to ${user_email}`)
      // "Have you tried filtering by intent score?"
      // Include: advanced filtering tips, best practices
    })

    // Wait 4 more days (Day 7 total)
    await step.sleep('wait-4-days', '4d')

    // Day 7: Credit upsell
    await step.run('send-credit-upsell', async () => {
      // Check current credit balance first
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('credits_balance')
        .eq('id', workspace_id)
        .single()

      const balance = (workspace as any)?.credits_balance || 0

      console.log(`[Onboarding] Day 7: Credit check for ${user_email} (balance: ${balance})`)

      if (balance < 50) {
        // "Running low? Here are your options"
        console.log(`[Onboarding] Day 7: Sending low-credit email to ${user_email}`)
      }
    })

    // Wait 7 more days (Day 14 total)
    await step.sleep('wait-7-days', '7d')

    // Day 14: Services upsell
    await step.run('send-services-upsell', async () => {
      console.log(`[Onboarding] Day 14: Services upsell to ${user_email}`)
      // "Let us handle lead gen for you"
      // Include: Cursive Data overview, pricing, benefits vs self-serve
    })

    return { completed: true, user_email }
  }
)
