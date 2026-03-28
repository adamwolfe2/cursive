import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Inbox, FlaskConical, ArrowRight } from 'lucide-react'

interface SdrConfigRow {
  workspace_id: string
  is_active: boolean
  human_in_the_loop: boolean
  auto_suggest: boolean
}

interface WorkspaceRow {
  id: string
  name: string
}

export default async function AdminAgentsPage() {
  const supabase = createAdminClient()

  const [sdrConfigsResult, workspacesResult, needsApprovalResult] = await Promise.all([
    supabase
      .from('sdr_configurations')
      .select('workspace_id, is_active, human_in_the_loop, auto_suggest')
      .order('workspace_id'),
    supabase.from('workspaces').select('id, name'),
    supabase
      .from('email_replies')
      .select('workspace_id')
      .eq('draft_status', 'needs_approval'),
  ])

  const configs = (sdrConfigsResult.data ?? []) as SdrConfigRow[]
  const workspaceMap: Record<string, string> = {}
  for (const ws of (workspacesResult.data ?? []) as WorkspaceRow[]) {
    workspaceMap[ws.id] = ws.name
  }

  const needsApprovalByWs: Record<string, number> = {}
  for (const row of needsApprovalResult.data ?? []) {
    needsApprovalByWs[row.workspace_id] = (needsApprovalByWs[row.workspace_id] || 0) + 1
  }

  const activeConfigs = configs.filter((c) => c.is_active)
  const humanInLoopCount = configs.filter((c) => c.human_in_the_loop).length
  const totalNeedsApproval = (needsApprovalResult.data ?? []).length

  const summaryStats = [
    {
      label: 'Active AI SDRs',
      value: activeConfigs.length,
      icon: Bot,
      color: 'text-green-600',
    },
    {
      label: 'Human-in-the-Loop',
      value: humanInLoopCount,
      icon: Inbox,
      color: 'text-blue-600',
    },
    {
      label: 'Drafts Pending Approval',
      value: totalNeedsApproval,
      icon: Inbox,
      color: totalNeedsApproval > 0 ? 'text-amber-600' : 'text-muted-foreground',
    },
  ]

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">AI Agents</h1>
        <Link
          href="/admin/sdr"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Full SDR Dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summaryStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} padding="sm">
              <div className="flex items-center gap-3">
                <div className={stat.color}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Link
          href="/admin/sdr"
          className="block group"
        >
          <Card padding="sm" className="hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  AI SDR Manager
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage per-workspace AI SDR configurations, review pending drafts
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
          </Card>
        </Link>

        <Link
          href="/admin/autoresearch"
          className="block group"
        >
          <Card padding="sm" className="hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Autoresearch Engine
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A/B experiment automation, winning pattern discovery
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
          </Card>
        </Link>
      </div>

      {configs.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No AI SDR configurations found.</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Per-Workspace SDR Status</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Workspace</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mode</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Pending Drafts</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((config) => {
                  const wsName = workspaceMap[config.workspace_id] ?? config.workspace_id.slice(0, 8)
                  const pending = needsApprovalByWs[config.workspace_id] ?? 0
                  return (
                    <tr
                      key={config.workspace_id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{wsName}</td>
                      <td className="px-4 py-3">
                        <Badge variant={config.is_active ? 'success' : 'muted'} dot size="sm">
                          {config.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={config.human_in_the_loop ? 'warning' : 'default'} size="sm">
                          {config.human_in_the_loop ? 'Human-in-Loop' : 'Autonomous'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {pending > 0 ? (
                          <span className="font-medium text-amber-600">{pending}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
