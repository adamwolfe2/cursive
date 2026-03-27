// AI SDR Types
// Knowledge base, conversation management, and reply engine types

// ---------------------------------------------------------------------------
// Knowledge Base
// ---------------------------------------------------------------------------

export type KnowledgeCategory =
  | 'product'
  | 'objection_handling'
  | 'pricing'
  | 'scheduling'
  | 'competitor'
  | 'case_study'
  | 'faq'
  | 'custom'

export interface SdrKnowledgeEntry {
  readonly id: string
  readonly workspace_id: string
  readonly category: KnowledgeCategory
  readonly title: string
  readonly content: string
  readonly keywords: string[]
  readonly priority: number
  readonly is_active: boolean
  readonly usage_count: number
  readonly success_count: number
  readonly success_rate: number
  readonly created_at: string
  readonly updated_at: string
}

export type SdrKnowledgeInsert = Omit<
  SdrKnowledgeEntry,
  'id' | 'created_at' | 'updated_at' | 'usage_count' | 'success_count' | 'success_rate'
>

export type SdrKnowledgeUpdate = Partial<
  Pick<
    SdrKnowledgeEntry,
    | 'category'
    | 'title'
    | 'content'
    | 'keywords'
    | 'priority'
    | 'is_active'
    | 'usage_count'
    | 'success_count'
    | 'success_rate'
  >
>

// ---------------------------------------------------------------------------
// Conversation Stage (state machine)
// ---------------------------------------------------------------------------

export type ConversationStage =
  | 'new'
  | 'engaged'
  | 'qualifying'
  | 'scheduling'
  | 'booked'
  | 'closed'
  | 'lost'

export const CONVERSATION_STAGE_TRANSITIONS: Record<ConversationStage, ConversationStage[]> = {
  new: ['engaged', 'lost'],
  engaged: ['qualifying', 'scheduling', 'lost'],
  qualifying: ['scheduling', 'engaged', 'lost'],
  scheduling: ['booked', 'qualifying', 'lost'],
  booked: ['closed'],
  closed: [],
  lost: [],
}

// ---------------------------------------------------------------------------
// Reply Template (enhanced)
// ---------------------------------------------------------------------------

export type TemplateCategory =
  | 'interested'
  | 'question'
  | 'objection'
  | 'scheduling'
  | 'follow_up'
  | 'breakup'
  | 'referral'
  | 'general'

export interface TriggerConditions {
  readonly sentimentMatch?: string[]
  readonly keywordMatch?: string[]
  readonly intentScoreMin?: number
  readonly intentScoreMax?: number
  readonly conversationStage?: ConversationStage[]
}

export interface ReplyTemplate {
  readonly id: string
  readonly workspace_id: string
  readonly name: string
  readonly description: string | null
  readonly category: TemplateCategory
  readonly for_sentiment: string[]
  readonly for_intent_score_min: number
  readonly for_intent_score_max: number
  readonly subject_template: string | null
  readonly body_template: string
  readonly trigger_conditions: TriggerConditions
  readonly conversation_stage_trigger: string | null
  readonly is_active: boolean
  readonly auto_suggest: boolean
  readonly priority: number
  readonly times_used: number
  readonly reply_rate: number
  readonly created_at: string
  readonly updated_at: string
}

// ---------------------------------------------------------------------------
// Reply Engine Types
// ---------------------------------------------------------------------------

export interface ReplyContext {
  readonly conversationHistory: ConversationMessage[]
  readonly leadContext: LeadContext
  readonly knowledgeEntries: SdrKnowledgeEntry[]
  readonly matchedTemplate: ReplyTemplate | null
  readonly campaignObjective: string
  readonly brandVoice: string | null
  readonly conversationStage: ConversationStage
  readonly turnCount: number
}

export interface ConversationMessage {
  readonly direction: 'outbound' | 'inbound'
  readonly body: string
  readonly subject: string | null
  readonly sentAt: string | null
  readonly receivedAt: string | null
}

export interface LeadContext {
  readonly firstName: string | null
  readonly lastName: string | null
  readonly companyName: string | null
  readonly jobTitle: string | null
  readonly email: string
}

export interface GeneratedReply {
  readonly subject: string | null
  readonly body: string
  readonly tone: string
  readonly confidence: number
  readonly knowledgeEntriesUsed: string[]
  readonly templateUsed: string | null
  readonly suggestedStageTransition: ConversationStage | null
  readonly shouldEscalate: boolean
  readonly escalationReason: string | null
}

export interface ReplyDecision {
  readonly action: 'auto_send' | 'queue_approval' | 'escalate' | 'skip'
  readonly reason: string
  readonly reply: GeneratedReply | null
  readonly conversationId: string
  readonly replyId: string
}

// ---------------------------------------------------------------------------
// SDR Configuration (enhanced)
// ---------------------------------------------------------------------------

export interface SdrConfigurationEnhanced {
  readonly id: string
  readonly workspace_id: string
  readonly objective: string
  readonly language: string
  readonly do_not_contact_enabled: boolean
  readonly human_in_the_loop: boolean
  readonly trigger_phrases: string[]
  readonly warmup_exclusion_keywords: string[]
  readonly follow_up_enabled: boolean
  readonly follow_up_count: number
  readonly follow_up_interval_days: number
  readonly reply_to_no_thanks: boolean
  readonly no_thanks_template: string | null
  readonly enable_signature: boolean
  readonly auto_bcc_address: string | null
  readonly notification_email: string | null
  readonly cal_booking_url: string | null
  readonly timezone: string
  readonly availability_start: string
  readonly availability_end: string
  readonly exclude_weekends: boolean
  readonly exclude_holidays: boolean
  readonly agent_first_name: string | null
  readonly agent_last_name: string | null
  readonly knowledge_base_enabled: boolean
  readonly max_ai_turns: number
  readonly escalation_after_turns: number
  readonly auto_booking_enabled: boolean
  readonly brand_voice_notes: string | null
  readonly autoresearch_program_id: string | null
  readonly created_at: string
  readonly updated_at: string
}

// ---------------------------------------------------------------------------
// Inbox UI Types
// ---------------------------------------------------------------------------

export interface InboxConversation {
  readonly id: string
  readonly workspaceId: string
  readonly campaignId: string | null
  readonly campaignName: string | null
  readonly leadId: string
  readonly lead: LeadContext
  readonly status: string
  readonly conversationStage: ConversationStage
  readonly lastMessageAt: string
  readonly lastMessageDirection: 'outbound' | 'inbound'
  readonly lastMessageSnippet: string | null
  readonly messageCount: number
  readonly unreadCount: number
  readonly sentiment: string | null
  readonly priority: string
  readonly aiTurnCount: number
  readonly hasPendingDraft: boolean
  readonly tags: string[]
}

export interface InboxFilters {
  readonly status?: string | string[]
  readonly conversationStage?: ConversationStage | ConversationStage[]
  readonly campaignId?: string
  readonly sentiment?: string
  readonly priority?: string
  readonly hasPendingDraft?: boolean
  readonly search?: string
}

export interface InboxStats {
  readonly totalConversations: number
  readonly needsReview: number
  readonly awaitingReply: number
  readonly meetingsBooked: number
  readonly autoSentToday: number
  readonly avgResponseTime: number | null
}
