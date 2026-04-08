// Agent Repository
// Database access layer for AI agents using repository pattern

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  Agent,
  AgentInsert,
  AgentUpdate,
  EmailInstruction,
  EmailInstructionInsert,
  KBEntry,
  KBEntryInsert,
  EmailThread,
  EmailMessage,
  EmailTask,
} from '@/types'
import { DatabaseError } from '@/types'
import type { OutboundAgent, OutboundAgentUpdate } from '@/types/outbound'

export class AgentRepository {
  /**
   * Find all agents for a workspace
   */
  async findByWorkspace(workspaceId: string): Promise<Agent[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as Agent[]
  }

  /**
   * Find a single agent by ID
   */
  async findById(id: string, workspaceId: string): Promise<Agent | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(error.message)
    }

    return data as Agent
  }

  /**
   * Create a new agent
   */
  async create(agent: AgentInsert): Promise<Agent> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('agents')
      .insert(agent)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as Agent
  }

  /**
   * Update an agent
   */
  async update(
    id: string,
    workspaceId: string,
    agent: AgentUpdate
  ): Promise<Agent> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('agents')
      .update(agent)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as Agent
  }

  /**
   * Delete an agent
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * Count agents for a workspace
   */
  async countByWorkspace(workspaceId: string): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('agents')
      .select('*', { count: 'estimated', head: true })
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new DatabaseError(error.message)
    }

    return count || 0
  }

  /**
   * Get agent with full details (instructions, KB entries, thread count)
   */
  async findByIdWithDetails(
    id: string,
    workspaceId: string
  ): Promise<{
    agent: Agent
    instructions: EmailInstruction[]
    kbEntries: KBEntry[]
    threadCount: number
    taskCount: number
  } | null> {
    const supabase = await createClient()

    // Fetch agent first — required to check existence before running sub-queries
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (agentError) {
      if (agentError.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(agentError.message)
    }

    if (!agent) return null

    // Fetch the remaining 4 sub-queries in parallel
    const [
      { data: instructions, error: instructionsError },
      { data: kbEntries, error: kbError },
      { count: threadCount, error: threadError },
      { count: taskCount, error: taskError },
    ] = await Promise.all([
      supabase
        .from('email_instructions')
        .select('*')
        .eq('agent_id', id)
        .order('order_index', { ascending: true }),
      supabase
        .from('kb_entries')
        .select('*')
        .eq('agent_id', id),
      supabase
        .from('email_threads')
        .select('*', { count: 'estimated', head: true })
        .eq('agent_id', id),
      supabase
        .from('email_tasks')
        .select('*', { count: 'estimated', head: true })
        .eq('agent_id', id)
        .eq('status', 'ready'),
    ])

    if (instructionsError) throw new DatabaseError(instructionsError.message)
    if (kbError) throw new DatabaseError(kbError.message)
    if (threadError) throw new DatabaseError(threadError.message)
    if (taskError) throw new DatabaseError(taskError.message)

    return {
      agent: agent as Agent,
      instructions: instructions as EmailInstruction[],
      kbEntries: kbEntries as KBEntry[],
      threadCount: threadCount || 0,
      taskCount: taskCount || 0,
    }
  }

  // ============================================================================
  // WORKSPACE VERIFICATION HELPER
  // ============================================================================

  /**
   * Verify an agent belongs to a workspace before accessing sub-entities.
   * Throws DatabaseError if the agent does not belong to the workspace.
   */
  private async verifyAgentWorkspace(agentId: string, workspaceId: string): Promise<void> {
    const agent = await this.findById(agentId, workspaceId)
    if (!agent) {
      throw new DatabaseError('Agent not found or does not belong to workspace')
    }
  }

  // ============================================================================
  // EMAIL INSTRUCTIONS
  // ============================================================================

  /**
   * Get instructions for an agent
   * SECURITY: Verifies agent belongs to workspace before returning instructions
   */
  async getInstructions(agentId: string, workspaceId: string): Promise<EmailInstruction[]> {
    await this.verifyAgentWorkspace(agentId, workspaceId)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_instructions')
      .select('*')
      .eq('agent_id', agentId)
      .order('order_index', { ascending: true })
      .limit(500)

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailInstruction[]
  }

  /**
   * Add instruction to agent
   * SECURITY: Verifies agent belongs to workspace before adding instruction
   */
  async addInstruction(instruction: EmailInstructionInsert, workspaceId: string): Promise<EmailInstruction> {
    await this.verifyAgentWorkspace(instruction.agent_id, workspaceId)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_instructions')
      .insert(instruction)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailInstruction
  }

  /**
   * Delete instruction
   * SECURITY: Verifies agent belongs to workspace before deleting instruction
   */
  async deleteInstruction(instructionId: string, agentId: string, workspaceId: string): Promise<void> {
    await this.verifyAgentWorkspace(agentId, workspaceId)

    const supabase = await createClient()

    const { error } = await supabase
      .from('email_instructions')
      .delete()
      .eq('id', instructionId)
      .eq('agent_id', agentId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  // ============================================================================
  // KNOWLEDGE BASE
  // ============================================================================

  /**
   * Get KB entries for an agent
   * SECURITY: Verifies agent belongs to workspace before returning KB entries
   */
  async getKBEntries(agentId: string, workspaceId: string): Promise<KBEntry[]> {
    await this.verifyAgentWorkspace(agentId, workspaceId)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('kb_entries')
      .select('*')
      .eq('agent_id', agentId)
      .limit(500)

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as KBEntry[]
  }

  /**
   * Add KB entry to agent
   * SECURITY: Verifies agent belongs to workspace before adding KB entry
   */
  async addKBEntry(entry: KBEntryInsert, workspaceId: string): Promise<KBEntry> {
    await this.verifyAgentWorkspace(entry.agent_id, workspaceId)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('kb_entries')
      .insert(entry)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as KBEntry
  }

  /**
   * Delete KB entry
   * SECURITY: Verifies agent belongs to workspace before deleting KB entry
   */
  async deleteKBEntry(entryId: string, agentId: string, workspaceId: string): Promise<void> {
    await this.verifyAgentWorkspace(agentId, workspaceId)

    const supabase = await createClient()

    const { error } = await supabase
      .from('kb_entries')
      .delete()
      .eq('id', entryId)
      .eq('agent_id', agentId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  // ============================================================================
  // EMAIL THREADS
  // ============================================================================

  /**
   * Get threads for an agent
   * SECURITY: Verifies agent belongs to workspace before returning threads
   */
  async getThreads(
    agentId: string,
    workspaceId: string,
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<EmailThread[]> {
    await this.verifyAgentWorkspace(agentId, workspaceId)

    const supabase = await createClient()
    const { status, limit = 50, offset = 0 } = options

    let query = supabase
      .from('email_threads')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailThread[]
  }

  /**
   * Get thread with messages
   * SECURITY: Verifies agent belongs to workspace before returning thread and messages
   */
  async getThreadWithMessages(
    threadId: string,
    agentId: string,
    workspaceId: string
  ): Promise<{ thread: EmailThread; messages: EmailMessage[] } | null> {
    await this.verifyAgentWorkspace(agentId, workspaceId)

    const supabase = await createClient()

    const { data: thread, error: threadError } = await supabase
      .from('email_threads')
      .select('*')
      .eq('id', threadId)
      .eq('agent_id', agentId)
      .maybeSingle()

    if (threadError) {
      if (threadError.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(threadError.message)
    }

    const { data: messages, error: messagesError } = await supabase
      .from('email_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(200)

    if (messagesError) {
      throw new DatabaseError(messagesError.message)
    }

    return {
      thread: thread as EmailThread,
      messages: messages as EmailMessage[],
    }
  }

  // ============================================================================
  // EMAIL TASKS
  // ============================================================================

  /**
   * Get pending tasks for an agent
   * SECURITY: Verifies agent belongs to workspace before returning tasks
   */
  async getPendingTasks(agentId: string, workspaceId: string): Promise<EmailTask[]> {
    await this.verifyAgentWorkspace(agentId, workspaceId)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_tasks')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailTask[]
  }

  /**
   * Get task stats for an agent
   * SECURITY: Verifies agent belongs to workspace before returning task stats
   */
  async getTaskStats(agentId: string, workspaceId: string): Promise<{
    ready: number
    pending: number
    sent: number
    failed: number
  }> {
    await this.verifyAgentWorkspace(agentId, workspaceId)

    const supabase = await createClient()

    // Fetch all 4 status counts in parallel
    const [ready, pending, sent, failed] = await Promise.all(
      (['ready', 'pending', 'sent', 'failed'] as const).map((status) =>
        supabase
          .from('email_tasks')
          .select('*', { count: 'estimated', head: true })
          .eq('agent_id', agentId)
          .eq('status', status)
          .then(({ count, error }) => {
            if (error) throw new DatabaseError(error.message)
            return count || 0
          })
      )
    )

    return { ready, pending, sent, failed }
  }

  // ============================================================================
  // OUTBOUND AGENT (Rox-inspired) helpers
  // ============================================================================

  /**
   * Find all agents for a workspace that have outbound mode enabled.
   * Used by the /outbound list page.
   *
   * Sample workflows (name starts with "Sample:") are deliberately filtered
   * out — they're a one-time aha experience and shouldn't clutter the user's
   * real workflow list. Users who want to revisit the sample can hit the
   * "Try Sample Workflow" button on the empty state, which is idempotent
   * and returns the existing sample.
   */
  async findOutboundEnabled(workspaceId: string): Promise<OutboundAgent[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('outbound_enabled', true)
      .not('name', 'ilike', 'Sample:%')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw new DatabaseError(error.message)
    return (data ?? []) as unknown as OutboundAgent[]
  }

  /**
   * Find a single outbound-enabled agent by id (workspace-scoped).
   * Returns null if not found OR if the agent isn't outbound-enabled.
   */
  async findOutboundById(id: string, workspaceId: string): Promise<OutboundAgent | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new DatabaseError(error.message)
    }
    if (!data) return null
    return data as unknown as OutboundAgent
  }

  /**
   * Update outbound config (icp/persona/product/filters/tone).
   * Pass a partial — only the listed keys are updated.
   */
  async updateOutboundConfig(
    id: string,
    workspaceId: string,
    patch: OutboundAgentUpdate
  ): Promise<OutboundAgent> {
    const supabase = await createClient()

    // Whitelist outbound-related fields to prevent accidental writes to send keys
    const allowed: Record<string, unknown> = {}
    if (patch.name !== undefined) allowed.name = patch.name
    if (patch.tone !== undefined) allowed.tone = patch.tone
    if (patch.outbound_enabled !== undefined) allowed.outbound_enabled = patch.outbound_enabled
    if (patch.outbound_auto_approve !== undefined) allowed.outbound_auto_approve = patch.outbound_auto_approve
    if (patch.icp_text !== undefined) allowed.icp_text = patch.icp_text
    if (patch.persona_text !== undefined) allowed.persona_text = patch.persona_text
    if (patch.product_text !== undefined) allowed.product_text = patch.product_text
    if (patch.outbound_filters !== undefined) allowed.outbound_filters = patch.outbound_filters
    if (patch.outbound_last_run_at !== undefined) allowed.outbound_last_run_at = patch.outbound_last_run_at

    const { data, error } = await supabase
      .from('agents')
      .update(allowed)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .maybeSingle()

    if (error) throw new DatabaseError(error.message)
    if (!data) throw new DatabaseError('Agent not found')
    return data as unknown as OutboundAgent
  }

  /**
   * Create a new outbound-enabled agent in a SINGLE INSERT.
   *
   * Bypasses RLS (uses admin client) — caller MUST verify the user owns
   * the workspace before invoking. Used by POST /api/outbound/workflows
   * to avoid the slow two-roundtrip create-then-update pattern that was
   * timing out under user-scoped client + RLS subquery on every step.
   */
  async createOutboundAgent(input: {
    workspaceId: string
    name: string
    tone: 'professional' | 'casual' | 'friendly' | 'formal'
    icp_text: string | null
    persona_text: string | null
    product_text: string | null
    outbound_filters: object
    outbound_auto_approve?: boolean
  }): Promise<OutboundAgent> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('agents')
      .insert({
        workspace_id: input.workspaceId,
        name: input.name,
        tone: input.tone,
        // Vestigial but NOT NULL on the table — supply harmless defaults
        ai_provider: 'anthropic',
        ai_model: 'claude-haiku-4-5-20251001',
        // Outbound fields (added by 20260408000000_outbound_agent_v1.sql)
        outbound_enabled: true,
        outbound_auto_approve: input.outbound_auto_approve ?? false,
        icp_text: input.icp_text,
        persona_text: input.persona_text,
        product_text: input.product_text,
        outbound_filters: input.outbound_filters,
      } as any)
      .select('*')
      .maybeSingle()

    if (error) throw new DatabaseError(error.message)
    if (!data) throw new DatabaseError('Failed to create outbound agent — no row returned')
    return data as unknown as OutboundAgent
  }

  /**
   * Lazy-create the synthetic `email_campaigns` row that backs an outbound
   * agent. Idempotent — returns the existing campaign id if already linked.
   *
   * Uses the admin client because this runs from Inngest functions outside
   * of any user request context.
   */
  async ensureOutboundCampaign(agentId: string): Promise<string> {
    const supabase = createAdminClient()

    // 1. Read agent — bypass RLS via admin client (Inngest context)
    const { data: agent, error: agentErr } = await supabase
      .from('agents')
      .select('id, workspace_id, name, outbound_campaign_id')
      .eq('id', agentId)
      .maybeSingle()

    if (agentErr || !agent) {
      throw new DatabaseError(`Agent not found: ${agentId}`)
    }

    // Already linked? Verify the campaign actually exists.
    if ((agent as { outbound_campaign_id?: string }).outbound_campaign_id) {
      const { data: existing } = await supabase
        .from('email_campaigns')
        .select('id')
        .eq('id', (agent as { outbound_campaign_id: string }).outbound_campaign_id)
        .maybeSingle()
      if (existing) {
        return (agent as { outbound_campaign_id: string }).outbound_campaign_id
      }
    }

    // 2. Create the synthetic campaign
    const { data: campaign, error: campaignErr } = await supabase
      .from('email_campaigns')
      .insert({
        workspace_id: agent.workspace_id,
        agent_id: agent.id,
        name: `Outbound: ${agent.name}`,
        description: 'Auto-created by Outbound Agent',
        status: 'active',
        is_outbound_agent: true,
        selected_template_ids: [],
        sequence_steps: 1,
      } as any)
      .select('id')
      .maybeSingle()

    if (campaignErr || !campaign) {
      throw new DatabaseError(`Failed to create outbound campaign: ${campaignErr?.message ?? 'unknown'}`)
    }

    // 3. Link agent → campaign
    const { error: linkErr } = await supabase
      .from('agents')
      .update({ outbound_campaign_id: campaign.id })
      .eq('id', agent.id)

    if (linkErr) {
      throw new DatabaseError(`Failed to link agent to campaign: ${linkErr.message}`)
    }

    return campaign.id
  }
}
