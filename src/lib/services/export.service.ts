/**
 * Data Export Service
 * Generates CSV and other exports for leads, campaigns, and analytics
 */

import { createClient } from '@/lib/supabase/server'

export type ExportFormat = 'csv' | 'json'

export type ExportType =
  | 'leads'
  | 'campaign_leads'
  | 'email_sends'
  | 'conversations'
  | 'campaign_analytics'
  | 'suppression_list'

export interface ExportOptions {
  format: ExportFormat
  filters?: Record<string, any>
  fields?: string[] // Specific fields to include
  includeHeaders?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ExportResult {
  data: string
  filename: string
  contentType: string
  rowCount: number
}

// ============ Export Functions ============

/**
 * Export leads
 */
export async function exportLeads(
  workspaceId: string,
  options: ExportOptions = { format: 'csv' }
): Promise<ExportResult> {
  const supabase = await createClient()

  let query = supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  // Apply filters
  if (options.filters?.status) {
    query = query.eq('status', options.filters.status)
  }
  if (options.dateRange?.start) {
    query = query.gte('created_at', options.dateRange.start.toISOString())
  }
  if (options.dateRange?.end) {
    query = query.lte('created_at', options.dateRange.end.toISOString())
  }

  const { data, error } = await query.limit(10000)

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`)
  }

  const fields = options.fields || [
    'email',
    'first_name',
    'last_name',
    'full_name',
    'title',
    'company_name',
    'company_domain',
    'phone',
    'linkedin_url',
    'status',
    'timezone',
    'created_at',
  ]

  return formatExport(data || [], fields, 'leads', options)
}

/**
 * Export campaign leads with performance data
 */
export async function exportCampaignLeads(
  workspaceId: string,
  campaignId: string,
  options: ExportOptions = { format: 'csv' }
): Promise<ExportResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('campaign_leads')
    .select(`
      *,
      lead:leads(email, first_name, last_name, company_name, title)
    `)
    .eq('campaign_id', campaignId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(10000)

  if (error) {
    throw new Error(`Failed to fetch campaign leads: ${error.message}`)
  }

  // Flatten data
  const flatData = (data || []).map((row) => ({
    email: row.lead?.email,
    first_name: row.lead?.first_name,
    last_name: row.lead?.last_name,
    company_name: row.lead?.company_name,
    title: row.lead?.title,
    status: row.status,
    current_step: row.current_step,
    enrichment_status: row.enrichment_status,
    created_at: row.created_at,
  }))

  const fields = options.fields || [
    'email',
    'first_name',
    'last_name',
    'company_name',
    'title',
    'status',
    'current_step',
    'enrichment_status',
    'created_at',
  ]

  return formatExport(flatData, fields, `campaign_${campaignId}_leads`, options)
}

/**
 * Export email sends with tracking data
 */
export async function exportEmailSends(
  workspaceId: string,
  options: ExportOptions & { campaignId?: string } = { format: 'csv' }
): Promise<ExportResult> {
  const supabase = await createClient()

  let query = supabase
    .from('email_sends')
    .select(`
      id,
      recipient_email,
      recipient_name,
      subject,
      status,
      sent_at,
      opened_at,
      clicked_at,
      replied_at,
      bounced_at,
      step_number,
      created_at
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (options.campaignId) {
    query = query.eq('campaign_id', options.campaignId)
  }
  if (options.filters?.status) {
    query = query.eq('status', options.filters.status)
  }
  if (options.dateRange?.start) {
    query = query.gte('created_at', options.dateRange.start.toISOString())
  }
  if (options.dateRange?.end) {
    query = query.lte('created_at', options.dateRange.end.toISOString())
  }

  const { data, error } = await query.limit(10000)

  if (error) {
    throw new Error(`Failed to fetch email sends: ${error.message}`)
  }

  const fields = options.fields || [
    'recipient_email',
    'recipient_name',
    'subject',
    'status',
    'sent_at',
    'opened_at',
    'clicked_at',
    'replied_at',
    'step_number',
  ]

  const filename = options.campaignId ? `campaign_${options.campaignId}_emails` : 'email_sends'
  return formatExport(data || [], fields, filename, options)
}

/**
 * Export conversations
 */
export async function exportConversations(
  workspaceId: string,
  options: ExportOptions = { format: 'csv' }
): Promise<ExportResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_conversations')
    .select(`
      id,
      subject_normalized,
      status,
      priority,
      message_count,
      unread_count,
      sentiment,
      intent,
      last_message_at,
      created_at,
      lead:leads(email, first_name, last_name, company_name)
    `)
    .eq('workspace_id', workspaceId)
    .order('last_message_at', { ascending: false })
    .limit(5000)

  if (error) {
    throw new Error(`Failed to fetch conversations: ${error.message}`)
  }

  // Flatten data
  const flatData = (data || []).map((row) => ({
    lead_email: row.lead?.email,
    lead_name: `${row.lead?.first_name || ''} ${row.lead?.last_name || ''}`.trim(),
    company_name: row.lead?.company_name,
    subject: row.subject_normalized,
    status: row.status,
    priority: row.priority,
    message_count: row.message_count,
    unread_count: row.unread_count,
    sentiment: row.sentiment,
    intent: row.intent,
    last_message_at: row.last_message_at,
    created_at: row.created_at,
  }))

  const fields = options.fields || [
    'lead_email',
    'lead_name',
    'company_name',
    'subject',
    'status',
    'priority',
    'message_count',
    'sentiment',
    'intent',
    'last_message_at',
  ]

  return formatExport(flatData, fields, 'conversations', options)
}

/**
 * Export campaign analytics
 */
export async function exportCampaignAnalytics(
  workspaceId: string,
  campaignId: string,
  options: ExportOptions = { format: 'csv' }
): Promise<ExportResult> {
  const supabase = await createClient()

  // Get campaign info
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('id, name, status, started_at, completed_at')
    .eq('id', campaignId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  // Get aggregated stats
  const { data: sends } = await supabase
    .from('email_sends')
    .select('status, sent_at, opened_at, clicked_at, replied_at, bounced_at')
    .eq('campaign_id', campaignId)

  const stats = aggregateEmailStats(sends || [])

  // Get daily breakdown
  const dailyStats = getDailyBreakdown(sends || [])

  const analyticsData = [
    {
      metric: 'Total Sent',
      value: stats.sent,
      rate: '100%',
    },
    {
      metric: 'Delivered',
      value: stats.delivered,
      rate: `${stats.deliveryRate.toFixed(1)}%`,
    },
    {
      metric: 'Opened',
      value: stats.opened,
      rate: `${stats.openRate.toFixed(1)}%`,
    },
    {
      metric: 'Clicked',
      value: stats.clicked,
      rate: `${stats.clickRate.toFixed(1)}%`,
    },
    {
      metric: 'Replied',
      value: stats.replied,
      rate: `${stats.replyRate.toFixed(1)}%`,
    },
    {
      metric: 'Bounced',
      value: stats.bounced,
      rate: `${stats.bounceRate.toFixed(1)}%`,
    },
  ]

  const fields = ['metric', 'value', 'rate']
  return formatExport(analyticsData, fields, `campaign_${campaignId}_analytics`, options)
}

/**
 * Export suppression list
 */
export async function exportSuppressionList(
  workspaceId: string,
  options: ExportOptions = { format: 'csv' }
): Promise<ExportResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('suppressed_emails')
    .select('email, reason, suppressed_at, bounce_type, source')
    .eq('workspace_id', workspaceId)
    .order('suppressed_at', { ascending: false })
    .limit(10000)

  if (error) {
    throw new Error(`Failed to fetch suppression list: ${error.message}`)
  }

  const fields = options.fields || ['email', 'reason', 'bounce_type', 'source', 'suppressed_at']

  return formatExport(data || [], fields, 'suppression_list', options)
}

// ============ Format Helpers ============

/**
 * Format data into export result
 */
function formatExport(
  data: Record<string, any>[],
  fields: string[],
  baseFilename: string,
  options: ExportOptions
): ExportResult {
  const timestamp = new Date().toISOString().split('T')[0]

  if (options.format === 'json') {
    return {
      data: JSON.stringify(data, null, 2),
      filename: `${baseFilename}_${timestamp}.json`,
      contentType: 'application/json',
      rowCount: data.length,
    }
  }

  // CSV format
  const csv = convertToCSV(data, fields, options.includeHeaders !== false)

  return {
    data: csv,
    filename: `${baseFilename}_${timestamp}.csv`,
    contentType: 'text/csv',
    rowCount: data.length,
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: Record<string, any>[], fields: string[], includeHeaders: boolean): string {
  const lines: string[] = []

  // Headers
  if (includeHeaders) {
    lines.push(fields.map(formatHeader).join(','))
  }

  // Data rows
  for (const row of data) {
    const values = fields.map((field) => {
      const value = row[field]
      return escapeCSVValue(value)
    })
    lines.push(values.join(','))
  }

  return lines.join('\n')
}

/**
 * Format field name as header
 */
function formatHeader(field: string): string {
  return field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Escape a value for CSV
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  const str = String(value)

  // Escape quotes and wrap in quotes if necessary
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Aggregate email statistics
 */
function aggregateEmailStats(sends: any[]): {
  sent: number
  delivered: number
  opened: number
  clicked: number
  replied: number
  bounced: number
  deliveryRate: number
  openRate: number
  clickRate: number
  replyRate: number
  bounceRate: number
} {
  const sent = sends.filter((s) => s.sent_at).length
  const delivered = sends.filter((s) => s.sent_at && !s.bounced_at).length
  const opened = sends.filter((s) => s.opened_at).length
  const clicked = sends.filter((s) => s.clicked_at).length
  const replied = sends.filter((s) => s.replied_at).length
  const bounced = sends.filter((s) => s.bounced_at).length

  return {
    sent,
    delivered,
    opened,
    clicked,
    replied,
    bounced,
    deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
    openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
    replyRate: delivered > 0 ? (replied / delivered) * 100 : 0,
    bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
  }
}

/**
 * Get daily breakdown of email stats
 */
function getDailyBreakdown(sends: any[]): Record<string, { sent: number; opened: number; clicked: number }> {
  const daily: Record<string, { sent: number; opened: number; clicked: number }> = {}

  for (const send of sends) {
    if (!send.sent_at) continue

    const date = send.sent_at.split('T')[0]
    if (!daily[date]) {
      daily[date] = { sent: 0, opened: 0, clicked: 0 }
    }

    daily[date].sent++
    if (send.opened_at) daily[date].opened++
    if (send.clicked_at) daily[date].clicked++
  }

  return daily
}
