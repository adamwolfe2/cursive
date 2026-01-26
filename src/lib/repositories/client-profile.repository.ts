// Client Profile Repository
// Database access layer for client profiles using repository pattern

import { createClient } from '@/lib/supabase/server'
import type {
  ClientProfile,
  ClientProfileInsert,
  ClientProfileUpdate,
} from '@/types'
import { DatabaseError } from '@/types'

export class ClientProfileRepository {
  /**
   * Find all client profiles for a workspace
   */
  async findByWorkspace(workspaceId: string, activeOnly: boolean = true): Promise<ClientProfile[]> {
    const supabase = await createClient()

    let query = supabase
      .from('client_profiles')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as ClientProfile[]
  }

  /**
   * Find a single client profile by ID
   */
  async findById(id: string, workspaceId: string): Promise<ClientProfile | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('client_profiles')
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

    return data as ClientProfile
  }

  /**
   * Get the active client profile for a workspace (most workspaces have one)
   */
  async getActiveProfile(workspaceId: string): Promise<ClientProfile | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new DatabaseError(error.message)
    }

    return data as ClientProfile
  }

  /**
   * Create a new client profile
   */
  async create(profile: ClientProfileInsert): Promise<ClientProfile> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('client_profiles')
      .insert(profile)
      .select('*')
      .single()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as ClientProfile
  }

  /**
   * Update a client profile
   */
  async update(
    id: string,
    workspaceId: string,
    profile: ClientProfileUpdate
  ): Promise<ClientProfile> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('client_profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .single()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data as ClientProfile
  }

  /**
   * Delete a client profile (soft delete)
   */
  async delete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('client_profiles')
      .update({ is_active: false })
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * Hard delete a client profile
   */
  async hardDelete(id: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('client_profiles')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      throw new DatabaseError(error.message)
    }
  }

  /**
   * Check if workspace has a client profile
   */
  async hasProfile(workspaceId: string): Promise<boolean> {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('client_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)

    if (error) {
      throw new DatabaseError(error.message)
    }

    return (count || 0) > 0
  }

  /**
   * Duplicate a client profile
   */
  async duplicate(
    id: string,
    workspaceId: string,
    newName?: string
  ): Promise<ClientProfile> {
    // Get original profile
    const original = await this.findById(id, workspaceId)
    if (!original) {
      throw new DatabaseError('Client profile not found')
    }

    // Create copy without id and timestamps
    const { id: _, created_at, updated_at, ...profileData } = original
    const newProfile: ClientProfileInsert = {
      ...profileData,
      company_name: newName || `${original.company_name} (Copy)`,
    }

    return this.create(newProfile)
  }
}
