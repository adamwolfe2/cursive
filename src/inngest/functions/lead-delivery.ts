// Lead Delivery
// Delivers leads via email, Slack, webhooks, and industry platforms

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

// Helper to get Resend client - only initializes when called
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY environment variable')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export const leadDelivery = inngest.createFunction(
  {
    id: 'lead-delivery',
    name: 'Lead Delivery',
    retries: 2,
    timeout: 300000, // 5 minutes
  },
  { event: 'lead/deliver' },
  async ({ event, step, logger }) => {
    const { lead_id, workspace_id, delivery_channels } = event.data

    // Step 1: Fetch lead and workspace details
    const { lead, workspace, users } = await step.run(
      'fetch-lead-and-workspace',
      async () => {
        const supabase = await createClient()

        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('*, queries(name, global_topics(topic, category))')
          .eq('id', lead_id)
          .single()

        if (leadError) {
          throw new Error(`Failed to fetch lead: ${leadError.message}`)
        }

        const { data: workspaceData, error: workspaceError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspace_id)
          .single()

        if (workspaceError) {
          throw new Error(`Failed to fetch workspace: ${workspaceError.message}`)
        }

        // Get all users in workspace for email delivery
        const { data: usersData } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('workspace_id', workspace_id)

        return {
          lead: leadData,
          workspace: workspaceData,
          users: usersData || [],
        }
      }
    )

    logger.info(`Delivering lead ${lead_id} via: ${delivery_channels.join(', ')}`)

    const companyData = lead.company_data as any
    const contactData = lead.contact_data as any
    const intentData = lead.intent_data as any
    const query = (lead as any).queries

    // Step 2: Email delivery
    if (delivery_channels.includes('email')) {
      await step.run('send-email', async () => {
        try {
          const resend = getResendClient()
          const emailPromises = users.map((user: any) => {
            return resend.emails.send({
              from: 'Cursive <leads@meetcursive.com>',
              to: user.email,
              subject: `New ${intentData?.score?.toUpperCase() || 'Warm'} Lead: ${companyData.name}`,
              html: generateLeadEmailHtml({
                companyData,
                contactData,
                intentData,
                query,
                userName: user.full_name,
              }),
            })
          })

          await Promise.all(emailPromises)
          logger.info(`Email sent to ${users.length} users`)
        } catch (error: any) {
          logger.error('Email delivery failed:', error)
          // Don't throw - continue with other channels
        }
      })
    }

    // Step 3: Slack delivery
    if (delivery_channels.includes('slack')) {
      await step.run('send-slack', async () => {
        try {
          const supabase = await createClient()
          const { data: slackIntegration } = await supabase
            .from('integrations')
            .select('config')
            .eq('workspace_id', workspace_id)
            .eq('type', 'slack')
            .eq('status', 'active')
            .single()

          if (slackIntegration) {
            const webhookUrl = (slackIntegration.config as any)?.webhook_url

            if (webhookUrl) {
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: `🔥 New ${intentData?.score?.toUpperCase() || 'Warm'} Lead`,
                  blocks: [
                    {
                      type: 'header',
                      text: {
                        type: 'plain_text',
                        text: `${getIntentEmoji(intentData?.score)} ${companyData.name}`,
                      },
                    },
                    {
                      type: 'section',
                      fields: [
                        {
                          type: 'mrkdwn',
                          text: `*Query:*\n${query.global_topics.topic}`,
                        },
                        {
                          type: 'mrkdwn',
                          text: `*Intent Score:*\n${intentData?.score?.toUpperCase() || 'N/A'}`,
                        },
                        {
                          type: 'mrkdwn',
                          text: `*Industry:*\n${companyData.industry || 'N/A'}`,
                        },
                        {
                          type: 'mrkdwn',
                          text: `*Employees:*\n${companyData.employee_count || 'N/A'}`,
                        },
                      ],
                    },
                    {
                      type: 'section',
                      text: {
                        type: 'mrkdwn',
                        text: `*Contact:* ${contactData?.primary_contact?.full_name || 'N/A'}\n*Title:* ${contactData?.primary_contact?.title || 'N/A'}\n*Email:* ${contactData?.primary_contact?.email || 'N/A'}`,
                      },
                    },
                    {
                      type: 'actions',
                      elements: [
                        {
                          type: 'button',
                          text: { type: 'plain_text', text: 'View in Dashboard' },
                          url: `https://${(workspace as any).subdomain}.meetcursive.com/data?lead_id=${lead_id}`,
                        },
                      ],
                    },
                  ],
                }),
              })

              logger.info('Slack notification sent')
            }
          }
        } catch (error: any) {
          logger.error('Slack delivery failed:', error)
          // Don't throw - continue with other channels
        }
      })
    }

    // Step 4: Webhook delivery
    if (delivery_channels.includes('webhook')) {
      await step.run('send-webhook', async () => {
        try {
          const supabase = await createClient()
          const { data: webhookIntegration } = await supabase
            .from('integrations')
            .select('config')
            .eq('workspace_id', workspace_id)
            .eq('type', 'webhook')
            .eq('status', 'active')
            .single()

          if (webhookIntegration) {
            const webhookUrl = (webhookIntegration.config as any)?.url

            if (webhookUrl) {
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'lead.created',
                  lead_id,
                  workspace_id,
                  company: companyData,
                  contact: contactData?.primary_contact,
                  intent: intentData,
                  query: query.name,
                  created_at: lead.created_at,
                }),
              })

              logger.info('Webhook notification sent')
            }
          }
        } catch (error: any) {
          logger.error('Webhook delivery failed:', error)
          // Don't throw - continue
        }
      })
    }

    // Step 5: Update lead delivery status
    await step.run('update-delivery-status', async () => {
      const supabase = await createClient()

      await supabase
        .from('leads')
        .update({
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        .eq('id', lead_id)

      logger.info(`Lead ${lead_id} marked as delivered`)
    })

    // Step 6: Upload to industry platform based on intent score
    await step.run('upload-to-platform', async () => {
      // Only upload hot and warm leads
      if (intentData?.score === 'hot' || intentData?.score === 'warm') {
        const industry = companyData.industry || query.global_topics.category

        logger.info(
          `Triggering platform upload for ${intentData.score} lead in ${industry}`
        )

        await inngest.send({
          name: 'lead/upload-to-platform',
          data: {
            lead_ids: [lead_id],
            workspace_id,
            platform: determinePlatform(industry),
            industry,
          },
        })
      }
    })

    return {
      success: true,
      lead_id,
      channels_used: delivery_channels,
    }
  }
)

// Helper: Generate email HTML
function generateLeadEmailHtml(data: {
  companyData: any
  contactData: any
  intentData: any
  query: any
  userName: string
}): string {
  const { companyData, contactData, intentData, query, userName } = data
  const intentEmoji = getIntentEmoji(intentData?.score)

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .intent-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .intent-hot { background: #fee2e2; color: #991b1b; }
          .intent-warm { background: #fed7aa; color: #9a3412; }
          .intent-cold { background: #e0e7ff; color: #3730a3; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .info-item { padding: 15px; background: #f9fafb; border-radius: 6px; }
          .label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
          .value { font-size: 16px; color: #111827; font-weight: 500; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
          .signals { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">${intentEmoji} New Lead Alert</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Hi ${userName}, a new ${intentData?.score || 'warm'} lead was discovered</p>
          </div>
          <div class="content">
            <h2 style="margin: 0 0 10px; font-size: 20px;">${companyData.name}</h2>
            <span class="intent-badge intent-${intentData?.score || 'warm'}">${intentData?.score?.toUpperCase() || 'WARM'} INTENT</span>

            <div class="info-grid">
              <div class="info-item">
                <div class="label">Query</div>
                <div class="value">${query.global_topics.topic}</div>
              </div>
              <div class="info-item">
                <div class="label">Industry</div>
                <div class="value">${companyData.industry || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Employees</div>
                <div class="value">${companyData.employee_count ? companyData.employee_count.toLocaleString() : 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Location</div>
                <div class="value">${companyData.location?.city || companyData.location?.country || 'N/A'}</div>
              </div>
            </div>

            ${contactData?.primary_contact ? `
              <h3 style="margin: 30px 0 15px; font-size: 18px; color: #111827;">Primary Contact</h3>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 6px;">
                <p style="margin: 0 0 8px;"><strong>${contactData.primary_contact.full_name}</strong></p>
                <p style="margin: 0 0 8px; color: #6b7280;">${contactData.primary_contact.title || 'N/A'}</p>
                ${contactData.primary_contact.email ? `<p style="margin: 0; color: #667eea;"><a href="mailto:${contactData.primary_contact.email}" style="color: #667eea; text-decoration: none;">${contactData.primary_contact.email}</a></p>` : ''}
              </div>
            ` : ''}

            ${intentData?.signals && intentData.signals.length > 0 ? `
              <div class="signals">
                <h4 style="margin: 0 0 10px; font-size: 14px; color: #92400e;">Intent Signals (${intentData.signals.length})</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #78350f;">
                  ${intentData.signals.slice(0, 3).map((signal: any) => `<li>${signal.signal_type} (${signal.signal_strength})</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <a href="${companyData.website || companyData.domain}" class="button">Visit Company Website</a>
          </div>
        </div>
      </body>
    </html>
  `
}

// Helper: Get intent emoji
function getIntentEmoji(score: string | undefined): string {
  switch (score) {
    case 'hot':
      return '🔥'
    case 'warm':
      return '⚡'
    case 'cold':
      return '❄️'
    default:
      return '📊'
  }
}

// Helper: Determine platform based on industry
function determinePlatform(industry: string): string {
  const industryLower = industry?.toLowerCase() || ''

  if (industryLower.includes('tech') || industryLower.includes('software')) {
    return 'tech-platform'
  }
  if (industryLower.includes('finance') || industryLower.includes('banking')) {
    return 'finance-platform'
  }
  if (industryLower.includes('health') || industryLower.includes('medical')) {
    return 'healthcare-platform'
  }
  if (industryLower.includes('retail') || industryLower.includes('ecommerce')) {
    return 'retail-platform'
  }
  if (industryLower.includes('marketing') || industryLower.includes('advertising')) {
    return 'marketing-platform'
  }

  return 'general-platform'
}
