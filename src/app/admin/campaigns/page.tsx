import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Mail, Users, BarChart2 } from 'lucide-react'

interface WorkspaceCampaignRow {
  id: string
  name: string
  workspace_id: string
  status: string
  created_at: string
  total_leads?: number
  workspaceName?: string | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'muted' | 'default'> = {
  active: 'success',
  paused: 'warning',
  completed: 'muted',
  draft: 'default',
}

export default async function AdminCampaignsPage() {
  const supabase = createAdminClient()

  const [campaignsResult, workspacesResult] = await Promise.all([
    supabase
      .from('campaigns')
      .select('id, name, workspace_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('workspaces')
      .select('id, name'),
  ])

  const campaigns = (campaignsResult.data ?? []) as WorkspaceCampaignRow[]
  const workspaceMap: Record<string, string> = {}
  for (const ws of workspacesResult.data ?? []) {
    workspaceMap[ws.id] = ws.name
  }

  const enriched = campaigns.map((c) => ({
    ...c,
    workspaceName: workspaceMap[c.workspace_id] ?? null,
  }))

  const totalActive = enriched.filter((c) => c.status === 'active').length
  const totalPaused = enriched.filter((c) => c.status === 'paused').length
  const totalCompleted = enriched.filter((c) => c.status === 'completed').length

  const stats = [
    { label: 'Total Campaigns', value: enriched.length, icon: Mail, color: 'text-foreground' },
    { label: 'Active', value: totalActive, icon: BarChart2, color: 'text-green-600' },
    { label: 'Paused', value: totalPaused, icon: Mail, color: 'text-yellow-600' },
    { label: 'Completed', value: totalCompleted, icon: Users, color: 'text-muted-foreground' },
  ]

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
        <Link
          href="/admin/leads"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View Leads
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
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

      {enriched.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-12">
            <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground mb-1">No campaigns yet</p>
            <p className="text-sm text-muted-foreground">
              Campaigns will appear here once workspaces create them.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Workspace</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((campaign) => {
                  const variant = STATUS_VARIANTS[campaign.status] ?? 'default'
                  return (
                    <tr
                      key={campaign.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {campaign.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {campaign.workspaceName ?? (
                          <span className="text-xs text-muted-foreground/60 italic">
                            {campaign.workspace_id.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={variant} dot size="sm">
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(campaign.created_at)}
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
