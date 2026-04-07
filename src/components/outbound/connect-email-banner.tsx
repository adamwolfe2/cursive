'use client'

/**
 * Connect Email Banner — Phase 0 safety lock UI
 *
 * Shown on the workflow detail page when the workspace has no verified
 * sending account. Subscribes to the same `['outbound','stats',id]` query
 * the stage pipeline polls, so it always reflects the live gate state.
 *
 * Click "Connect Gmail" → Phase 1 OAuth flow (next milestone).
 * Until Phase 1 ships, the button links to /settings/email-accounts.
 */

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ShieldAlert, CheckCircle2 } from 'lucide-react'
import type { WorkflowStatsResponse } from '@/types/outbound'

export interface ConnectEmailBannerProps {
  agentId: string
}

export function ConnectEmailBanner({ agentId }: ConnectEmailBannerProps) {
  const { data } = useQuery<WorkflowStatsResponse>({
    queryKey: ['outbound', 'stats', agentId],
    // The query is owned by StagePipeline; this just subscribes for cache reads.
    enabled: false,
  })

  const sending = data?.sending_account
  if (!sending) return null

  if (sending.ready && sending.account) {
    // Show a thin "connected" confirmation strip
    return (
      <Card className="mb-6 flex items-center gap-3 border-success/30 bg-success/5 px-5 py-3">
        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
        <div className="text-sm">
          <span className="font-medium text-foreground">Sending from </span>
          <span className="text-foreground">{sending.account.email_address}</span>
          <span className="text-muted-foreground"> · {sending.account.provider}</span>
          {sending.count > 1 && (
            <span className="text-muted-foreground"> · {sending.count - 1} other accounts available</span>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="mb-6 border-warning/30 bg-warning/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground flex-shrink-0">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Connect your sending email before running this workflow
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Outbound Agent sends from <span className="font-medium">your</span> Gmail / inbox so prospects see your real
            domain. Until you connect an account, the Run button is locked and no email will be drafted or sent.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link href="/settings/email-accounts">
              <Button size="sm">
                <Mail className="h-4 w-4 mr-1.5" />
                Connect Gmail
              </Button>
            </Link>
            <span className="text-xs text-muted-foreground">
              Takes 30 seconds — Google sign-in, no password stored
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
