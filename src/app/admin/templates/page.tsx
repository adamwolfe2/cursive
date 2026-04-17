import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle2, Clock, Archive } from 'lucide-react'

interface EmailTemplateRow {
  id: string
  name: string
  subject: string
  workspace_id: string
  status: string
  created_at: string
  workspaceName?: string | null
}

interface WorkspaceRow {
  id: string
  name: string
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
  draft: 'warning',
  archived: 'muted',
}

export default async function AdminTemplatesPage() {
  const supabase = createAdminClient()

  const [templatesResult, workspacesResult] = await Promise.all([
    supabase
      .from('email_templates')
      .select('id, name, subject, workspace_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('workspaces').select('id, name'),
  ])

  const templates = (templatesResult.data ?? []) as EmailTemplateRow[]
  const workspaceMap: Record<string, string> = {}
  for (const ws of (workspacesResult.data ?? []) as WorkspaceRow[]) {
    workspaceMap[ws.id] = ws.name
  }

  const enriched = templates.map((t) => ({
    ...t,
    workspaceName: workspaceMap[t.workspace_id] ?? null,
  }))

  const totalActive = enriched.filter((t) => t.status === 'active').length
  const totalDraft = enriched.filter((t) => t.status === 'draft').length
  const totalArchived = enriched.filter((t) => t.status === 'archived').length

  const stats = [
    { label: 'Total Templates', value: enriched.length, icon: FileText, color: 'text-foreground' },
    { label: 'Active', value: totalActive, icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Draft', value: totalDraft, icon: Clock, color: 'text-yellow-600' },
    { label: 'Archived', value: totalArchived, icon: Archive, color: 'text-muted-foreground' },
  ]

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All email templates across workspaces.
        </p>
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
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground mb-1">No templates yet</p>
            <p className="text-sm text-muted-foreground">
              Email templates will appear here once workspaces create them.
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Workspace</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((template) => {
                  const variant = STATUS_VARIANTS[template.status] ?? 'default'
                  return (
                    <tr
                      key={template.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {template.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[300px]">
                        <span className="line-clamp-1">{template.subject}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {template.workspaceName ?? (
                          <span className="text-xs text-muted-foreground/60 italic">
                            {template.workspace_id.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={variant} dot size="sm">
                          {template.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(template.created_at)}
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
