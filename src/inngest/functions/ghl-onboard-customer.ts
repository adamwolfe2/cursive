/**
 * GHL Onboard Customer
 *
 * When a new customer makes their first purchase (credits or leads),
 * create them as a contact in Cursive's GHL account and open an
 * opportunity in the Agency OS Sales pipeline.
 *
 * Trigger: ghl-admin/onboard-customer (emitted after Stripe payment)
 * Steps:
 *   1. Create or find contact in Cursive's GHL
 *   2. Tag contact based on purchase type
 *   3. Create opportunity in Agency OS pipeline
 */

import { inngest } from '../client'
import {
  createCursiveContact,
  findCursiveContactByEmail,
  addCursiveContactTags,
  createCursiveOpportunity,
  GHL_PIPELINES,
  GHL_STAGES,
} from '@/lib/integrations/ghl-admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export const ghlOnboardCustomer = inngest.createFunction(
  {
    id: 'ghl-onboard-customer',
    name: 'GHL Onboard Customer',
    retries: 3,
  },
  { event: 'ghl-admin/onboard-customer' },
  async ({ event, step }) => {
    const {
      user_id,
      user_email,
      user_name,
      company_name,
      phone,
      workspace_id,
      purchase_type,
      amount,
    } = event.data

    safeLog(`[GHL Onboard] Starting onboarding for ${user_email} (${purchase_type})`)

    // Step 1: Create or find contact in Cursive's GHL
    const contactId = await step.run('create-ghl-contact', async () => {
      // Check if contact already exists
      const existing = await findCursiveContactByEmail(user_email)
      if (existing) {
        safeLog(`[GHL Onboard] Found existing contact: ${existing}`)
        return existing
      }

      // Parse name
      const nameParts = user_name.split(' ')
      const firstName = nameParts[0] || 'Unknown'
      const lastName = nameParts.slice(1).join(' ') || ''

      const result = await createCursiveContact({
        firstName,
        lastName,
        email: user_email,
        phone: phone || undefined,
        companyName: company_name || undefined,
        source: 'Cursive Platform',
        tags: ['cursive-customer', `purchase-${purchase_type}`],
      })

      if (!result.success || !result.contactId) {
        throw new Error(`Failed to create GHL contact: ${result.error}`)
      }

      safeLog(`[GHL Onboard] Created contact: ${result.contactId}`)
      return result.contactId
    })

    // Step 2: Tag based on purchase type and amount
    await step.run('tag-contact', async () => {
      const tags: string[] = ['cursive-customer']

      switch (purchase_type) {
        case 'credit_purchase':
          tags.push('credit-buyer')
          if (amount && amount >= 500) tags.push('high-value')
          break
        case 'lead_purchase':
          tags.push('lead-buyer')
          break
        case 'subscription':
          tags.push('subscriber')
          tags.push('done-for-you')
          break
      }

      await addCursiveContactTags(contactId, tags)
      safeLog(`[GHL Onboard] Tagged contact with: ${tags.join(', ')}`)
    })

    // Step 3: Create opportunity in Agency OS Sales pipeline
    const opportunityId = await step.run('create-opportunity', async () => {
      const nameParts = user_name.split(' ')
      const firstName = nameParts[0] || 'Unknown'

      const result = await createCursiveOpportunity({
        name: `${firstName} - ${purchase_type === 'subscription' ? 'Done-For-You' : 'Self-Serve'} (${user_email})`,
        pipelineId: GHL_PIPELINES.AGENCY_OS_SALES,
        stageId: GHL_STAGES.NEW_LEAD,
        status: 'open',
        contactId,
        monetaryValue: amount || 0,
      })

      if (!result.success) {
        safeError(`[GHL Onboard] Failed to create opportunity: ${result.error}`)
        // Don't throw - contact was already created, opportunity is secondary
        return null
      }

      safeLog(`[GHL Onboard] Created opportunity: ${result.opportunityId}`)
      return result.opportunityId
    })

    // Step 4: Store GHL IDs in workspace settings for future lookups
    await step.run('store-ghl-ids', async () => {
      if (!contactId && !opportunityId) return

      try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()

        const { data: workspace } = await supabase
          .from('workspaces')
          .select('settings')
          .eq('id', workspace_id)
          .single()

        const currentSettings = (workspace?.settings as Record<string, unknown>) || {}

        await supabase
          .from('workspaces')
          .update({
            settings: {
              ...currentSettings,
              ghl_contact_id: contactId,
              ...(opportunityId ? { ghl_opportunity_id: opportunityId } : {}),
            },
          })
          .eq('id', workspace_id)

        safeLog(`[GHL Onboard] Stored GHL IDs in workspace settings`)
      } catch (error) {
        safeError('[GHL Onboard] Failed to store GHL IDs (non-blocking)', error)
      }
    })

    return {
      success: true,
      contactId,
      opportunityId,
      purchaseType: purchase_type,
    }
  }
)
