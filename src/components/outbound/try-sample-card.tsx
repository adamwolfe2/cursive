'use client'

/**
 * Try Sample — the first-run aha card for Outbound Agent.
 *
 * Renders a big primary-color callout with a single button. On click, it
 * POSTs to /api/outbound/sample/create, shows a progress checklist while
 * the backend generates real Claude drafts against the user's existing
 * leads, then redirects to /outbound/[id] where the drafts are waiting.
 *
 * This card replaces the blank "No workflows yet" empty state for first-time
 * Outbound Agent users. The whole point is to skip the form-configure step
 * and let the user SEE the value in under 30 seconds.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Phase = 'idle' | 'creating' | 'drafting' | 'error'

interface SampleResponse {
  workflow_id: string
  draft_count: number
  prospect_count: number
  already_existed: boolean
}

export function TrySampleCard() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleTrySample = async () => {
    setError(null)
    setPhase('creating')

    try {
      // Bump the phase quickly so users see progress even while the single
      // network call is in flight. The backend actually does both steps
      // (workflow creation + parallel draft generation) inside one request,
      // but the UI needs forward motion or the ~15s feels broken.
      const drafting = setTimeout(() => setPhase('drafting'), 1_500)

      const res = await fetch('/api/outbound/sample/create', { method: 'POST' })
      clearTimeout(drafting)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        // Check for the structured NO_LEADS code (not substring match) so
        // copy drift never breaks the "Go to Setup" CTA path.
        if (body.code === 'NO_LEADS') {
          setError('NO_LEADS')
          setPhase('error')
          return
        }
        throw new Error(
          body.error ||
            'We couldn\'t create your sample workflow. Please try again or create a workflow manually.',
        )
      }

      const { data } = (await res.json()) as { data: SampleResponse }

      // Show the celebration banner only on the FIRST sample creation. If
      // the user clicks Try Sample again and we returned the existing
      // workflow, drop the ?sample=ready query param so they don't see the
      // congratulatory banner every time.
      const target = data.already_existed
        ? `/outbound/${data.workflow_id}`
        : `/outbound/${data.workflow_id}?sample=ready`
      router.push(target)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('error')
    }
  }

  // ── Error state ──────────────────────────────────────────────────────
  if (phase === 'error') {
    const needsSetup = error === 'NO_LEADS'
    const displayMessage = needsSetup
      ? "You haven't pulled any leads yet. Complete the setup wizard first — it pulls your first batch of enriched leads, and the Outbound Agent sample drafts emails against them."
      : error
    return (
      <Card className="p-6 border-destructive/30 bg-destructive/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">
              {needsSetup ? 'Run setup first' : "Sample workflow couldn't start"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{displayMessage}</p>
            <div className="mt-4 flex items-center gap-3">
              {needsSetup ? (
                <Link href="/setup">
                  <Button size="sm">Go to Setup</Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setError(null)
                    setPhase('idle')
                  }}
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // ── Working state — progress checklist ───────────────────────────────
  if (phase === 'creating' || phase === 'drafting') {
    return (
      <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center gap-3 mb-5">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-base font-semibold text-foreground">Building your sample workflow...</span>
        </div>
        <ol className="space-y-3.5">
          <Step
            status={phase === 'creating' ? 'current' : 'done'}
            workingLabel="Picking 3 enriched leads from your workspace"
            doneLabel="Picked 3 enriched leads"
          />
          <Step
            status={phase === 'creating' ? 'pending' : 'current'}
            workingLabel="Writing personalized emails with Claude"
            doneLabel="Drafted 3 personalized emails"
          />
          <Step status="pending" workingLabel="" doneLabel="Ready to review" />
        </ol>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Usually 10–20 seconds. Real leads. Real drafts. No credits spent.
        </p>
      </Card>
    )
  }

  // ── Idle — the big "try it" CTA ──────────────────────────────────────
  return (
    <Card className="p-8 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <div className="flex flex-col items-center text-center max-w-xl mx-auto">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          See it work in 30 seconds.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          We&apos;ll pull 3 real enriched leads from your workspace and draft a
          personalized cold email for each one — powered by Claude, ready for
          your review. No credits spent. No Gmail required to preview.
        </p>

        <Button
          size="lg"
          onClick={handleTrySample}
          className="mt-6"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Try Sample Workflow
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Or{' '}
          <Link href="/outbound/new" className="underline hover:text-foreground">
            create a workflow manually
          </Link>{' '}
          to configure your own ICP.
        </p>
      </div>
    </Card>
  )
}

function Step({
  status,
  workingLabel,
  doneLabel,
}: {
  status: 'current' | 'done' | 'pending'
  workingLabel: string
  doneLabel: string
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        {status === 'done' && <CheckCircle2 className="h-5 w-5 text-primary" />}
        {status === 'current' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        {status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
      </div>
      <span
        className={[
          'text-sm',
          status === 'done' && 'text-foreground',
          status === 'current' && 'text-foreground font-medium',
          status === 'pending' && 'text-muted-foreground',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {status === 'done' ? doneLabel : status === 'current' ? workingLabel : doneLabel}
      </span>
    </li>
  )
}
