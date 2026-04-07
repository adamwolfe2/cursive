'use client'

/**
 * Connect Email Banner — list-page variant
 *
 * The detail-page banner subscribes to a per-workflow stats query, but
 * the /outbound list page has no agent_id. This variant takes the gate
 * state directly as a prop (server-rendered) so the user sees the
 * Connect Gmail prompt the moment they land on /outbound.
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ShieldAlert, CheckCircle2 } from 'lucide-react'
import type { SendingAccountStatus } from '@/types/outbound'

export interface ConnectEmailListBannerProps {
  status: SendingAccountStatus
}

export function ConnectEmailListBanner({ status }: ConnectEmailListBannerProps) {
  const connectHref = '/api/integrations/gmail/authorize?return_to=/outbound'

  // Token-revoked state
  if (status.needs_reconnect && status.account) {
    return (
      <Card className="mb-6 border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive flex-shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Gmail access revoked — reconnect {status.account.email_address}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run is locked across all your workflows until you reconnect.
            </p>
            <div className="mt-3">
              <a href={connectHref}>
                <Button size="sm" variant="destructive">
                  <Mail className="h-4 w-4 mr-1.5" />
                  Reconnect Gmail
                </Button>
              </a>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Active state — single thin strip
  if (status.ready && status.account) {
    return (
      <Card className="mb-6 flex items-center gap-3 border-success/30 bg-success/5 px-5 py-3">
        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
        <div className="text-sm">
          <span className="font-medium text-foreground">Sending from </span>
          <span className="text-foreground">{status.account.email_address}</span>
          <span className="text-muted-foreground"> · {status.account.provider}</span>
          {status.count > 1 && (
            <span className="text-muted-foreground"> · +{status.count - 1} more</span>
          )}
        </div>
      </Card>
    )
  }

  // Not connected state
  return (
    <Card className="mb-6 border-warning/30 bg-warning/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground flex-shrink-0">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Connect your sending email to start using Outbound Agent
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Outbound Agent sends from <span className="font-medium">your</span> Gmail so prospects see your real
            domain. You can still create workflows without connecting, but Run is locked until at least one
            account is connected.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a href={connectHref}>
              <Button size="sm">
                <Mail className="h-4 w-4 mr-1.5" />
                Connect Gmail
              </Button>
            </a>
            <span className="text-xs text-muted-foreground">
              Takes 30 seconds — Google sign-in, no password stored
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
