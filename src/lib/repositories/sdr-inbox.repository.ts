import { createAdminClient } from '@/lib/supabase/admin'

export type SdrInboxReply = {
  id: string
  workspace_id: string
  campaign_id: string
  lead_id: string | null
  from_email: string
  from_name: string | null
  subject: string
  body_text: string
  body_html: string | null
  received_at: string
  sentiment: string | null
  intent_score: number | null
  suggested_response: string | null
  suggested_response_metadata: Record<string, unknown>
  draft_status: string
  admin_notes: string | null
  approved_by: string | null
  approved_at: string | null
  status: string
  created_at: string
  workspace: { name: string; slug: string } | null
}

export type InboxFilter = {
  draft_status?: string
  workspace_id?: string
  limit?: number
  offset?: number
}

export class SdrInboxRepository {
  private get db() {
    return createAdminClient()
  }

  async findAll(filter: InboxFilter = {}): Promise<SdrInboxReply[]> {
    let q = this.db
      .from('email_replies')
      .select('*, workspace:workspaces(name, slug)')
      .order('received_at', { ascending: false })
      .limit(filter.limit || 100)

    if (filter.draft_status) q = q.eq('draft_status', filter.draft_status)
    if (filter.workspace_id) q = q.eq('workspace_id', filter.workspace_id)
    if (filter.offset) q = q.range(filter.offset, filter.offset + (filter.limit || 100) - 1)

    const { data } = await q
    return (data || []) as SdrInboxReply[]
  }

  async findById(id: string): Promise<SdrInboxReply | null> {
    const { data } = await this.db
      .from('email_replies')
      .select('*, workspace:workspaces(name, slug)')
      .eq('id', id)
      .single()
    return data as SdrInboxReply | null
  }

  async countByDraftStatus(): Promise<Record<string, number>> {
    // Run targeted counts for each status in parallel — avoids full table scan
    const statuses = ['pending', 'needs_approval', 'sent', 'rejected', 'skipped', 'approved'] as const
    const results = await Promise.all(
      statuses.map((status) =>
        this.db
          .from('email_replies')
          .select('id', { count: 'exact', head: true })
          .eq('draft_status', status)
          .then(({ count }) => ({ status, count: count || 0 }))
      )
    )
    const counts: Record<string, number> = {}
    for (const { status, count } of results) {
      if (count > 0) counts[status] = count
    }
    return counts
  }

  async updateDraftStatus(
    id: string,
    update: {
      draft_status: string
      admin_notes?: string
      approved_by?: string
      approved_at?: string
      status?: string
      response_sent_at?: string
      suggested_response?: string
    }
  ): Promise<void> {
    await this.db.from('email_replies').update(update).eq('id', id)
  }
}
