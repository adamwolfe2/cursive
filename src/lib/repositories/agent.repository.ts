// Agent Repository
// Database access layer for AI agents using repository pattern

import { createClient } from '@/lib/supabase/server'
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
      .single()

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
      .single()

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
      .single()

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
      .select('*', { count: 'exact', head: true })
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

    // Get agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (agentError) {
      if (agentError.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(agentError.message)
    }

    // Get instructions
    const { data: instructions, error: instructionsError } = await supabase
      .from('email_instructions')
      .select('*')
      .eq('agent_id', id)
      .order('order_index', { ascending: true })

    if (instructionsError) {
      throw new DatabaseError(instructionsError.message)
    }

    // Get KB entries
    const { data: kbEntries, error: kbError } = await supabase
      .from('kb_entries')
      .select('*')
      .eq('agent_id', id)

    if (kbError) {
      throw new DatabaseError(kbError.message)
    }

    // Get thread count
    const { count: threadCount, error: threadError } = await supabase
      .from('email_threads')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', id)

    if (threadError) {
      throw new DatabaseError(threadError.message)
    }

    // Get pending task count
    const { count: taskCount, error: taskError } = await supabase
      .from('email_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', id)
      .eq('status', 'ready')

    if (taskError) {
      throw new DatabaseError(taskError.message)
    }

    return {
      agent: agent as Agent,
      instructions: instructions as EmailInstruction[],
      kbEntries: kbEntries as KBEntry[],
      threadCount: threadCount || 0,
      taskCount: taskCount || 0,
    }
  }

  // ============================================================================
  // EMAIL INSTRUCTIONS
  // ============================================================================

  /**
   * Get instructions for an agent
   */
  async getInstructions(agentId: string): Promise<EmailInstruction[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_instructions')
      .select('*')
      .eq('agent_id', agentId)
      .order('order_index', { ascending: true })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailInstruction[]
  }

  /**
   * Add instruction to agent
   */
  async addInstruction(instruction: EmailInstructionInsert): Promise<EmailInstruction> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_instructions')
      .insert(instruction)
      .select('*')
      .single()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailInstruction
  }

  /**
   * Delete instruction
   */
  async deleteInstruction(instructionId: string, agentId: string): Promise<void> {
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
   */
  async getKBEntries(agentId: string): Promise<KBEntry[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('kb_entries')
      .select('*')
      .eq('agent_id', agentId)

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as KBEntry[]
  }

  /**
   * Add KB entry to agent
   */
  async addKBEntry(entry: KBEntryInsert): Promise<KBEntry> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('kb_entries')
      .insert(entry)
      .select('*')
      .single()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as KBEntry
  }

  /**
   * Delete KB entry
   */
  async deleteKBEntry(entryId: string, agentId: string): Promise<void> {
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
   */
  async getThreads(
    agentId: string,
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<EmailThread[]> {
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
   */
  async getThreadWithMessages(
    threadId: string,
    agentId: string
  ): Promise<{ thread: EmailThread; messages: EmailMessage[] } | null> {
    const supabase = await createClient()

    const { data: thread, error: threadError } = await supabase
      .from('email_threads')
      .select('*')
      .eq('id', threadId)
      .eq('agent_id', agentId)
      .single()

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
   */
  async getPendingTasks(agentId: string): Promise<EmailTask[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('email_tasks')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as EmailTask[]
  }

  /**
   * Get task stats for an agent
   */
  async getTaskStats(agentId: string): Promise<{
    ready: number
    pending: number
    sent: number
    failed: number
  }> {
    const supabase = await createClient()

    const statuses = ['ready', 'pending', 'sent', 'failed']
    const stats: Record<string, number> = {}

    for (const status of statuses) {
      const { count, error } = await supabase
        .from('email_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)
        .eq('status', status)

      if (error) {
        throw new DatabaseError(error.message)
      }

      stats[status] = count || 0
    }

    return stats as { ready: number; pending: number; sent: number; failed: number }
  }
}
