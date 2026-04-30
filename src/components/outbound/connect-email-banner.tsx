'use client'

/**
 * Connect Email Banner — Phase 0 safety lock UI
 *
 * Shown on the workflow detail page when the workspace has no verified
 * sending account. Subscribes to the same `['outbound','stats',id]` query
 * the stage pipeline polls, so it always reflects the live gate state.
 *
 * Click "Connect Gmail" → /api/integrations/gmail/authorize → Google OAuth
 * → callback → back to the workflow page with ?gmail_connected=1.
 *
 * Surfaces gmail_connected / gmail_error toasts on first render.
 */

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import type { WorkflowStatsResponse } from '@/types/outbound'

// Note: we use window.location.assign (not <a> wrapping the Button) because
// the Button component renders <motion.button>, and <a><button>...</button></a>
// is invalid HTML — React/framer-motion swallow the click on some browsers.
// window.location.assign forces a hard navigation so the server's 302 to
// Google's OAuth screen is followed properly.

export interface ConnectEmailBannerProps {
  agentId: string
}

export function ConnectEmailBanner({ agentId }: ConnectEmailBannerProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { success, error } = useToast()

  // Surface OAuth callback result + clean up URL
  useEffect(() => {
    const connected = searchParams.get('gmail_connected')
    const errMsg = searchParams.get('gmail_error')
    if (connected) {
      const email = searchParams.get('email')
      success(email ? `Connected ${email}` : 'Gmail connected', { title: 'Sending account ready' })
      // Force a stats refetch so the banner flips immediately
      queryClient.invalidateQueries({ queryKey: ['outbound', 'stats', agentId] })
      router.replace(pathname)
    } else if (errMsg) {
      error(errMsg, { title: 'Gmail connect failed' })
      router.replace(pathname)
    }
  }, [searchParams, success, error, queryClient, agentId, pathname, router])

  const { data } = useQuery<WorkflowStatsResponse>({
    queryKey: ['outbound', 'stats', agentId],
    // The query is owned by StagePipeline; this just subscribes for cache reads.
    enabled: false,
  })

  const sending = data?.sending_account
  if (!sending) return null

  const connectHref = `/api/integrations/gmail/authorize?return_to=${encodeURIComponent(`/outbound/${agentId}`)}`
  const goConnect = () => window.location.assign(connectHref)

  // ── State A: account exists but Google revoked the token ───────────────────
  if (sending.needs_reconnect && sending.account) {
    return (
      <Card className="mb-6 border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive flex-shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Gmail access revoked — reconnect {sending.account.email_address}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Google says the connection is no longer authorized (most likely you removed Cursive from your
              Google Account or changed your password). Run is locked until you re-authorize.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="destructive" onClick={goConnect}>
                <Mail className="h-4 w-4 mr-1.5" />
                Reconnect Gmail
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (sending.ready && sending.account) {
    const handleDisconnect = async () => {
      if (!confirm(`Disconnect ${sending.account!.email_address}?`)) return
      try {
        const r = await fetch('/api/integrations/gmail/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_id: sending.account!.id }),
        })
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Disconnect failed')
        success('Gmail disconnected', { title: 'Account removed' })
        queryClient.invalidateQueries({ queryKey: ['outbound', 'stats', agentId] })
      } catch (err) {
        error((err as Error).message, { title: 'Disconnect failed' })
      }
    }

    const handleTestSend = async () => {
      try {
        const r = await fetch('/api/integrations/gmail/test-send', { method: 'POST' })
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j.error || 'Test send failed')
        success(`Test email sent to ${j.sent_to}. Check your inbox!`, {
          title: 'Test send successful',
          duration: 8000,
        })
        // Re-poll stats in case test send revealed a token issue
        queryClient.invalidateQueries({ queryKey: ['outbound', 'stats', agentId] })
      } catch (err) {
        error((err as Error).message, { title: 'Test send failed' })
      }
    }

    // Show a thin "connected" confirmation strip
    return (
      <Card className="mb-6 flex items-center justify-between gap-3 border-success/30 bg-success/5 px-5 py-3">
        <div className="flex items-center gap-3 text-sm min-w-0">
          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
          <div className="truncate">
            <span className="font-medium text-foreground">Sending from </span>
            <span className="text-foreground">{sending.account.email_address}</span>
            <span className="text-muted-foreground"> · {sending.account.provider}</span>
            {sending.count > 1 && (
              <span className="text-muted-foreground"> · +{sending.count - 1} more</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleTestSend}>
            Send test
          </Button>
          <Button variant="outline" size="sm" onClick={goConnect}>
            <Mail className="h-3.5 w-3.5 mr-1" />
            Add another
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
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
            <Button size="sm" onClick={goConnect}>
              <Mail className="h-4 w-4 mr-1.5" />
              Connect Gmail
            </Button>
            <span className="text-xs text-muted-foreground">
              Takes 30 seconds — Google sign-in, no password stored
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
