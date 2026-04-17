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
   * Append an entry to the automation_log JSONB array
   */
  async appendAutomationLog(id: string, entry: AutomationLogEntry): Promise<void> {
    const supabase = createAdminClient()

    // Retry loop with optimistic locking — prevents lost entries when multiple
    // Inngest steps append concurrently. `.select()` returns the updated rows
    // so we can detect zero-row updates (lock conflict).
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
      // Back off slightly to reduce contention
      await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)))
    }
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
