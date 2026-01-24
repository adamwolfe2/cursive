/**
 * Webhook Delivery Function
 * Cursive Platform
 *
 * Inngest function for async webhook delivery with retries.
 */

import { inngest } from '../client'
import { createClient } from '@supabase/supabase-js'
import {
  deliverWebhook,
  formatLeadPayload,
  calculateNextRetry,
} from '@/lib/services/webhook.service'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Deliver webhook for new lead
 */
export const deliverLeadWebhook = inngest.createFunction(
  {
    id: 'deliver-lead-webhook',
    retries: 5,
  },
  { event: 'lead/created' },
  async ({ event, step }) => {
    const { leadId, workspaceId } = event.data

    // Get workspace webhook settings
    const workspace = await step.run('get-workspace', async () => {
      const supabase = getSupabaseAdmin(); const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, webhook_url, webhook_secret, webhook_enabled')
        .eq('id', workspaceId)
        .single()

      if (error) throw new Error(`Workspace not found: ${error.message}`)
      return data
    })

    // Skip if webhooks not enabled
    if (!workspace.webhook_enabled || !workspace.webhook_url) {
      return { skipped: true, reason: 'Webhooks not enabled' }
    }

    // Get lead data
    const lead = await step.run('get-lead', async () => {
      const supabase = getSupabaseAdmin(); const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (error) throw new Error(`Lead not found: ${error.message}`)
      return data
    })

    // Create webhook delivery record
    const delivery = await step.run('create-delivery-record', async () => {
      const payload = formatLeadPayload(lead)

      const supabase = getSupabaseAdmin(); const { data, error } = await supabase
        .from('webhook_deliveries')
        .insert({
          workspace_id: workspaceId,
          lead_id: leadId,
          event_type: 'lead.created',
          payload,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw new Error(`Failed to create delivery record: ${error.message}`)
      return data
    })

    // Attempt delivery
    const result = await step.run('deliver-webhook', async () => {
      const payload = formatLeadPayload(lead)
      return await deliverWebhook(
        workspace.webhook_url!,
        payload,
        workspace.webhook_secret
      )
    })

    // Update delivery record
    await step.run('update-delivery-record', async () => {
      const supabase = getSupabaseAdmin()
      if (result.success) {
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'success',
            attempts: 1,
            last_attempt_at: new Date().toISOString(),
            response_status: result.statusCode,
            response_body: result.responseBody?.substring(0, 1000),
            completed_at: new Date().toISOString(),
          })
          .eq('id', delivery.id)

        // Mark lead as delivered
        await supabase
          .from('leads')
          .update({
            delivery_status: 'delivered',
            delivered_at: new Date().toISOString(),
            delivery_method: 'webhook',
          })
          .eq('id', leadId)
      } else {
        const nextRetry = calculateNextRetry(1)

        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'retrying',
            attempts: 1,
            last_attempt_at: new Date().toISOString(),
            next_retry_at: nextRetry.toISOString(),
            response_status: result.statusCode,
            response_body: result.responseBody?.substring(0, 1000),
            error_message: result.error,
          })
          .eq('id', delivery.id)
      }

      return result
    })

    return {
      success: result.success,
      deliveryId: delivery.id,
      statusCode: result.statusCode,
      error: result.error,
    }
  }
)

/**
 * Retry failed webhook deliveries
 */
export const retryWebhookDeliveries = inngest.createFunction(
  {
    id: 'retry-webhook-deliveries',
  },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step }) => {
    // Get pending retries
    const deliveries = await step.run('get-pending-retries', async () => {
      const supabase = getSupabaseAdmin(); const { data, error } = await supabase
        .from('webhook_deliveries')
        .select(`
          *,
          workspace:workspaces (
            webhook_url,
            webhook_secret,
            webhook_enabled
          )
        `)
        .eq('status', 'retrying')
        .lte('next_retry_at', new Date().toISOString())
        .lt('attempts', 5)
        .limit(50)

      if (error) throw new Error(`Failed to fetch retries: ${error.message}`)
      return data || []
    })

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      exhausted: 0,
    }

    const supabase = getSupabaseAdmin()

    for (const delivery of deliveries) {
      const workspace = delivery.workspace as any

      if (!workspace?.webhook_enabled || !workspace?.webhook_url) {
        // Mark as failed if webhooks disabled
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'failed',
            error_message: 'Webhooks disabled',
            completed_at: new Date().toISOString(),
          })
          .eq('id', delivery.id)

        results.failed++
        continue
      }

      // Attempt delivery
      const result = await deliverWebhook(
        workspace.webhook_url,
        delivery.payload,
        workspace.webhook_secret
      )

      const newAttempts = delivery.attempts + 1
      results.processed++

      if (result.success) {
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'success',
            attempts: newAttempts,
            last_attempt_at: new Date().toISOString(),
            response_status: result.statusCode,
            response_body: result.responseBody?.substring(0, 1000),
            completed_at: new Date().toISOString(),
          })
          .eq('id', delivery.id)

        // Mark lead as delivered
        if (delivery.lead_id) {
          await supabase
            .from('leads')
            .update({
              delivery_status: 'delivered',
              delivered_at: new Date().toISOString(),
              delivery_method: 'webhook',
            })
            .eq('id', delivery.lead_id)
        }

        results.succeeded++
      } else if (newAttempts >= 5) {
        // Max retries exhausted
        await supabase
          .from('webhook_deliveries')
          .update({
            status: 'failed',
            attempts: newAttempts,
            last_attempt_at: new Date().toISOString(),
            response_status: result.statusCode,
            error_message: `Max retries exhausted: ${result.error}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', delivery.id)

        results.exhausted++
      } else {
        // Schedule next retry
        const nextRetry = calculateNextRetry(newAttempts)

        await supabase
          .from('webhook_deliveries')
          .update({
            attempts: newAttempts,
            last_attempt_at: new Date().toISOString(),
            next_retry_at: nextRetry.toISOString(),
            response_status: result.statusCode,
            error_message: result.error,
          })
          .eq('id', delivery.id)

        results.failed++
      }
    }

    return results
  }
)

/**
 * Send new lead email notification
 */
export const sendLeadEmailNotification = inngest.createFunction(
  {
    id: 'send-lead-email-notification',
    retries: 3,
  },
  { event: 'lead/created' },
  async ({ event, step }) => {
    const { leadId, workspaceId } = event.data

    // Get workspace settings
    const workspace = await step.run('get-workspace', async () => {
      const supabase = getSupabaseAdmin(); const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, email_notifications, notification_email')
        .eq('id', workspaceId)
        .single()

      if (error) throw new Error(`Workspace not found: ${error.message}`)
      return data
    })

    // Skip if email notifications not enabled
    if (!workspace.email_notifications || !workspace.notification_email) {
      return { skipped: true, reason: 'Email notifications not enabled' }
    }

    // Get lead data
    const lead = await step.run('get-lead', async () => {
      const supabase = getSupabaseAdmin(); const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (error) throw new Error(`Lead not found: ${error.message}`)
      return data
    })

    // Send email via Resend
    const emailResult = await step.run('send-email', async () => {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      const { error } = await resend.emails.send({
        from: 'Cursive <notifications@meetcursive.com>',
        to: workspace.notification_email!,
        subject: `New Lead: ${lead.first_name} ${lead.last_name} - ${lead.company_name || 'Unknown Company'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">New Lead Received</h1>
            </div>

            <div style="background: #ffffff; padding: 24px; border: 1px solid #e4e4e7; border-top: none;">
              <h2 style="color: #18181b; margin: 0 0 16px 0; font-size: 18px;">
                ${lead.first_name} ${lead.last_name}
              </h2>

              <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${lead.email}</p>
                ${lead.phone ? `<p style="margin: 0 0 8px 0;"><strong>Phone:</strong> ${lead.phone}</p>` : ''}
                ${lead.company_name ? `<p style="margin: 0 0 8px 0;"><strong>Company:</strong> ${lead.company_name}</p>` : ''}
                ${lead.company_industry ? `<p style="margin: 0 0 8px 0;"><strong>Industry:</strong> ${lead.company_industry}</p>` : ''}
                ${lead.company_location?.city ? `<p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${lead.company_location.city}, ${lead.company_location.state}</p>` : ''}
              </div>

              ${lead.intent_signal ? `
                <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; border-left: 4px solid #22c55e; margin-bottom: 16px;">
                  <p style="margin: 0; color: #166534;"><strong>Intent Signal:</strong> ${lead.intent_signal}</p>
                </div>
              ` : ''}

              <div style="margin-top: 24px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://meetcursive.com'}/leads/${lead.id}"
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                  View Lead Details
                </a>
              </div>
            </div>

            <div style="padding: 16px; text-align: center;">
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                This email was sent by Cursive. <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://meetcursive.com'}/settings" style="color: #7c3aed;">Manage notifications</a>
              </p>
            </div>
          </div>
        `,
      })

      if (error) {
        throw new Error(`Email send failed: ${error.message}`)
      }

      return { success: true }
    })

    // Record notification
    await step.run('record-notification', async () => {
      const supabase = getSupabaseAdmin()
      await supabase.from('email_notifications').insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        email_type: 'new_lead',
        recipient_email: workspace.notification_email,
        subject: `New Lead: ${lead.first_name} ${lead.last_name}`,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
    })

    return { success: true, email: workspace.notification_email }
  }
)
