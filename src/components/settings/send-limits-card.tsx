'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/lib/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkspaceStats {
  global_limit: number
  sent_today: number
  remaining: number
  usage_percent: number
}

interface CampaignStats {
  id: string
  name: string
  sent: number
  limit: number
  usage_percent: number
}

interface SendLimitsResponse {
  workspace: WorkspaceStats
  campaigns: CampaignStats[]
  total_campaigns: number
}

interface MeResponse {
  data: {
    role: string
    [key: string]: unknown
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UsageBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent))
  const colorClass =
    clamped >= 100
      ? 'bg-red-500'
      : clamped > 80
        ? 'bg-amber-500'
        : 'bg-primary'

  return (
    <div className="w-full bg-muted rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full transition-all ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

function UsageBadge({ percent }: { percent: number }) {
  if (percent >= 100) {
    return (
      <Badge variant="destructive" size="sm">
        Limit Reached
      </Badge>
    )
  }
  if (percent > 80) {
    return (
      <Badge variant="warning" size="sm">
        High Usage
      </Badge>
    )
  }
  return null
}

function SendLimitsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SendLimitsCard() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [limitInput, setLimitInput] = useState('')

  // Fetch send limits data
  const { data: limitsData, isLoading: limitsLoading } = useQuery<SendLimitsResponse>({
    queryKey: ['workspace', 'send-limits'],
    queryFn: async () => {
      const res = await fetch('/api/workspace/send-limits')
      if (!res.ok) throw new Error('Failed to fetch send limits')
      const json = await res.json()
      return json.data ?? json
    },
  })

  // Fetch current user to check role
  const { data: meData, isLoading: meLoading } = useQuery<MeResponse>({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/users/me')
      if (!res.ok) throw new Error('Failed to fetch user')
      return res.json()
    },
  })

  const isAdmin =
    meData?.data?.role === 'owner' || meData?.data?.role === 'admin'

  // PATCH mutation to update global daily send limit
  const updateLimitMutation = useMutation({
    mutationFn: async (global_daily_send_limit: number) => {
      const res = await fetch('/api/workspace/send-limits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ global_daily_send_limit }),
      })
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}))
        throw new Error(errorJson.error || 'Failed to update send limit')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', 'send-limits'] })
      toast.success('Daily send limit updated')
      setIsEditing(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update send limit')
    },
  })

  const handleOpenEdit = () => {
    setLimitInput(String(limitsData?.workspace.global_limit ?? ''))
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setLimitInput('')
  }

  const handleSaveLimit = () => {
    const parsed = parseInt(limitInput, 10)
    if (isNaN(parsed) || parsed < 1 || parsed > 2000) {
      toast.error('Limit must be a number between 1 and 2,000')
      return
    }
    updateLimitMutation.mutate(parsed)
  }

  if (limitsLoading || meLoading) {
    return <SendLimitsSkeleton />
  }

  const workspace = limitsData?.workspace
  const campaigns = limitsData?.campaigns ?? []
  const topCampaigns = campaigns.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daily Email Send Limits</CardTitle>
          {workspace && <UsageBadge percent={workspace.usage_percent} />}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Workspace-level usage */}
        {workspace ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Workspace Total
              </span>
              <span className="text-sm text-muted-foreground">
                {workspace.sent_today.toLocaleString()} of{' '}
                {workspace.global_limit.toLocaleString()} emails sent today
              </span>
            </div>
            <UsageBar percent={workspace.usage_percent} />
            <p className="text-xs text-muted-foreground">
              {workspace.remaining.toLocaleString()} remaining · resets daily
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No usage data available.</p>
        )}

        {/* Update limit form — owner/admin only */}
        {isAdmin && (
          <div>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
              >
                Update Limit
              </Button>
            ) : (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Set new global daily send limit
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={2000}
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    placeholder="e.g. 500"
                    inputSize="sm"
                    className="w-32"
                    aria-label="New daily send limit"
                  />
                  <span className="text-sm text-muted-foreground">emails / day</span>
                </div>
                <p className="text-xs text-muted-foreground">Between 1 and 2,000</p>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleSaveLimit}
                    disabled={updateLimitMutation.isPending}
                    loading={updateLimitMutation.isPending}
                  >
                    {updateLimitMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={updateLimitMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top 5 campaigns by usage */}
        {topCampaigns.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="text-sm font-medium text-foreground">
              Top Campaigns by Usage
            </h4>
            <div className="space-y-2">
              {topCampaigns.map((campaign) => (
                <div key={campaign.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className="font-medium text-foreground truncate max-w-[200px]"
                      title={campaign.name}
                    >
                      {campaign.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {campaign.usage_percent >= 100 && (
                        <Badge variant="destructive" size="sm">
                          Limit Reached
                        </Badge>
                      )}
                      {campaign.usage_percent > 80 && campaign.usage_percent < 100 && (
                        <Badge variant="warning" size="sm">
                          High Usage
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {campaign.sent.toLocaleString()} / {campaign.limit.toLocaleString()}
                        {' '}({campaign.usage_percent}%)
                      </span>
                    </div>
                  </div>
                  <UsageBar percent={campaign.usage_percent} />
                </div>
              ))}
            </div>
          </div>
        )}

        {campaigns.length === 0 && (
          <p className="text-sm text-muted-foreground pt-2 border-t border-border">
            No active campaigns with send limits.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
