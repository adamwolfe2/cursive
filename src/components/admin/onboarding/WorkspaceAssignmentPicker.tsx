'use client'

// EmailBison workspace assignment picker shown above the Approve Sequences button.
//
// Fetches the EB workspace list (child workspaces only) from the super-admin key
// and persists the selection to onboarding_clients.eb_workspace_id.
//
// The chosen eb_workspace_id routes the EB campaign push to the correct workspace,
// so senders connected to that workspace are attached automatically.

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Building2, AlertTriangle, CheckCircle2, FlaskConical, Plus, RefreshCw } from 'lucide-react'
import CreateWorkspaceModal from './CreateWorkspaceModal'

interface EBWorkspace {
  id: number
  name: string
}

interface Props {
  clientId: string
  initialEbWorkspaceId: number | null
  isTestClient: boolean
  copyApprovalStatus: string
  campaignDeployed: boolean
  defaultCreateName?: string
  onChange?: (ebWorkspaceId: number | null) => void
}

const NO_SELECTION = '__none__'

export default function WorkspaceAssignmentPicker({
  clientId,
  initialEbWorkspaceId,
  isTestClient,
  copyApprovalStatus,
  campaignDeployed,
  defaultCreateName,
  onChange,
}: Props) {
  const [workspaces, setWorkspaces] = useState<EBWorkspace[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(initialEbWorkspaceId)
  const [createOpen, setCreateOpen] = useState(false)

  const loadWorkspaces = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/emailbison/workspaces', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load EmailBison workspaces')
      const json = (await res.json()) as { workspaces?: EBWorkspace[] }
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

  const persistAssignment = useCallback(
    async (ebWorkspaceId: number | null) => {
      setError(null)
      setSaving(true)
      try {
        const res = await fetch(`/api/admin/onboarding/${clientId}/assign-eb-workspace`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eb_workspace_id: ebWorkspaceId }),
        })
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(json.error ?? 'Failed to save EB workspace assignment')
        }
        onChange?.(ebWorkspaceId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save')
        setSelected(initialEbWorkspaceId)
      } finally {
        setSaving(false)
      }
    },
    [clientId, initialEbWorkspaceId, onChange]
  )

  const handleChange = async (next: string) => {
    const ebWorkspaceId = next === NO_SELECTION ? null : parseInt(next, 10)
    setSelected(isNaN(ebWorkspaceId as number) ? null : ebWorkspaceId)
    await persistAssignment(isNaN(ebWorkspaceId as number) ? null : ebWorkspaceId)
  }

  const handleCreated = async (workspace: { id: number; name: string }) => {
    await loadWorkspaces()
    setSelected(workspace.id)
    await persistAssignment(workspace.id)
  }

  const notAssigned = selected === null
  // Lock the picker only AFTER campaigns are actually pushed to EmailBison.
  const isLocked = campaignDeployed
  const isApproved = copyApprovalStatus === 'approved'

  const options = [
    { value: NO_SELECTION, label: '— Select an EmailBison workspace —' },
    ...workspaces.map((w) => ({
      value: String(w.id),
      label: w.name,
    })),
  ]

  return (
    <Card padding="sm" className="border-blue-100 bg-blue-50/40">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-blue-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">EmailBison destination workspace</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Determines which EB workspace campaigns are created in, and which senders get attached.
                Set this <span className="font-medium">before</span> approving copy.
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
            {selected !== null && !saving && (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Workspace set
              </Badge>
            )}
            {notAssigned && !saving && (
              <Badge variant="destructive" size="sm">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Not assigned — push blocked
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selected !== null ? String(selected) : NO_SELECTION}
            onChange={(e) => handleChange(e.target.value)}
            disabled={loading || saving || isLocked}
            options={options}
            selectSize="sm"
            className="flex-1"
          />
          <button
            type="button"
            onClick={loadWorkspaces}
            disabled={loading || saving}
            title="Refresh EmailBison workspace list"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={isLocked}
            title="Create a new EmailBison workspace"
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 h-9 px-3 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New workspace
          </button>
        </div>

        <CreateWorkspaceModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          defaultName={defaultCreateName}
          onCreated={handleCreated}
        />

        {isLocked && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Campaigns have already been pushed to EmailBison. Changing the workspace now
            will not affect campaigns that were already created.
          </p>
        )}

        {notAssigned && !isLocked && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            No EmailBison workspace assigned — push will be blocked until you select one.
          </p>
        )}

        {isApproved && !isLocked && selected !== null && (
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
            Copy is approved but campaigns have not been pushed yet. The workspace you picked
            here will be used for the next push.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
