// Onboarding Client Repository
// Database access layer for onboarding_clients, client_files, and fulfillment_checklists

import { createAdminClient } from '@/lib/supabase/server'
import { DatabaseError } from '@/types'
import type {
  OnboardingClient,
  OnboardingClientInsert,
  ClientStatus,
  AutomationLogEntry,
  ClientFile,
  ChecklistItem,
  FulfillmentChecklist,
} from '@/types/onboarding'

export class OnboardingClientRepository {
  // ---------------------------------------------------------------------------
  // Onboarding Clients
  // ---------------------------------------------------------------------------

  /**
   * Find all onboarding clients, ordered by creation date descending
   */
  async findAll(): Promise<OnboardingClient[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('onboarding_clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as unknown as OnboardingClient[]
  }

  /**
   * Find a single onboarding client by ID
   */
  async findById(id: string): Promise<OnboardingClient | null> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('onboarding_clients')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(error.message)
    }

    return data as unknown as OnboardingClient | null
  }

  /**
   * Find all onboarding clients with a specific status
   */
  async findByStatus(status: ClientStatus): Promise<OnboardingClient[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('onboarding_clients')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as unknown as OnboardingClient[]
  }

  /**
   * Create a new onboarding client record
   */
  async create(input: OnboardingClientInsert): Promise<OnboardingClient> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('onboarding_clients')
      .insert(input)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as unknown as OnboardingClient
  }

  /**
   * Update an onboarding client record
   */
  async update(id: string, updates: Partial<OnboardingClient>): Promise<OnboardingClient> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('onboarding_clients')
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    if (!data) {
      throw new DatabaseError(`Onboarding client not found: ${id}`)
    }

    return data as unknown as OnboardingClient
  }

  /**
   * Update only the status of an onboarding client
   */
  async updateStatus(id: string, status: ClientStatus): Promise<void> {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('onboarding_clients')
      .update({ status })
      .eq('id', id)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * Append an entry to the automation log.
   *
   * Dual-write strategy (transition period):
   * 1. Write a new row to onboarding_automation_log (normalized, no OOM risk).
   * 2. Also append to the legacy JSONB array on onboarding_clients so code that
   *    reads `client.automation_log` directly continues to work without changes.
   *
   * After all callers migrate to getAutomationLog(), step 2 can be removed.
   */
  async appendAutomationLog(id: string, entry: AutomationLogEntry): Promise<void> {
    const supabase = createAdminClient()

    // 1. Write to the new normalized table — single INSERT, no read-modify-write.
    const { error: insertError } = await supabase
      .from('onboarding_automation_log')
      .insert({
        client_id: id,
        step: entry.step,
        status: entry.status,
        error: entry.error ?? null,
        metadata: null,
        timestamp: entry.timestamp,
      })

    if (insertError) {
      // Non-fatal — log and fall through to JSONB write so we don't lose data entirely.
      // eslint-disable-next-line no-console
      console.error('[OnboardingClientRepository] Failed to insert automation log row:', insertError)
    }

    // 2. Legacy JSONB dual-write: retry loop with optimistic locking to prevent
    //    lost entries when multiple Inngest steps append concurrently.
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: current, error: readError } = await supabase
        .from('onboarding_clients')
        .select('automation_log, updated_at')
        .eq('id', id)
        .maybeSingle()

      if (readError || !current) return

      const currentLog = (current.automation_log as AutomationLogEntry[] | null) ?? []
      const newLog = [...currentLog, entry]

      const { data: updated, error: updateError } = await supabase
        .from('onboarding_clients')
        .update({ automation_log: newLog })
        .eq('id', id)
        .eq('updated_at', current.updated_at)
        .select('id')

      if (updateError) {
        // Real DB error — don't retry endlessly
        return
      }

      if (updated && updated.length > 0) {
        return // Success
      }

      // Zero rows updated = lock conflict, retry with fresh read
      await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)))
    }
  }

  /**
   * Fetch automation log entries for a client from the normalized table.
   * Returns the 200 most recent entries, newest first.
   * Prefer this method over reading client.automation_log (JSONB) directly.
   */
  async getAutomationLog(clientId: string): Promise<AutomationLogEntry[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('onboarding_automation_log')
      .select('step, status, error, timestamp')
      .eq('client_id', clientId)
      .order('timestamp', { ascending: false })
      .limit(200)

    if (error) {
      throw new DatabaseError(error.message)
    }

    return (data ?? []).map((row) => ({
      step: row.step,
      status: row.status as AutomationLogEntry['status'],
      error: row.error ?? undefined,
      timestamp: row.timestamp,
    }))
  }

  // ---------------------------------------------------------------------------
  // Client Files
  // ---------------------------------------------------------------------------

  /**
   * Get all files for a client
   */
  async getFiles(clientId: string): Promise<ClientFile[]> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('client_files')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as unknown as ClientFile[]
  }

  /**
   * Create a file record for a client
   */
  async createFile(
    input: Omit<ClientFile, 'id' | 'created_at'>
  ): Promise<ClientFile> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('client_files')
      .insert(input)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as unknown as ClientFile
  }

  // ---------------------------------------------------------------------------
  // Fulfillment Checklists
  // ---------------------------------------------------------------------------

  /**
   * Get the fulfillment checklist for a client
   */
  async getChecklist(clientId: string): Promise<FulfillmentChecklist | null> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('fulfillment_checklists')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(error.message)
    }

    return data as unknown as FulfillmentChecklist | null
  }

  /**
   * Create a fulfillment checklist for a client
   */
  async createChecklist(
    clientId: string,
    items: ChecklistItem[]
  ): Promise<FulfillmentChecklist> {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('fulfillment_checklists')
      .insert({ client_id: clientId, items })
      .select('*')
      .maybeSingle()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as unknown as FulfillmentChecklist
  }

  /**
   * Update a single checklist item's completed status
   */
  async updateChecklistItem(
    checklistId: string,
    itemId: string,
    completed: boolean
  ): Promise<void> {
    const supabase = createAdminClient()

    // Fetch current items
    const { data: checklist, error: fetchError } = await supabase
      .from('fulfillment_checklists')
      .select('items')
      .eq('id', checklistId)
      .maybeSingle()

    if (fetchError) {
      throw new DatabaseError(fetchError.message)
    }

    if (!checklist) {
      throw new DatabaseError(`Checklist not found: ${checklistId}`)
    }

    const items = checklist.items as ChecklistItem[]
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        }
      }
      return item
    })

    const { error: updateError } = await supabase
      .from('fulfillment_checklists')
      .update({ items: updatedItems })
      .eq('id', checklistId)

    if (updateError) {
      throw new DatabaseError(updateError.message)
    }
  }
}
