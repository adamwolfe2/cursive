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

    // Step 4: Send client their GHL credentials + onboarding form link
    await step.run('send-credentials-email', async () => {
      const { sendEmail } = await import('@/lib/email/resend-client')
      const { createEmailTemplate } = await import('@/lib/email/resend-client')

      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
      const GHL_LOGIN_URL = `https://app.gohighlevel.com/`
      const onboardingFormUrl = `${APP_URL}/onboarding/dfy?workspace=${workspace_id}`

      const html = createEmailTemplate({
        preheader: 'Your CRM is ready — log in and complete setup',
        title: 'Your CRM Account is Ready',
        content: `
          <h1 class="email-title">Welcome to Cursive, ${user_name.split(' ')[0]}!</h1>
          <p class="email-text">Your dedicated CRM account has been created. Here's everything you need to get started:</p>

          <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0 0 12px 0; font-weight: 600;">Your CRM Login</p>
            <p style="margin: 0 0 8px 0;">Email: <strong>${user_email}</strong></p>
            <p style="margin: 0 0 16px 0;">A password reset link has been sent to your email. Use it to set your password.</p>
            <a href="${GHL_LOGIN_URL}" style="display: inline-block; padding: 10px 24px; background: #111827; color: white; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Log In to Your CRM
            </a>
          </div>

          <div style="background: #eff6ff; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">Next Step: Complete Your Onboarding</p>
            <p style="margin: 0 0 16px 0;">We need a few details about your business to set up your visitor tracking pixel and configure your campaigns.</p>
            <a href="${onboardingFormUrl}" class="email-button" style="margin: 0;">
              Complete Setup (2 min)
            </a>
          </div>

          <div class="email-signature">
            <p style="margin: 0;">— Adam, Founder @ Cursive</p>
          </div>
        `,
      })

      await sendEmail({
        to: user_email,
        subject: `Your Cursive CRM is ready, ${user_name.split(' ')[0]}`,
        html,
      })

      safeLog(`[GHL Sub-Account] Sent credentials email to ${user_email}`)
    })

    // Step 5: Notify admin (Adam) that a new DFY client needs pixel setup
    await step.run('notify-admin', async () => {
      const { sendEmail } = await import('@/lib/email/resend-client')
      const { sendSlackAlert } = await import('@/lib/monitoring/alerts')

      // Email notification
      await sendEmail({
        to: 'adam@meetcursive.com',
        subject: `[ACTION] New DFY client: ${company_name} — needs pixel setup`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px;">
            <h2>New DFY Client Onboarded</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>${company_name}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>${user_email}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Name:</td><td>${user_name}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">GHL Location:</td><td>${locationId}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Workspace:</td><td>${workspace_id}</td></tr>
            </table>
            <h3>Manual Steps Needed:</h3>
            <ol>
              <li>Wait for client to complete onboarding form</li>
              <li>Create pixel in DataShopper/AudienceLab for their website</li>
              <li>Configure native GHL integration to route leads to location ${locationId}</li>
              <li>Set up EmailBison campaign for their outreach</li>
            </ol>
          </div>
        `,
      })

      // Slack notification
      try {
        await sendSlackAlert({
          type: 'new_dfy_client',
          severity: 'info',
          message: `New DFY client: ${company_name} (${user_email}). GHL location: ${locationId}. Needs pixel setup.`,
          metadata: {
            company_name,
            user_email,
            locationId,
            workspace_id,
          },
        })
      } catch {
        // Slack is optional
      }

      safeLog(`[GHL Sub-Account] Admin notified about new DFY client: ${company_name}`)
    })

    // Step 6: Emit pipeline lifecycle event → moves opportunity to WON
    await step.run('emit-pipeline-update', async () => {
      try {
        await inngest.send({
          name: 'ghl/pipeline.update',
          data: {
            user_email,
            workspace_id,
            lifecycle_event: 'subaccount_created',
            metadata: {
              location_id: locationId,
              company_name,
            },
          },
        })
      } catch {
        // Non-blocking
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
