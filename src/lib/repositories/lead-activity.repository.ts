// Lead Activity Repository
// Database access layer for lead notes, status history, and activities

import { createClient } from '@/lib/supabase/server'
import type {
  LeadNote,
  LeadNoteInsert,
  LeadStatusHistory,
  LeadActivity,
  LeadStatus,
  NoteType,
} from '@/types'

export interface LeadNoteFilters {
  note_type?: NoteType
  is_pinned?: boolean
  created_by?: string
}

export class LeadActivityRepository {
  // ============================================================================
  // NOTES
  // ============================================================================

  /**
   * Get notes for a lead
   */
  async getNotes(
    leadId: string,
    workspaceId: string,
    filters: LeadNoteFilters = {}
  ): Promise<LeadNote[]> {
    const supabase = await createClient()

    let query = supabase
      .from('lead_notes')
      .select('*, created_by_user:users!lead_notes_created_by_fkey(id, full_name, email, avatar_url)')
      .eq('lead_id', leadId)
      .eq('workspace_id', workspaceId)

    if (filters.note_type) {
      query = query.eq('note_type', filters.note_type)
    }

    if (filters.is_pinned !== undefined) {
      query = query.eq('is_pinned', filters.is_pinned)
    }

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by)
    }

    // Order: pinned first, then by date
    query = query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('[LeadActivityRepository] Get notes error:', error)
      throw new Error(`Failed to fetch notes: ${error.message}`)
    }

    return (data as unknown as LeadNote[]) || []
  }

  /**
   * Create a note for a lead
   */
  async createNote(note: LeadNoteInsert): Promise<LeadNote> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lead_notes')
      .insert(note)
      .select('*, created_by_user:users!lead_notes_created_by_fkey(id, full_name, email, avatar_url)')
      .single()

    if (error) {
      console.error('[LeadActivityRepository] Create note error:', error)
      throw new Error(`Failed to create note: ${error.message}`)
    }

    return data as unknown as LeadNote
  }

  /**
   * Update a note
   */
  async updateNote(
    noteId: string,
    workspaceId: string,
    updates: { content?: string; is_pinned?: boolean }
  ): Promise<LeadNote> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lead_notes')
      .update(updates)
      .eq('id', noteId)
      .eq('workspace_id', workspaceId)
      .select('*, created_by_user:users!lead_notes_created_by_fkey(id, full_name, email, avatar_url)')
      .single()

    if (error) {
      console.error('[LeadActivityRepository] Update note error:', error)
      throw new Error(`Failed to update note: ${error.message}`)
    }

    return data as unknown as LeadNote
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('lead_notes')
      .delete()
      .eq('id', noteId)
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('[LeadActivityRepository] Delete note error:', error)
      throw new Error(`Failed to delete note: ${error.message}`)
    }
  }

  // ============================================================================
  // STATUS
  // ============================================================================

  /**
   * Update lead status (uses database function for atomic history tracking)
   */
  async updateStatus(
    leadId: string,
    userId: string,
    newStatus: LeadStatus,
    changeNote?: string
  ): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.rpc('update_lead_status', {
      p_lead_id: leadId,
      p_new_status: newStatus,
      p_user_id: userId,
      p_change_note: changeNote || null,
    })

    if (error) {
      console.error('[LeadActivityRepository] Update status error:', error)
      throw new Error(`Failed to update status: ${error.message}`)
    }
  }

  /**
   * Get status history for a lead
   */
  async getStatusHistory(
    leadId: string,
    workspaceId: string
  ): Promise<LeadStatusHistory[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lead_status_history')
      .select('*, changed_by_user:users!lead_status_history_changed_by_fkey(id, full_name, email, avatar_url)')
      .eq('lead_id', leadId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[LeadActivityRepository] Get status history error:', error)
      throw new Error(`Failed to fetch status history: ${error.message}`)
    }

    return (data as unknown as LeadStatusHistory[]) || []
  }

  // ============================================================================
  // ACTIVITIES
  // ============================================================================

  /**
   * Get activity timeline for a lead
   */
  async getActivities(
    leadId: string,
    workspaceId: string,
    limit: number = 50
  ): Promise<LeadActivity[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lead_activities')
      .select('*, performed_by_user:users!lead_activities_performed_by_fkey(id, full_name, email, avatar_url)')
      .eq('lead_id', leadId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[LeadActivityRepository] Get activities error:', error)
      throw new Error(`Failed to fetch activities: ${error.message}`)
    }

    return (data as unknown as LeadActivity[]) || []
  }

  /**
   * Log a custom activity
   */
  async logActivity(
    leadId: string,
    workspaceId: string,
    activityType: LeadActivity['activity_type'],
    title: string,
    performedBy?: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<LeadActivity> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        workspace_id: workspaceId,
        activity_type: activityType,
        title,
        description,
        performed_by: performedBy,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('[LeadActivityRepository] Log activity error:', error)
      throw new Error(`Failed to log activity: ${error.message}`)
    }

    return data as unknown as LeadActivity
  }

  // ============================================================================
  // STATS
  // ============================================================================

  /**
   * Get lead status counts for a workspace
   */
  async getStatusCounts(
    workspaceId: string
  ): Promise<Record<LeadStatus, number>> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('leads')
      .select('status')
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('[LeadActivityRepository] Get status counts error:', error)
      throw new Error(`Failed to fetch status counts: ${error.message}`)
    }

    // Count by status
    const counts: Record<LeadStatus, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      negotiation: 0,
      won: 0,
      lost: 0,
    }

    for (const row of data || []) {
      const status = (row.status as LeadStatus) || 'new'
      counts[status] = (counts[status] || 0) + 1
    }

    return counts
  }
}
