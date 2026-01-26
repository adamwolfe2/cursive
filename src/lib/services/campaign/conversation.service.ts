/**
 * Conversation Service
 * Manages email conversation threads and message grouping
 */

import { createClient } from '@/lib/supabase/server'

export interface Conversation {
  id: string
  workspaceId: string
  campaignId: string | null
  leadId: string
  campaignLeadId: string | null
  threadId: string | null
  subjectNormalized: string | null
  status: 'active' | 'waiting_reply' | 'replied' | 'closed' | 'archived'
  lastMessageAt: string
  lastMessageDirection: 'outbound' | 'inbound' | null
  messageCount: number
  unreadCount: number
  sentiment: string | null
  intent: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  tags: string[]
  notes: string | null
  assignedTo: string | null
  createdAt: string
  updatedAt: string
}

export interface ConversationMessage {
  id: string
  conversationId: string
  direction: 'outbound' | 'inbound'
  fromEmail: string
  fromName: string | null
  toEmail: string
  toName: string | null
  subject: string | null
  bodyText: string | null
  bodyHtml: string | null
  snippet: string | null
  messageId: string | null
  sentAt: string | null
  receivedAt: string | null
  openedAt: string | null
  clickedAt: string | null
  isRead: boolean
  readAt: string | null
  classification: Record<string, any>
  isAutoReply: boolean
  isOutOfOffice: boolean
  createdAt: string
}

export interface ConversationWithLead extends Conversation {
  lead: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    fullName: string | null
    companyName: string | null
    title: string | null
  }
  campaign?: {
    id: string
    name: string
  }
  latestMessage?: {
    snippet: string
    direction: 'outbound' | 'inbound'
    sentAt: string | null
  }
}

export interface ConversationFilters {
  status?: Conversation['status'] | Conversation['status'][]
  campaignId?: string
  leadId?: string
  priority?: Conversation['priority']
  hasUnread?: boolean
  sentiment?: string
  intent?: string
  search?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: 'last_message_at' | 'created_at' | 'unread_count'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Get conversations for a workspace with filtering
 */
export async function getConversations(
  workspaceId: string,
  filters: ConversationFilters = {},
  pagination: PaginationParams = {}
): Promise<{ conversations: ConversationWithLead[]; total: number }> {
  const supabase = await createClient()

  const page = pagination.page || 1
  const limit = Math.min(pagination.limit || 20, 100)
  const offset = (page - 1) * limit
  const sortBy = pagination.sortBy || 'last_message_at'
  const sortOrder = pagination.sortOrder || 'desc'

  let query = supabase
    .from('email_conversations')
    .select(
      `
      *,
      lead:leads(id, email, first_name, last_name, full_name, company_name, title),
      campaign:email_campaigns(id, name)
    `,
      { count: 'exact' }
    )
    .eq('workspace_id', workspaceId)

  // Apply filters
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  if (filters.campaignId) {
    query = query.eq('campaign_id', filters.campaignId)
  }

  if (filters.leadId) {
    query = query.eq('lead_id', filters.leadId)
  }

  if (filters.priority) {
    query = query.eq('priority', filters.priority)
  }

  if (filters.hasUnread) {
    query = query.gt('unread_count', 0)
  }

  if (filters.sentiment) {
    query = query.eq('sentiment', filters.sentiment)
  }

  if (filters.intent) {
    query = query.eq('intent', filters.intent)
  }

  if (filters.search) {
    query = query.ilike('subject_normalized', `%${filters.search}%`)
  }

  // Apply sorting and pagination
  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch conversations: ${error.message}`)
  }

  // Get latest message for each conversation
  const conversationIds = (data || []).map((c) => c.id)
  const { data: latestMessages } = await supabase
    .from('conversation_messages')
    .select('conversation_id, snippet, direction, sent_at')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false })

  // Group latest messages by conversation
  const messageMap = new Map<string, any>()
  for (const msg of latestMessages || []) {
    if (!messageMap.has(msg.conversation_id)) {
      messageMap.set(msg.conversation_id, msg)
    }
  }

  const conversations = (data || []).map((row) => ({
    ...mapConversation(row),
    lead: row.lead
      ? {
          id: row.lead.id,
          email: row.lead.email,
          firstName: row.lead.first_name,
          lastName: row.lead.last_name,
          fullName: row.lead.full_name,
          companyName: row.lead.company_name,
          title: row.lead.title,
        }
      : null,
    campaign: row.campaign ? { id: row.campaign.id, name: row.campaign.name } : undefined,
    latestMessage: messageMap.has(row.id)
      ? {
          snippet: messageMap.get(row.id).snippet,
          direction: messageMap.get(row.id).direction,
          sentAt: messageMap.get(row.id).sent_at,
        }
      : undefined,
  })) as ConversationWithLead[]

  return {
    conversations,
    total: count || 0,
  }
}

/**
 * Get a single conversation with all messages
 */
export async function getConversation(
  conversationId: string,
  workspaceId: string
): Promise<{ conversation: ConversationWithLead; messages: ConversationMessage[] } | null> {
  const supabase = await createClient()

  // Fetch conversation
  const { data: conversation, error: convError } = await supabase
    .from('email_conversations')
    .select(
      `
      *,
      lead:leads(id, email, first_name, last_name, full_name, company_name, title),
      campaign:email_campaigns(id, name)
    `
    )
    .eq('id', conversationId)
    .eq('workspace_id', workspaceId)
    .single()

  if (convError || !conversation) {
    return null
  }

  // Fetch messages
  const { data: messages, error: msgError } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (msgError) {
    throw new Error(`Failed to fetch messages: ${msgError.message}`)
  }

  return {
    conversation: {
      ...mapConversation(conversation),
      lead: conversation.lead
        ? {
            id: conversation.lead.id,
            email: conversation.lead.email,
            firstName: conversation.lead.first_name,
            lastName: conversation.lead.last_name,
            fullName: conversation.lead.full_name,
            companyName: conversation.lead.company_name,
            title: conversation.lead.title,
          }
        : (null as any),
      campaign: conversation.campaign
        ? { id: conversation.campaign.id, name: conversation.campaign.name }
        : undefined,
    },
    messages: (messages || []).map(mapMessage),
  }
}

/**
 * Mark conversation as read
 */
export async function markConversationRead(
  conversationId: string,
  workspaceId: string
): Promise<{ success: boolean; messagesMarked: number }> {
  const supabase = await createClient()

  // Verify ownership
  const { data: conversation } = await supabase
    .from('email_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!conversation) {
    return { success: false, messagesMarked: 0 }
  }

  // Use database function
  const { data, error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  })

  if (error) {
    // Fallback to manual update
    const { data: updated } = await supabase
      .from('conversation_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .select('id')

    await supabase
      .from('email_conversations')
      .update({ unread_count: 0, updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return { success: true, messagesMarked: updated?.length || 0 }
  }

  return { success: true, messagesMarked: data || 0 }
}

/**
 * Update conversation status
 */
export async function updateConversationStatus(
  conversationId: string,
  workspaceId: string,
  status: Conversation['status']
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('email_conversations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('workspace_id', workspaceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update conversation priority
 */
export async function updateConversationPriority(
  conversationId: string,
  workspaceId: string,
  priority: Conversation['priority']
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('email_conversations')
    .update({ priority, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('workspace_id', workspaceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Add a note to a conversation
 */
export async function addConversationNote(
  conversationId: string,
  workspaceId: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('email_conversations')
    .update({ notes: note, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('workspace_id', workspaceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Update conversation tags
 */
export async function updateConversationTags(
  conversationId: string,
  workspaceId: string,
  tags: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('email_conversations')
    .update({ tags, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('workspace_id', workspaceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Add a reply to a conversation (creates new email for sending)
 */
export async function addReplyToConversation(
  conversationId: string,
  workspaceId: string,
  reply: {
    subject?: string
    bodyHtml: string
    bodyText?: string
  }
): Promise<{ success: boolean; emailSendId?: string; error?: string }> {
  const supabase = await createClient()

  // Get conversation details
  const { data: conversation, error: convError } = await supabase
    .from('email_conversations')
    .select(
      `
      *,
      lead:leads(id, email, first_name, last_name, full_name)
    `
    )
    .eq('id', conversationId)
    .eq('workspace_id', workspaceId)
    .single()

  if (convError || !conversation) {
    return { success: false, error: 'Conversation not found' }
  }

  // Create email_send record
  const subject = reply.subject || `Re: ${conversation.subject_normalized || 'Your inquiry'}`

  const { data: emailSend, error: sendError } = await supabase
    .from('email_sends')
    .insert({
      workspace_id: workspaceId,
      campaign_id: conversation.campaign_id,
      lead_id: conversation.lead_id,
      conversation_id: conversationId,
      recipient_email: conversation.lead.email,
      recipient_name:
        conversation.lead.full_name ||
        `${conversation.lead.first_name || ''} ${conversation.lead.last_name || ''}`.trim(),
      subject,
      body_html: reply.bodyHtml,
      body_text: reply.bodyText,
      status: 'pending_approval',
      step_number: conversation.message_count + 1,
    })
    .select()
    .single()

  if (sendError) {
    return { success: false, error: sendError.message }
  }

  return { success: true, emailSendId: emailSend.id }
}

/**
 * Get conversation statistics for a workspace
 */
export async function getConversationStats(
  workspaceId: string
): Promise<{
  total: number
  unread: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  avgResponseTime?: number
}> {
  const supabase = await createClient()

  // Get counts
  const { data, error } = await supabase
    .from('email_conversations')
    .select('status, priority, unread_count')
    .eq('workspace_id', workspaceId)

  if (error || !data) {
    return {
      total: 0,
      unread: 0,
      byStatus: {},
      byPriority: {},
    }
  }

  const byStatus: Record<string, number> = {}
  const byPriority: Record<string, number> = {}
  let unreadTotal = 0

  for (const row of data) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1
    byPriority[row.priority] = (byPriority[row.priority] || 0) + 1
    unreadTotal += row.unread_count || 0
  }

  return {
    total: data.length,
    unread: unreadTotal,
    byStatus,
    byPriority,
  }
}

/**
 * Find or create a conversation for an incoming reply
 */
export async function findOrCreateConversation(
  workspaceId: string,
  leadId: string,
  subject: string,
  options?: {
    campaignId?: string
    campaignLeadId?: string
    threadId?: string
  }
): Promise<string> {
  const supabase = await createClient()

  // Try database function
  const { data, error } = await supabase.rpc('find_or_create_conversation', {
    p_workspace_id: workspaceId,
    p_lead_id: leadId,
    p_campaign_id: options?.campaignId || null,
    p_campaign_lead_id: options?.campaignLeadId || null,
    p_subject: subject,
    p_thread_id: options?.threadId || null,
  })

  if (error || !data) {
    // Fallback: create new conversation
    const { data: newConv, error: insertError } = await supabase
      .from('email_conversations')
      .insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        campaign_id: options?.campaignId,
        campaign_lead_id: options?.campaignLeadId,
        subject_normalized: normalizeSubject(subject),
        thread_id: options?.threadId,
        status: 'active',
      })
      .select('id')
      .single()

    if (insertError) {
      throw new Error(`Failed to create conversation: ${insertError.message}`)
    }

    return newConv.id
  }

  return data
}

/**
 * Add a message to a conversation
 */
export async function addMessageToConversation(
  conversationId: string,
  workspaceId: string,
  message: {
    direction: 'outbound' | 'inbound'
    fromEmail: string
    toEmail: string
    subject?: string
    bodyText?: string
    bodyHtml?: string
    messageId?: string
    emailSendId?: string
    replyId?: string
    sentAt?: string
    receivedAt?: string
    fromName?: string
    toName?: string
    classification?: Record<string, any>
  }
): Promise<string> {
  const supabase = await createClient()

  // Try database function
  const { data, error } = await supabase.rpc('add_conversation_message', {
    p_conversation_id: conversationId,
    p_workspace_id: workspaceId,
    p_direction: message.direction,
    p_from_email: message.fromEmail,
    p_to_email: message.toEmail,
    p_subject: message.subject || null,
    p_body_text: message.bodyText || null,
    p_body_html: message.bodyHtml || null,
    p_message_id: message.messageId || null,
    p_email_send_id: message.emailSendId || null,
    p_reply_id: message.replyId || null,
    p_sent_at: message.sentAt || null,
    p_received_at: message.receivedAt || null,
    p_from_name: message.fromName || null,
    p_to_name: message.toName || null,
  })

  if (error || !data) {
    // Fallback: manual insert
    const snippet = (message.bodyText || message.bodyHtml || '').slice(0, 500)

    const { data: newMsg, error: insertError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        workspace_id: workspaceId,
        direction: message.direction,
        email_send_id: message.emailSendId,
        reply_id: message.replyId,
        from_email: message.fromEmail,
        from_name: message.fromName,
        to_email: message.toEmail,
        to_name: message.toName,
        subject: message.subject,
        body_text: message.bodyText,
        body_html: message.bodyHtml,
        snippet,
        message_id: message.messageId,
        sent_at: message.sentAt,
        received_at: message.receivedAt,
        classification: message.classification || {},
        is_read: message.direction === 'outbound',
      })
      .select('id')
      .single()

    if (insertError) {
      throw new Error(`Failed to add message: ${insertError.message}`)
    }

    // Update conversation stats manually
    await supabase
      .from('email_conversations')
      .update({
        message_count: supabase.rpc('increment', { x: 1 }) as any, // Placeholder
        last_message_at: message.sentAt || message.receivedAt || new Date().toISOString(),
        last_message_direction: message.direction,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    return newMsg.id
  }

  return data
}

// ============ Helper Functions ============

function mapConversation(row: any): Conversation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    campaignId: row.campaign_id,
    leadId: row.lead_id,
    campaignLeadId: row.campaign_lead_id,
    threadId: row.thread_id,
    subjectNormalized: row.subject_normalized,
    status: row.status,
    lastMessageAt: row.last_message_at,
    lastMessageDirection: row.last_message_direction,
    messageCount: row.message_count,
    unreadCount: row.unread_count,
    sentiment: row.sentiment,
    intent: row.intent,
    priority: row.priority,
    tags: row.tags || [],
    notes: row.notes,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapMessage(row: any): ConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction,
    fromEmail: row.from_email,
    fromName: row.from_name,
    toEmail: row.to_email,
    toName: row.to_name,
    subject: row.subject,
    bodyText: row.body_text,
    bodyHtml: row.body_html,
    snippet: row.snippet,
    messageId: row.message_id,
    sentAt: row.sent_at,
    receivedAt: row.received_at,
    openedAt: row.opened_at,
    clickedAt: row.clicked_at,
    isRead: row.is_read,
    readAt: row.read_at,
    classification: row.classification || {},
    isAutoReply: row.is_auto_reply,
    isOutOfOffice: row.is_out_of_office,
    createdAt: row.created_at,
  }
}

function normalizeSubject(subject: string | null): string | null {
  if (!subject) return null

  let normalized = subject
  // Remove common prefixes
  const prefixes = /^(Re|RE|Fwd|FWD|Fw|FW|AW|Antwort|SV|VS):\s*/i

  while (prefixes.test(normalized)) {
    normalized = normalized.replace(prefixes, '')
  }

  return normalized.trim().slice(0, 500)
}
