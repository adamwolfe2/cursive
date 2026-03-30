'use client'

/**
 * Email Accounts Settings Page
 * Connect and manage email sending accounts for outreach sequences
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/lib/hooks/use-toast'
import {
  Mail,
  Plus,
  Trash2,
  Star,
  CheckCircle,
  AlertCircle,
  Send,
  Server,
  Info,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface EmailAccount {
  id: string
  provider: 'gmail' | 'outlook' | 'smtp' | 'resend'
  email: string
  name: string | null
  is_primary: boolean
  is_verified: boolean
  daily_send_limit: number
  sends_today: number
  smtp_host: string | null
  smtp_port: number | null
  smtp_username: string | null
  created_at: string
}

interface AddSmtpForm {
  name: string
  email: string
  smtp_host: string
  smtp_port: string
  smtp_username: string
  smtp_password: string
  daily_send_limit: string
}

const DEFAULT_FORM: AddSmtpForm = {
  name: '',
  email: '',
  smtp_host: '',
  smtp_port: '587',
  smtp_username: '',
  smtp_password: '',
  daily_send_limit: '50',
}

// ============================================================================
// HELPERS
// ============================================================================

function ProviderIcon({ provider }: { provider: EmailAccount['provider'] }) {
  if (provider === 'gmail') {
    return (
      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
        <Mail className="h-4 w-4 text-red-600" />
      </div>
    )
  }
  if (provider === 'outlook') {
    return (
      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <Mail className="h-4 w-4 text-blue-600" />
      </div>
    )
  }
  if (provider === 'resend') {
    return (
      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
        <Send className="h-4 w-4 text-purple-600" />
      </div>
    )
  }
  // SMTP
  return (
    <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
      <Server className="h-4 w-4 text-zinc-600" />
    </div>
  )
}

function providerLabel(provider: EmailAccount['provider']): string {
  const labels: Record<EmailAccount['provider'], string> = {
    gmail: 'Gmail',
    outlook: 'Outlook',
    smtp: 'SMTP',
    resend: 'Resend',
  }
  return labels[provider]
}

// ============================================================================
// PAGE
// ============================================================================

export default function EmailAccountsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [form, setForm] = useState<AddSmtpForm>(DEFAULT_FORM)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  const { data, isLoading } = useQuery({
    queryKey: ['email-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/email-accounts')
      if (!res.ok) throw new Error('Failed to load email accounts')
      return res.json() as Promise<{ data: { accounts: EmailAccount[] } }>
    },
  })

  const accounts = data?.data.accounts ?? []

  // -----------------------------------------------------------------------
  // Mutations
  // -----------------------------------------------------------------------

  const addMutation = useMutation({
    mutationFn: async (values: AddSmtpForm) => {
      const res = await fetch('/api/email-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          name: values.name,
          smtp_host: values.smtp_host,
          smtp_port: parseInt(values.smtp_port, 10),
          smtp_username: values.smtp_username,
          smtp_password: values.smtp_password,
          daily_send_limit: parseInt(values.daily_send_limit, 10) || 50,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to add email account')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] })
      setShowAddDialog(false)
      setForm(DEFAULT_FORM)
      toast({ type: 'success', message: 'Email account added successfully' })
    },
    onError: (err: Error) => {
      toast({ type: 'error', message: err.message })
    },
  })

  const setPrimaryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/email-accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_primary' }),
      })
      if (!res.ok) throw new Error('Failed to set primary account')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] })
      toast({ type: 'success', message: 'Primary email account updated' })
    },
    onError: () => {
      toast({ type: 'error', message: 'Failed to update primary account' })
    },
  })

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      setTestingId(id)
      const res = await fetch(`/api/email-accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_connection' }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Connection test failed')
      return body
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] })
      toast({ type: 'success', message: result.data?.message ?? 'Connection verified' })
    },
    onError: (err: Error) => {
      toast({ type: 'error', message: err.message })
    },
    onSettled: () => {
      setTestingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/email-accounts/${id}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('Failed to remove account')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] })
      setDeleteConfirmId(null)
      toast({ type: 'success', message: 'Email account removed' })
    },
    onError: () => {
      toast({ type: 'error', message: 'Failed to remove email account' })
    },
  })

  // -----------------------------------------------------------------------
  // Form helpers
  // -----------------------------------------------------------------------

  const updateForm = (field: keyof AddSmtpForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const isFormValid =
    form.name.trim() &&
    form.email.trim() &&
    form.smtp_host.trim() &&
    form.smtp_port.trim() &&
    form.smtp_username.trim() &&
    form.smtp_password.trim()

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Email Accounts</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connect sending accounts for your outreach sequences.
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add SMTP Account
        </Button>
      </div>

      {/* Coming soon notice */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
        <span>
          Gmail and Outlook OAuth connection are coming soon. For now, use the SMTP option to connect any email account.
        </span>
      </div>

      {/* Accounts list */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            The primary account is used as the default sender for all sequences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-12 text-center">
              <Mail className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No email accounts connected
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Add an SMTP account to start sending sequences from your own email.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add SMTP Account
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {accounts.map((account) => (
                <div key={account.id} className="py-4 flex items-start justify-between gap-4">
                  {/* Left: icon + info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <ProviderIcon provider={account.provider} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-medium text-sm text-foreground">
                          {account.name ?? account.email}
                        </span>
                        {account.is_primary && (
                          <Badge className="text-xs bg-amber-100 text-amber-700 border-0 px-1.5">
                            <Star className="h-2.5 w-2.5 mr-1" />
                            Primary
                          </Badge>
                        )}
                        {account.is_verified ? (
                          <Badge className="text-xs bg-green-100 text-green-700 border-0 px-1.5">
                            <CheckCircle className="h-2.5 w-2.5 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="text-xs bg-zinc-100 text-zinc-500 border-0 px-1.5">
                            <AlertCircle className="h-2.5 w-2.5 mr-1" />
                            Unverified
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{account.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>{providerLabel(account.provider)}</span>
                        {account.smtp_host && (
                          <span className="font-mono">{account.smtp_host}:{account.smtp_port}</span>
                        )}
                        <span>
                          {account.sends_today} / {account.daily_send_limit} sent today
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {account.provider === 'smtp' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={testingId === account.id || testMutation.isPending}
                        onClick={() => testMutation.mutate(account.id)}
                        className="text-xs"
                      >
                        {testingId === account.id ? 'Testing…' : 'Test'}
                      </Button>
                    )}
                    {!account.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={setPrimaryMutation.isPending}
                        onClick={() => setPrimaryMutation.mutate(account.id)}
                        className="text-xs"
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteConfirmId(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fallback info */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1.5">
            How email sending works
          </h3>
          <p className="text-sm text-muted-foreground">
            When you launch a sequence, Cursive uses your primary email account to send outreach.
            If no account is connected, emails fall back to <code className="bg-muted px-1 rounded text-xs">noreply@cursive.io</code>.
            Connect your own account to improve deliverability and reply tracking.
          </p>
        </CardContent>
      </Card>

      {/* Add SMTP Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add SMTP Account</DialogTitle>
            <DialogDescription>
              Connect any email account via SMTP. Your credentials are stored securely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FormField label="From Name" required>
              <Input
                placeholder="e.g. Jane Smith"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
              />
            </FormField>

            <FormField label="Email Address" required>
              <Input
                type="email"
                placeholder="jane@company.com"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <FormField label="SMTP Host" required>
                  <Input
                    placeholder="smtp.gmail.com"
                    value={form.smtp_host}
                    onChange={(e) => updateForm('smtp_host', e.target.value)}
                  />
                </FormField>
              </div>
              <div>
                <FormField label="Port" required>
                  <Input
                    type="number"
                    placeholder="587"
                    value={form.smtp_port}
                    onChange={(e) => updateForm('smtp_port', e.target.value)}
                  />
                </FormField>
              </div>
            </div>

            <FormField label="Username" required>
              <Input
                placeholder="jane@company.com"
                value={form.smtp_username}
                onChange={(e) => updateForm('smtp_username', e.target.value)}
              />
            </FormField>

            <FormField label="Password" required>
              <Input
                type="password"
                placeholder="App password or SMTP password"
                value={form.smtp_password}
                onChange={(e) => updateForm('smtp_password', e.target.value)}
              />
            </FormField>

            <FormField
              label="Daily Send Limit"
              description="Maximum emails to send per day from this account"
            >
              <Input
                type="number"
                placeholder="50"
                min="1"
                max="10000"
                value={form.daily_send_limit}
                onChange={(e) => updateForm('daily_send_limit', e.target.value)}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                setForm(DEFAULT_FORM)
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!isFormValid || addMutation.isPending}
              onClick={() => addMutation.mutate(form)}
            >
              {addMutation.isPending ? 'Adding…' : 'Add Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Email Account?</DialogTitle>
            <DialogDescription>
              This account will no longer be used for sending. Any active sequences
              using it will fall back to the primary account. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteConfirmId && deleteMutation.mutate(deleteConfirmId)
              }
            >
              {deleteMutation.isPending ? 'Removing…' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
