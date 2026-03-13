import { getAllWorkspaces } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { SdrLandingClient } from './SdrLandingClient'

export default async function SdrPage() {
  const supabase = createAdminClient()
  const result = await getAllWorkspaces({ limit: 200 })
  const workspaces = result.workspaces || []

  // Load SDR configs + per-workspace stats in parallel
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [configsData, needsApprovalData, replies30dData, autoSent30dData] = await Promise.all([
    supabase.from('sdr_configurations').select('workspace_id, human_in_the_loop'),
    supabase
      .from('email_replies')
      .select('workspace_id')
      .eq('draft_status', 'needs_approval'),
    supabase
      .from('email_replies')
      .select('workspace_id')
      .gte('received_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('email_replies')
      .select('workspace_id')
      .eq('draft_status', 'sent')
      .gte('received_at', thirtyDaysAgo.toISOString()),
  ])

  const configs = configsData.data || []
  const needsApprovalRows = needsApprovalData.data || []
  const replies30dRows = replies30dData.data || []
  const autoSent30dRows = autoSent30dData.data || []

  // Build per-workspace counts
  const needsApprovalByWs: Record<string, number> = {}
  for (const r of needsApprovalRows) {
    needsApprovalByWs[r.workspace_id] = (needsApprovalByWs[r.workspace_id] || 0) + 1
  }
  const replies30dByWs: Record<string, number> = {}
  for (const r of replies30dRows) {
    replies30dByWs[r.workspace_id] = (replies30dByWs[r.workspace_id] || 0) + 1
  }
  const autoSent30dByWs: Record<string, number> = {}
  for (const r of autoSent30dRows) {
    autoSent30dByWs[r.workspace_id] = (autoSent30dByWs[r.workspace_id] || 0) + 1
  }

  const configByWs: Record<string, { workspace_id: string; human_in_the_loop: boolean }> = {}
  for (const c of configs) {
    configByWs[c.workspace_id] = c
  }

  const stats = workspaces.map((ws) => ({
    workspace: ws,
    config: configByWs[ws.id] || null,
    needsApproval: needsApprovalByWs[ws.id] || 0,
    replies30d: replies30dByWs[ws.id] || 0,
    autoSent30d: autoSent30dByWs[ws.id] || 0,
  }))

  const totalNeedsApproval = needsApprovalRows.length
  const totalReplies30d = replies30dRows.length
  const totalAutoSent30d = autoSent30dRows.length

  return (
    <SdrLandingClient
      stats={stats}
      totalWorkspaces={workspaces.length}
      totalNeedsApproval={totalNeedsApproval}
      totalReplies30d={totalReplies30d}
      totalAutoSent30d={totalAutoSent30d}
    />
  )
}
