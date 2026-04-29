'use client'

// Shows the EmailBison deployment state and lets admin run the push
// inline. Independent of Inngest because the prod Inngest project is
// unreachable (see project_inngest_orphaned memory). The button calls
// /api/admin/onboarding/[id]/push-emailbison directly.

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Rocket, CheckCircle2, AlertTriangle, FlaskConical } from 'lucide-react'

interface Props {
  clientId: string
  copyApprovalStatus: string
  campaignDeployed: boolean
  campaignIds: string[]
  isTestClient: boolean
  onDeployed?: () => void
}

interface PushResponse {
  success?: boolean
  dryRun?: boolean
  campaigns?: Array<{
    campaignId: string
    campaignName: string
    sequenceSteps: number
    variants: number
  }>
  campaign_ids?: string[]
  error?: string
  hint?: string
}

export default function DeploymentStatusCard({
  clientId,
  copyApprovalStatus,
  campaignDeployed,
  campaignIds,
  isTestClient,
  onDeployed,
}: Props) {
  const [pushing, setPushing] = useState(false)
  const [result, setResult] = useState<PushResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isApproved = copyApprovalStatus === 'approved'
  const showCard = isApproved || campaignDeployed

  if (!showCard) return null

  async function handlePush(force = false) {
    setPushing(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(
        `/api/admin/onboarding/${clientId}/push-emailbison${force ? '?force=1' : ''}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      )
      const json = (await res.json()) as PushResponse
      if (!res.ok) {
        setError(json.error ?? `Push failed (HTTP ${res.status})`)
        setResult(json)
      } else {
        setResult(json)
        onDeployed?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setPushing(false)
    }
  }

  const cardClass = campaignDeployed
    ? 'border-emerald-200 bg-emerald-50/40'
    : 'border-amber-200 bg-amber-50/40'

  return (
    <Card padding="sm" className={cardClass}>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2">
            <Rocket
              className={`h-4 w-4 mt-0.5 shrink-0 ${
                campaignDeployed ? 'text-emerald-700' : 'text-amber-700'
              }`}
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                EmailBison deployment
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {campaignDeployed
                  ? isTestClient
                    ? 'Dry-run campaigns synthesized — no real EB API calls were made.'
                    : 'Campaigns created in EmailBison from the approved copy.'
                  : 'Copy is approved but campaigns have not been pushed yet. Run the push manually below.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isTestClient && (
              <Badge variant="warning" size="sm">
                <FlaskConical className="h-3 w-3 mr-1" />
                Dry-run
              </Badge>
            )}
            {campaignDeployed ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Deployed
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Not deployed
              </Badge>
            )}
          </div>
        </div>

        {campaignDeployed && campaignIds.length > 0 && (
          <div className="rounded-md border border-border/60 bg-white/70 p-2 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Campaign IDs ({campaignIds.length})
            </p>
            <ul className="space-y-0.5">
              {campaignIds.map((id) => (
                <li key={id} className="text-xs font-mono text-foreground">
                  {id}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result?.campaigns && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              {result.dryRun ? 'Dry-run synthesized' : 'Pushed to EmailBison'}
            </p>
            <ul className="space-y-0.5">
              {result.campaigns.map((c) => (
                <li key={c.campaignId} className="text-xs text-emerald-900">
                  {c.campaignName} ({c.sequenceSteps} steps, {c.variants} variants)
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 space-y-1">
            <p className="text-xs text-red-700">{error}</p>
            {result?.hint && <p className="text-[11px] text-red-600">{result.hint}</p>}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!campaignDeployed && isApproved && (
            <Button
              variant="default"
              size="sm"
              loading={pushing}
              onClick={() => handlePush(false)}
              leftIcon={<Rocket className="h-3.5 w-3.5" />}
            >
              Push to EmailBison Now
            </Button>
          )}
          {campaignDeployed && (
            <Button
              variant="outline"
              size="sm"
              loading={pushing}
              onClick={() => handlePush(true)}
              leftIcon={<Rocket className="h-3.5 w-3.5" />}
            >
              Re-push (force)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
