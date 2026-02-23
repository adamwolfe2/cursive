'use client'

/**
 * API Keys Settings Page
 * Allows workspace owners/admins to create and revoke API keys for programmatic access
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Key, Plus, Trash2, Copy, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  rate_limit_per_minute: number | null
  rate_limit_per_day: number | null
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

interface AvailableScope {
  key: string
  description: string
}

interface CreateForm {
  name: string
  scopes: string[]
  expires_in_days: string
}

const DEFAULT_FORM: CreateForm = {
  name: '',
  scopes: ['read:leads'],
  expires_in_days: '',
}

export default function ApiKeysPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM)
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['workspace', 'api-keys'],
    queryFn: async () => {
      const res = await fetch('/api/workspace/api-keys')
      if (!res.ok) throw new Error('Failed to fetch API keys')
      return res.json() as Promise<{ data: { api_keys: ApiKey[]; available_scopes: AvailableScope[] } }>
    },
  })

  const apiKeys = data?.data.api_keys ?? []
  const availableScopes = data?.data.available_scopes ?? []

  const createMutation = useMutation({
    mutationFn: async (values: CreateForm) => {
      const res = await fetch('/api/workspace/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          scopes: values.scopes,
          expires_in_days: values.expires_in_days ? parseInt(values.expires_in_days) : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to create API key')
      }
      return res.json()
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['workspace', 'api-keys'] })
      setNewKeyValue(result.data.api_key.key)
      setForm(DEFAULT_FORM)
      setShowCreateDialog(false)
      toast({ type: 'success', message: 'API key created. Save it now — it won\'t be shown again.' })
    },
    onError: (err: Error) => {
      toast({ type: 'error', message: err.message })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch(`/api/workspace/api-keys?key_id=${keyId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to revoke key')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', 'api-keys'] })
      setRevokeConfirmId(null)
      toast({ type: 'success', message: 'API key revoked' })
    },
    onError: () => {
      toast({ type: 'error', message: 'Failed to revoke API key' })
    },
  })

  const handleCopyKey = async () => {
    if (!newKeyValue) return
    await navigator.clipboard.writeText(newKeyValue)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const toggleScope = (scope: string) => {
    setForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }))
  }

  const isExpired = (key: ApiKey) =>
    key.expires_at && new Date(key.expires_at) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate keys for programmatic access to your workspace data.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New API Key
        </Button>
      </div>

      {/* Newly created key banner */}
      {newKeyValue && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                Save your API key — it won&apos;t be shown again
              </p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 min-w-0 rounded bg-white border border-amber-200 px-3 py-2 text-xs font-mono text-amber-900 overflow-x-auto">
                  {newKeyValue}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyKey}
                  className="flex-shrink-0 border-amber-300 hover:bg-amber-100"
                >
                  {copiedKey ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-amber-700" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-3 text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNewKeyValue(null)}
              className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 text-xs"
            >
              I&apos;ve saved it, dismiss
            </Button>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            Your API Keys
          </CardTitle>
          <CardDescription>
            Keys are shown with their prefix only after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="py-10 text-center">
              <Key className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No API keys yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create an API key to access your workspace programmatically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {apiKeys.map((key) => {
                const expired = isExpired(key)
                return (
                  <div key={key.id} className="py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-foreground truncate">
                          {key.name}
                        </span>
                        {!key.is_active && (
                          <Badge variant="muted" className="text-xs">Revoked</Badge>
                        )}
                        {expired && key.is_active && (
                          <Badge className="text-xs bg-red-100 text-red-700 border-0">Expired</Badge>
                        )}
                        {key.is_active && !expired && (
                          <Badge className="text-xs bg-green-100 text-green-700 border-0">Active</Badge>
                        )}
                      </div>
                      <code className="text-xs text-muted-foreground font-mono">
                        {key.key_prefix}••••••••••••••••••••••••••••••••
                      </code>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                        </span>
                        {key.last_used_at && (
                          <span>Last used {formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })}</span>
                        )}
                        {key.expires_at && (
                          <span className={expired ? 'text-red-600' : ''}>
                            {expired ? 'Expired' : 'Expires'} {format(new Date(key.expires_at), 'MMM d, yyyy')}
                          </span>
                        )}
                        {key.scopes?.length > 0 && (
                          <span className="flex items-center gap-1 flex-wrap">
                            {key.scopes.map((s) => (
                              <code key={s} className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                {s}
                              </code>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                    {key.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setRevokeConfirmId(key.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limits & Usage */}
      {!isLoading && apiKeys.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Rate Limits & Usage
            </CardTitle>
            <CardDescription>
              Current rate limits and last activity per key.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {apiKeys.filter((k) => k.is_active && !isExpired(k)).map((key) => (
                <div key={key.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{key.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key.key_prefix}•••</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {key.rate_limit_per_minute ?? '—'}
                      </div>
                      <div className="text-muted-foreground">req/min</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {key.rate_limit_per_day != null
                          ? key.rate_limit_per_day.toLocaleString()
                          : '—'}
                      </div>
                      <div className="text-muted-foreground">req/day</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">
                        {key.last_used_at
                          ? formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })
                          : 'Never used'}
                      </div>
                      <div className="text-muted-foreground">last used</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage & Docs Info */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Using your API key</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Include your API key in the <code className="bg-muted px-1 rounded text-xs">Authorization</code> header:
          </p>
          <code className="block bg-muted rounded-lg p-3 text-xs font-mono text-foreground">
            Authorization: Bearer csk_your_api_key_here
          </code>
          <p className="text-xs text-muted-foreground mt-3">
            See the{' '}
            <a href="/docs/api" className="text-primary hover:underline">
              API documentation
            </a>{' '}
            for available endpoints and request formats.
          </p>
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Give your key a descriptive name and select the access scopes it needs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FormField label="Key name" error={undefined} required>
              <Input
                placeholder="e.g. CRM Integration, Zapier, My Script"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </FormField>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Scopes <span className="text-muted-foreground font-normal">(select what this key can access)</span>
              </label>
              <div className="space-y-2">
                {availableScopes.map((scope) => (
                  <label
                    key={scope.key}
                    className="flex items-start gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                      checked={form.scopes.includes(scope.key)}
                      onChange={() => toggleScope(scope.key)}
                    />
                    <span className="text-sm">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono mr-1.5">
                        {scope.key}
                      </code>
                      <span className="text-muted-foreground">{scope.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <FormField
              label="Expiration"
              description="Leave blank for no expiration"
            >
              <Input
                type="number"
                placeholder="Days until expiry (optional)"
                min="1"
                max="365"
                value={form.expires_in_days}
                onChange={(e) => setForm((prev) => ({ ...prev, expires_in_days: e.target.value }))}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.name.trim() || form.scopes.length === 0 || createMutation.isPending}
              onClick={() => createMutation.mutate(form)}
            >
              {createMutation.isPending ? 'Creating…' : 'Create Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirm Dialog */}
      <Dialog open={!!revokeConfirmId} onOpenChange={(open) => !open && setRevokeConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke API Key?</DialogTitle>
            <DialogDescription>
              This will immediately invalidate the key. Any integrations using it will stop working. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={revokeMutation.isPending}
              onClick={() => revokeConfirmId && revokeMutation.mutate(revokeConfirmId)}
            >
              {revokeMutation.isPending ? 'Revoking…' : 'Revoke Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
