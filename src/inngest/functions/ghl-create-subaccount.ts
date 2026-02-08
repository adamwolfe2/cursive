/**
 * GHL Create Sub-Account
 *
 * When a done-for-you client subscribes, create a GHL sub-account
 * under Cursive's agency and apply the "AI Agency Growth Funnel" snapshot.
 *
 * Trigger: ghl-admin/create-subaccount
 * Steps:
 *   1. Create sub-account under Cursive's agency + apply snapshot
 *   2. Create GHL user so client can log in (GHL auto-sends invite)
 *   3. Clean up unwanted snapshot assets (internal pipelines, junk fields)
 *   4. Store location ID in workspace settings
 *   5. Tag contact in Cursive's GHL
 *   6. Send branded credentials + onboarding email
 *   7. Notify admin for pixel setup
 *   8. Emit pipeline lifecycle event → WON
 */

import { inngest } from '../client'
import {
  createClientSubAccount,
  createLocationUser,
  cleanupSnapshotAssets,
  findCursiveContactByEmail,
  addCursiveContactTags,
} from '@/lib/integrations/ghl-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

// Snapshot for new client sub-accounts.
// Should be the MINIMAL "Cursive Client Lite" snapshot (lead pipeline + basic fields),
// NOT the full "AI Agency Growth Funnel" ($2k agency snapshot with 108 assets).
// Create the lite snapshot in GHL UI, then set GHL_CLIENT_SNAPSHOT_ID in Vercel.
const CLIENT_SNAPSHOT_ID = process.env.GHL_CLIENT_SNAPSHOT_ID || process.env.GHL_SNAPSHOT_ID || ''

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
        snapshotId: snapshot_id || CLIENT_SNAPSHOT_ID || undefined,
      })

      if (!result.success || !result.locationId) {
        throw new Error(`Failed to create sub-account: ${result.error}`)
      }

      safeLog(`[GHL Sub-Account] Created location: ${result.locationId}`)
      return result.locationId
    })

    // Step 2: Create a GHL user so the client can log in
    // GHL auto-sends an invite email for them to set their password
    const userCreated = await step.run('create-ghl-user', async () => {
      const nameParts = user_name.split(' ')
      const firstName = nameParts[0] || 'User'
      const lastName = nameParts.slice(1).join(' ') || ''

      const result = await createLocationUser(locationId, {
        firstName,
        lastName,
        email: user_email,
        phone: phone || undefined,
        role: 'admin',
      })

      if (!result.success && !result.error?.includes('already exists')) {
        safeError(`[GHL Sub-Account] Failed to create user: ${result.error}`)
        // Don't throw — sub-account is created, user creation is secondary
        // We'll include manual setup instructions in the email
      }

      safeLog(`[GHL Sub-Account] User creation result: ${result.success ? 'OK' : result.error}`)
      return result.success
    })

    // Step 3: Clean up unwanted snapshot assets (internal pipelines, junk fields)
    await step.run('cleanup-snapshot-assets', async () => {
      try {
        const result = await cleanupSnapshotAssets(locationId)
        safeLog(
          `[GHL Sub-Account] Snapshot cleanup: ${result.pipelinesRemoved} pipelines removed, ` +
          `${result.fieldsRemoved} fields removed` +
          (result.errors.length > 0 ? `, ${result.errors.length} errors` : '')
        )
      } catch (error) {
        safeError('[GHL Sub-Account] Snapshot cleanup failed (non-blocking)', error)
        // Non-blocking — cleanup is nice-to-have, not critical
      }
    })

    // Step 4: Store the location ID in workspace settings
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

    // Step 5: Tag the contact in Cursive's GHL and update opportunity
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

    // Step 6: Send client their GHL credentials + onboarding form link
    await step.run('send-credentials-email', async () => {
      const { sendEmail } = await import('@/lib/email/resend-client')
      const { createEmailTemplate } = await import('@/lib/email/resend-client')

      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://leads.meetcursive.com'
      const GHL_LOGIN_URL = `https://app.gohighlevel.com/`
      const onboardingFormUrl = `${APP_URL}/services/onboarding`

      const ghlInviteNote = userCreated
        ? `<p style="margin: 0 0 8px 0;">You should also receive a separate invite email from GoHighLevel to set your password.</p>`
        : `<p style="margin: 0 0 8px 0;">If you don't receive a CRM invite within 10 minutes, reply to this email and we'll get you set up manually.</p>`

      const html = createEmailTemplate({
        preheader: 'Your CRM is ready — log in and complete setup',
        title: 'Your CRM Account is Ready',
        content: `
          <h1 class="email-title">Welcome to Cursive, ${user_name.split(' ')[0]}!</h1>
          <p class="email-text">Your dedicated CRM account has been created and configured with your sales pipeline, onboarding tracker, and appointment calendar. Here's how to get started:</p>

          <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0 0 12px 0; font-weight: 600;">Step 1: Set Up Your CRM Login</p>
            <p style="margin: 0 0 8px 0;">Email: <strong>${user_email}</strong></p>
            ${ghlInviteNote}
            <a href="${GHL_LOGIN_URL}" style="display: inline-block; padding: 10px 24px; background: #111827; color: white; border-radius: 6px; text-decoration: none; font-weight: 500;">
              Log In to Your CRM
            </a>
          </div>

          <div style="background: #eff6ff; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">Step 2: Complete Your Onboarding</p>
            <p style="margin: 0 0 16px 0;">We need a few details about your business to set up your visitor tracking pixel and configure your outreach campaigns.</p>
            <a href="${onboardingFormUrl}" class="email-button" style="margin: 0;">
              Complete Setup (2 min)
            </a>
          </div>

          <div style="background: #f0fdf4; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #22c55e;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #15803d;">What's Already Set Up For You</p>
            <ul style="margin: 0; padding-left: 20px; color: #374151;">
              <li>Lead pipeline to track visitors from your site</li>
              <li>Custom fields for enriched contact data</li>
              <li>Native integration ready for visitor identification</li>
              <li>Discovery call calendar for booking meetings</li>
            </ul>
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

    // Step 7: Notify admin (Adam) that a new DFY client needs pixel setup
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

    // Step 8: Emit pipeline lifecycle event → moves opportunity to WON
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
