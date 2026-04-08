'use client'

/**
 * Email Accounts Settings Page
 * ----------------------------
 * Manage the workspace's connected sending accounts. v1 only supports
 * Gmail OAuth (Outlook coming later). Surfaces:
 *   - "Connect Gmail" button → /api/integrations/gmail/authorize
 *   - List of currently connected accounts (email, status, last refresh)
 *   - Disconnect / Reconnect / Test send actions per account
 *   - OAuth callback toast (?gmail_connected=1 / ?gmail_error=…)
 *
 * Talks to:
 *   - GET    /api/integrations/gmail/accounts
 *   - POST   /api/integrations/gmail/disconnect
 *   - POST   /api/integrations/gmail/test-send
 *   - GET    /api/integrations/gmail/authorize?return_to=/settings/email-accounts
 *
 * The previous version of this page (565 lines) was a partial SMTP form
 * that hit endpoints/columns that don't exist in production. It has been
 * fully replaced. The email_accounts table was empty so no data was lost.
 */

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
// PageContainer + PageHeader removed — settings-layout-client already wraps
// every settings page in those, and including them again created a doubled
// header / breadcrumbs / padding stack.
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/lib/hooks/use-toast'
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Send,
  Plus,
  Loader2,
} from 'lucide-react'

interface GmailAccount {
  id: string
  email_address: string
  display_name: string | null
  is_primary: boolean
  is_verified: boolean
  last_token_refresh_at: string | null
  created_at: string
  oauth_provider_user_id: string | null
  connection_status?: 'active' | 'needs_reconnect' | 'disabled'
}

const CONNECT_HREF = '/api/integrations/gmail/authorize?return_to=/settings/email-accounts'
// The Button component renders motion.button, which can't be wrapped by <a>
// (invalid HTML; React/framer swallow the click). All Connect Gmail
// navigations use this hard-navigation helper instead.
const goConnect = () => window.location.assign(CONNECT_HREF)

export default function EmailAccountsPage() {
  const queryClient = useQueryClient()
  const { success, error: errorToast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Surface OAuth callback result + clean up the URL
  useEffect(() => {
    const connected = searchParams.get('gmail_connected')
    const errMsg = searchParams.get('gmail_error')
    if (connected) {
      const email = searchParams.get('email')
      success(email ? `Connected ${email}` : 'Gmail connected', { title: 'Sending account ready' })
      queryClient.invalidateQueries({ queryKey: ['gmail-accounts'] })
      router.replace(pathname)
    } else if (errMsg) {
      errorToast(errMsg, { title: 'Gmail connect failed' })
      router.replace(pathname)
    }
  }, [searchParams, success, errorToast, queryClient, pathname, router])

  const { data, isLoading } = useQuery<{ data: GmailAccount[] }>({
    queryKey: ['gmail-accounts'],
    queryFn: async () => {
      const r = await fetch('/api/integrations/gmail/accounts')
      if (!r.ok) throw new Error('Failed to load accounts')
      return r.json()
    },
  })

  const accounts = data?.data ?? []

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const r = await fetch('/api/integrations/gmail/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId }),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Disconnect failed')
    },
    onSuccess: () => {
      success('Account disconnected')
      queryClient.invalidateQueries({ queryKey: ['gmail-accounts'] })
    },
    onError: (err: Error) => errorToast(err.message, { title: 'Disconnect failed' }),
  })

  const testSendMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/integrations/gmail/test-send', { method: 'POST' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Test send failed')
      return j as { ok: boolean; message_id: string; sent_to: string }
    },
    onSuccess: data => {
      success(`Test email sent to ${data.sent_to}. Check your inbox!`, {
        title: 'Test send successful',
        duration: 8000,
      })
      queryClient.invalidateQueries({ queryKey: ['gmail-accounts'] })
    },
    onError: (err: Error) => errorToast(err.message, { title: 'Test send failed' }),
  })

  return (
    <div>
      {/* The settings layout already wraps every page in PageContainer +
          PageHeader, so we just render the local section header inline.
          Wrapping the whole thing in a second PageContainer was creating
          double padding + double breadcrumbs + double "Settings" headers. */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Email Accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Connect the Gmail (or other) inboxes Cursive uses to send your outbound emails. Each workspace sends from its own inbox — never the platform default.
          </p>
        </div>
        <Button onClick={goConnect}>
          <Plus className="h-4 w-4 mr-1.5" />
          Connect Gmail
        </Button>
      </div>

      {/* Hero — explain what this is */}
      <Card className="mb-6 p-5 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Why connect your own inbox?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              When you click Run on an Outbound Agent workflow, Cursive sends every email through your
              personal Google account using OAuth — your domain, your sender, your sender reputation.
              Replies land back in your normal Gmail inbox AND show up in the workflow dashboard automatically.
              Cursive never stores your password and you can disconnect any time.
            </p>
          </div>
        </div>
      </Card>

      {/* Account list */}
      {isLoading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Loading accounts…
        </Card>
      ) : accounts.length === 0 ? (
        <Card className="p-10 text-center">
          <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No email accounts connected yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Connect your Gmail to start running outbound workflows.
          </p>
          <div className="mt-4">
            <Button onClick={goConnect}>
              <Mail className="h-4 w-4 mr-1.5" />
              Connect Gmail
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {accounts.map(account => {
            const status = account.connection_status ?? 'active'
            const isHealthy = status === 'active' && account.is_verified
            return (
              <Card key={account.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${
                        isHealthy
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {isHealthy ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground truncate">
                          {account.email_address}
                        </p>
                        {account.is_primary && <Badge variant="info">Primary</Badge>}
                        {status === 'needs_reconnect' && (
                          <Badge variant="destructive">Needs reconnect</Badge>
                        )}
                        {status === 'active' && account.is_verified && (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                      {account.display_name && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{account.display_name}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Connected {new Date(account.created_at).toLocaleDateString()} ·{' '}
                        {account.last_token_refresh_at
                          ? `Token refreshed ${formatRelative(account.last_token_refresh_at)}`
                          : 'Never refreshed'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {status === 'needs_reconnect' ? (
                      <Button variant="destructive" size="sm" onClick={goConnect}>
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        Reconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testSendMutation.mutate()}
                        disabled={testSendMutation.isPending}
                        loading={testSendMutation.isPending}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Send test
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Disconnect ${account.email_address}?`)) {
                          disconnectMutation.mutate(account.id)
                        }
                      }}
                      disabled={disconnectMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime()
  const diffMin = Math.floor((Date.now() - t) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d ago`
}
