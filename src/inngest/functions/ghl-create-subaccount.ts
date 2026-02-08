/**
 * GHL Create Sub-Account
 *
 * When a done-for-you client subscribes, create a GHL sub-account
 * under Cursive's agency and apply the "AI Agency Growth Funnel" snapshot.
 *
 * Trigger: ghl-admin/create-subaccount
 * Steps:
 *   1. Create sub-account under Cursive's agency
 *   2. Apply snapshot template
 *   3. Store location ID in workspace settings
 *   4. Update GHL opportunity to "Won"
 */

import { inngest } from '../client'
import {
  createClientSubAccount,
  findCursiveContactByEmail,
  updateCursiveOpportunityStage,
  addCursiveContactTags,
  GHL_STAGES,
} from '@/lib/integrations/ghl-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

// The snapshot ID for Cursive's "AI Agency Growth Funnel"
// This contains all 108 assets: calendars, custom fields, pipelines, etc.
const AI_AGENCY_SNAPSHOT_ID = process.env.GHL_SNAPSHOT_ID || ''

export const ghlCreateSubaccount = inngest.createFunction(
  {
    id: 'ghl-create-subaccount',
    name: 'GHL Create Sub-Account',
    retries: 2,
  },
  { event: 'ghl-admin/create-subaccount' },
  async ({ event, step }) => {
    const {
      user_id,
      user_email,
      user_name,
      company_name,
      phone,
      workspace_id,
      snapshot_id,
    } = event.data

    safeLog(`[GHL Sub-Account] Creating sub-account for ${company_name} (${user_email})`)

    // Step 1: Create the sub-account
    const locationId = await step.run('create-subaccount', async () => {
      const result = await createClientSubAccount({
        name: company_name,
        email: user_email,
        phone: phone || undefined,
        snapshotId: snapshot_id || AI_AGENCY_SNAPSHOT_ID || undefined,
      })

      if (!result.success || !result.locationId) {
        throw new Error(`Failed to create sub-account: ${result.error}`)
      }

      safeLog(`[GHL Sub-Account] Created location: ${result.locationId}`)
      return result.locationId
    })

    // Step 2: Store the location ID in workspace settings
    await step.run('store-location-id', async () => {
      const supabase = createAdminClient()

      // Get current workspace settings
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('settings')
        .eq('id', workspace_id)
        .single()

      const currentSettings = (workspace?.settings as Record<string, unknown>) || {}

      // Update settings with GHL location ID
      const { error } = await supabase
        .from('workspaces')
        .update({
          settings: {
            ...currentSettings,
            ghl_location_id: locationId,
            ghl_account_type: 'done_for_you',
            ghl_setup_completed_at: new Date().toISOString(),
          },
        })
        .eq('id', workspace_id)

      if (error) {
        safeError(`[GHL Sub-Account] Failed to store location ID: ${error.message}`)
        throw error
      }

      safeLog(`[GHL Sub-Account] Stored location ID in workspace settings`)
    })

    // Step 3: Tag the contact in Cursive's GHL and update opportunity
    await step.run('update-ghl-records', async () => {
      const contactId = await findCursiveContactByEmail(user_email)
      if (contactId) {
        await addCursiveContactTags(contactId, [
          'done-for-you',
          'subaccount-created',
          `location-${locationId}`,
        ])
      }
    })

    return {
      success: true,
      locationId,
      workspaceId: workspace_id,
      companyName: company_name,
    }
  }
)
