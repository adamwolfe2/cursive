import { createAdminClient } from '@/lib/supabase/admin'

export type DncEntry = {
  id: string
  workspace_id: string
  email: string
  reason: string | null
  added_by: string | null
  added_at: string
}

export class DncRepository {
  private get db() {
    return createAdminClient()
  }

  async isBlocked(workspaceId: string, email: string): Promise<boolean> {
    const { data } = await this.db
      .from('do_not_contact')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', email.toLowerCase().trim())
      .single()
    return !!data
  }

  async findByWorkspace(workspaceId: string): Promise<DncEntry[]> {
    const { data } = await this.db
      .from('do_not_contact')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('added_at', { ascending: false })
    return (data || []) as DncEntry[]
  }

  async findAll(limit = 500): Promise<DncEntry[]> {
    const { data } = await this.db
      .from('do_not_contact')
      .select('*')
      .order('added_at', { ascending: false })
      .limit(limit)
    return (data || []) as DncEntry[]
  }

  async add(
    workspaceId: string,
    email: string,
    reason?: string,
    addedBy?: string
  ): Promise<void> {
    const { error } = await this.db.from('do_not_contact').upsert(
      {
        workspace_id: workspaceId,
        email: email.toLowerCase().trim(),
        reason,
        added_by: addedBy,
      },
      { onConflict: 'workspace_id,email', ignoreDuplicates: true }
    )
    if (error) throw new Error(`Failed to add to DNC: ${error.message}`)
  }

  async bulkAdd(
    workspaceId: string,
    emails: string[],
    reason?: string,
    addedBy?: string
  ): Promise<void> {
    const rows = emails.map((e) => ({
      workspace_id: workspaceId,
      email: e.toLowerCase().trim(),
      reason,
      added_by: addedBy,
    }))
    const { error } = await this.db
      .from('do_not_contact')
      .upsert(rows, { onConflict: 'workspace_id,email', ignoreDuplicates: true })
    if (error) throw new Error(`Failed to bulk add to DNC: ${error.message}`)
  }

  async remove(id: string): Promise<void> {
    await this.db.from('do_not_contact').delete().eq('id', id)
  }
}
