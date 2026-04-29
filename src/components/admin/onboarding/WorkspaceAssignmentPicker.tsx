'use client'

// Workspace assignment picker shown above the Approve Sequences button.
//
// Why this exists: EmailBison has no native multi-tenant scoping. The chosen
// workspace_id is what gets passed to pushCopyToEmailBison; it determines
// (a) the [ws:xxx] campaign name prefix and (b) which email_accounts get
// attached as senders. Picking the wrong workspace = wrong senders on the
// campaigns. Picking nothing = onboarding fallback (all connected senders).

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Building2, AlertTriangle, CheckCircle2, FlaskConical } from 'lucide-react'

interface Workspace {
  id: string
  name: string
  slug: string
}

interface Props {
  clientId: string
  initialWorkspaceId: string | null
  isTestClient: boolean
  copyApprovalStatus: string
  onChange?: (workspaceId: string | null) => void
}

const FALLBACK_VALUE = '__fallback__'

export default function WorkspaceAssignmentPicker({
  clientId,
  initialWorkspaceId,
  isTestClient,
  copyApprovalStatus,
  onChange,
}: Props) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(initialWorkspaceId)

  const loadWorkspaces = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/workspaces/list', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load workspaces')
      const json = (await res.json()) as { workspaces?: Workspace[] }
      setWorkspaces(json.workspaces ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  const handleChange = async (next: string) => {
    const workspaceId = next === FALLBACK_VALUE ? null : next
    setSelected(workspaceId)
    setError(null)
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/onboarding/${clientId}/assign-workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId }),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(json.error ?? 'Failed to save workspace assignment')
      }
      onChange?.(workspaceId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSelected(initialWorkspaceId)
    } finally {
      setSaving(false)
    }
  }

  const options = [
    { value: FALLBACK_VALUE, label: 'Onboarding fallback — attach all connected senders' },
    ...workspaces.map((w) => ({
      value: w.id,
      label: `${w.name} (${w.slug})`,
    })),
  ]

  const isApproved = copyApprovalStatus === 'approved'
  const usingFallback = selected === null

  return (
    <Card padding="sm" className="border-blue-100 bg-blue-50/40">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-blue-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">EmailBison destination workspace</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Picks which workspace&apos;s senders get attached when campaigns are created.
                Change this <span className="font-medium">before</span> approving copy.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isTestClient && (
              <Badge variant="warning" size="sm" dot>
                <FlaskConical className="h-3 w-3 mr-1" />
                Test client (dry-run push)
              </Badge>
            )}
            {selected && !saving && (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Workspace set
              </Badge>
            )}
            {usingFallback && !saving && (
              <Badge variant="warning" size="sm">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Fallback (all senders)
              </Badge>
            )}
          </div>
        </div>

        <Select
          value={selected ?? FALLBACK_VALUE}
          onChange={(e) => handleChange(e.target.value)}
          disabled={loading || saving || isApproved}
          options={options}
          selectSize="sm"
        />

        {isApproved && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Copy is already approved. Changing the workspace now will not affect campaigns
            already pushed to EmailBison.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {usingFallback && !isApproved && (
          <p className="text-xs text-muted-foreground">
            With the fallback, every connected EmailBison sender will be attached. Use this
            only if you don&apos;t have a dedicated workspace for this client yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
