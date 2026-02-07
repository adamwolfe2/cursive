/**
 * Lead Notification Service
 * Cursive Platform
 *
 * Sends lead notifications to connected channels (Slack, Zapier).
 * Called from Inngest background jobs after a lead is created/identified.
 *
 * Notifications are best-effort: failures are logged but never thrown.
 */

import { createAdminClient } from '@/lib/supabase/admin'

const LOG_PREFIX = '[Lead Notifications]'

export interface LeadNotification {
  lead_id: string
  email?: string
  first_name?: string
  last_name?: string
  company_name?: string
  title?: string
  phone?: string
  city?: string
  state?: string
  linkedin_url?: string
  intent_score?: number
  status?: string
  source?: string
  created_at?: string
}

/**
 * Get the intent label and emoji for a given score.
 */
function getIntentLabel(score?: number): string {
  if (score == null) return 'Unknown'
  if (score >= 80) return `Hot (${score})`
  if (score >= 50) return `Warm (${score})`
  return `Cold (${score})`
}

function getIntentEmoji(score?: number): string {
  if (score == null) return ''
  if (score >= 80) return '\uD83D\uDD25'
  if (score >= 50) return '\u2600\uFE0F'
  return '\u2744\uFE0F'
}

/**
 * Build the full name from first/last name fields.
 */
function getFullName(lead: LeadNotification): string {
  const parts = [lead.first_name, lead.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : 'Unknown'
}

/**
 * Build the app URL for a lead.
 */
function getLeadUrl(leadId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.meetcursive.com'
  return `${baseUrl}/crm/leads/${leadId}`
}

// ============ Slack Notifications ============

/**
 * Build a Slack Block Kit message for a new lead notification.
 */
function buildSlackBlocks(lead: LeadNotification) {
  const fullName = getFullName(lead)
  const intentEmoji = getIntentEmoji(lead.intent_score)
  const intentLabel = getIntentLabel(lead.intent_score)
  const leadUrl = getLeadUrl(lead.lead_id)

  const fields: Array<{ type: string; text: string }> = []

  fields.push({
    type: 'mrkdwn',
    text: `*Name:*\n${fullName}`,
  })

  if (lead.company_name) {
    fields.push({
      type: 'mrkdwn',
      text: `*Company:*\n${lead.company_name}`,
    })
  }

  if (lead.title) {
    fields.push({
      type: 'mrkdwn',
      text: `*Title:*\n${lead.title}`,
    })
  }

  if (lead.email) {
    fields.push({
      type: 'mrkdwn',
      text: `*Email:*\n${lead.email}`,
    })
  }

  fields.push({
    type: 'mrkdwn',
    text: `*Intent:*\n${intentEmoji} ${intentLabel}`,
  })

  if (lead.source) {
    fields.push({
      type: 'mrkdwn',
      text: `*Source:*\n${lead.source}`,
    })
  }

  if (lead.phone) {
    fields.push({
      type: 'mrkdwn',
      text: `*Phone:*\n${lead.phone}`,
    })
  }

  const location = [lead.city, lead.state].filter(Boolean).join(', ')
  if (location) {
    fields.push({
      type: 'mrkdwn',
      text: `*Location:*\n${location}`,
    })
  }

  const blocks: Array<Record<string, unknown>> = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '\uD83D\uDD25 New Lead Identified',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields,
    },
  ]

  // Add LinkedIn button alongside "View in Cursive" if available
  const actionElements: Array<Record<string, unknown>> = [
    {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'View in Cursive',
        emoji: true,
      },
      url: leadUrl,
      style: 'primary',
    },
  ]

  if (lead.linkedin_url) {
    actionElements.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'LinkedIn Profile',
        emoji: true,
      },
      url: lead.linkedin_url,
    })
  }

  blocks.push({
    type: 'actions',
    elements: actionElements,
  })

  return { blocks }
}

/**
 * Send a lead notification to a Slack webhook.
 * Returns true if successful, false otherwise.
 */
async function notifySlack(
  webhookUrl: string,
  lead: LeadNotification
): Promise<boolean> {
  try {
    const payload = buildSlackBlocks(lead)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const responseText = await response.text().catch(() => '')
      console.error(
        `${LOG_PREFIX} Slack webhook failed: HTTP ${response.status} - ${responseText}`
      )
      return false
    }

    console.log(`${LOG_PREFIX} Slack notification sent for lead ${lead.lead_id}`)
    return true
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`${LOG_PREFIX} Slack webhook error: ${message}`)
    return false
  }
}

// ============ Zapier Notifications ============

/**
 * Send a lead notification to a Zapier webhook.
 * Posts the full lead object as JSON.
 * Returns true if successful, false otherwise.
 */
async function notifyZapier(
  webhookUrl: string,
  lead: LeadNotification
): Promise<boolean> {
  try {
    const payload = {
      event: 'lead.created',
      timestamp: new Date().toISOString(),
      lead: {
        id: lead.lead_id,
        email: lead.email || null,
        first_name: lead.first_name || null,
        last_name: lead.last_name || null,
        full_name: getFullName(lead),
        company_name: lead.company_name || null,
        title: lead.title || null,
        phone: lead.phone || null,
        city: lead.city || null,
        state: lead.state || null,
        linkedin_url: lead.linkedin_url || null,
        intent_score: lead.intent_score ?? null,
        status: lead.status || null,
        source: lead.source || null,
        created_at: lead.created_at || null,
        cursive_url: getLeadUrl(lead.lead_id),
      },
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cursive-Platform/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const responseText = await response.text().catch(() => '')
      console.error(
        `${LOG_PREFIX} Zapier webhook failed: HTTP ${response.status} - ${responseText}`
      )
      return false
    }

    console.log(`${LOG_PREFIX} Zapier notification sent for lead ${lead.lead_id}`)
    return true
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`${LOG_PREFIX} Zapier webhook error: ${message}`)
    return false
  }
}

// ============ Main Notification Orchestrator ============

/**
 * Notify all configured channels for a workspace about a new lead.
 *
 * Looks up workspace users to find slack_webhook_url and zapier_webhook_url,
 * then sends notifications to each configured channel in parallel.
 *
 * This function never throws -- notifications are best-effort.
 */
export async function notifyNewLead(
  workspaceId: string,
  lead: LeadNotification
): Promise<{
  slack: { sent: boolean; count: number }
  zapier: { sent: boolean; count: number }
}> {
  const result = {
    slack: { sent: false, count: 0 },
    zapier: { sent: false, count: 0 },
  }

  try {
    const supabase = createAdminClient()

    // Look up users in the workspace who have webhooks configured
    const { data: users, error } = await supabase
      .from('users')
      .select('id, slack_webhook_url, zapier_webhook_url')
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error(`${LOG_PREFIX} Failed to fetch workspace users: ${error.message}`)
      return result
    }

    if (!users || users.length === 0) {
      console.log(`${LOG_PREFIX} No users found for workspace ${workspaceId}`)
      return result
    }

    // Collect unique webhook URLs
    const slackUrls = new Set<string>()
    const zapierUrls = new Set<string>()

    for (const user of users) {
      if (user.slack_webhook_url) {
        slackUrls.add(user.slack_webhook_url)
      }
      if (user.zapier_webhook_url) {
        zapierUrls.add(user.zapier_webhook_url)
      }
    }

    if (slackUrls.size === 0 && zapierUrls.size === 0) {
      console.log(`${LOG_PREFIX} No webhooks configured for workspace ${workspaceId}`)
      return result
    }

    // Send notifications in parallel
    const promises: Promise<void>[] = []

    for (const url of slackUrls) {
      promises.push(
        notifySlack(url, lead).then((success) => {
          if (success) {
            result.slack.sent = true
            result.slack.count++
          }
        })
      )
    }

    for (const url of zapierUrls) {
      promises.push(
        notifyZapier(url, lead).then((success) => {
          if (success) {
            result.zapier.sent = true
            result.zapier.count++
          }
        })
      )
    }

    await Promise.allSettled(promises)

    console.log(
      `${LOG_PREFIX} Notification results for lead ${lead.lead_id}: ` +
        `Slack=${result.slack.count}/${slackUrls.size}, ` +
        `Zapier=${result.zapier.count}/${zapierUrls.size}`
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`${LOG_PREFIX} Unexpected error in notifyNewLead: ${message}`)
  }

  return result
}
