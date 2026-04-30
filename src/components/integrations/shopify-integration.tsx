'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IntegrationLogo } from '@/app/(dashboard)/settings/integrations/IntegrationLogo'

interface CrmConnectionStatus {
  connected: boolean
  status: string
  shop_domain?: string
  connected_at?: string
  last_sync_at?: string
}

interface ShopifyIntegrationProps {
  workspaceId: string
  isPro: boolean
}

export function ShopifyIntegration({ workspaceId, isPro }: ShopifyIntegrationProps) {
  const queryClient = useQueryClient()
  const [shopInput, setShopInput] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [showShopModal, setShowShopModal] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const { data: connectionData, isLoading } = useQuery({
    queryKey: ['crm', 'connections', 'shopify'],
    queryFn: async () => {
      const response = await fetch('/api/crm/connections/shopify')
      if (!response.ok) throw new Error('Failed to fetch Shopify connection status')
      return response.json()
    },
    enabled: !!workspaceId,
  })

  const connection: CrmConnectionStatus | null = connectionData?.data ?? null
  const isConnected = connection?.connected === true

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/shopify/disconnect', { method: 'POST' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to disconnect Shopify')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'connections', 'shopify'] })
      queryClient.invalidateQueries({ queryKey: ['crm', 'connections'] })
      toast.success('Shopify disconnected successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect Shopify')
    },
  })

  const handleConnect = () => {
    if (!isPro) {
      toast.error('Shopify integration requires a Pro plan. Please upgrade to continue.')
      return
    }
    setShowShopModal(true)
  }

  const handleShopSubmit = () => {
    const raw = shopInput.trim()
    if (!raw) {
      toast.error('Please enter your Shopify store domain')
      return
    }
    // Normalize — accept "mystore", "mystore.myshopify.com"
    const shop = raw.endsWith('.myshopify.com')
      ? raw
      : raw.includes('.')
        ? raw
        : `${raw}.myshopify.com`

    setConnecting(true)
    setShowShopModal(false)
    window.location.href = `/api/integrations/shopify/authorize?shop=${encodeURIComponent(shop)}`
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatSyncTime = (dateString: string | undefined | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <IntegrationLogo name="shopify" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-zinc-900">Shopify</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Sync Cursive-identified visitors to your Shopify customer list and attribute orders
          </p>

          {!isPro && (
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">
                Pro plan required.{' '}
                <Link href="/settings/billing" className="font-medium text-amber-900 underline hover:no-underline">
                  Upgrade now
                </Link>
              </p>
            </div>
          )}

          {isConnected && isPro && (
            <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="ml-2 text-sm font-medium text-emerald-800">
                  Connected to {connection?.shop_domain || 'Shopify'}
                </p>
              </div>
              <p className="mt-1 text-sm text-emerald-700">
                Identified visitors sync automatically to your customer list
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={connecting || !isPro || isLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {connecting ? 'Connecting...' : 'Connect Shopify'}
              </button>
            ) : (
              <button
                onClick={() => setConfirmDisconnect(true)}
                disabled={disconnectMutation.isPending}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
              </button>
            )}
          </div>
        </div>
      </div>

      {isConnected && isPro && (
        <div className="mt-6 pt-6 border-t border-zinc-200">
          <h4 className="text-sm font-medium text-zinc-900 mb-3">Configuration</h4>
          <div className="space-y-3">
            {connection?.shop_domain && (
              <div>
                <span className="text-sm text-zinc-500">Store:</span>
                <p className="text-sm text-zinc-900 font-mono mt-1">{connection.shop_domain}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-zinc-500">Connected:</span>
              <p className="text-sm text-zinc-900 mt-1">
                {formatDate(connection?.connected_at) || 'Unknown'}
              </p>
            </div>
            <div>
              <span className="text-sm text-zinc-500">Last Sync:</span>
              <p className="text-sm text-zinc-900 mt-1">{formatSyncTime(connection?.last_sync_at)}</p>
            </div>
            <div>
              <span className="text-sm text-zinc-500">Features:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Customer Sync', 'Order Attribution', 'Visitor ID Push', 'GDPR Compliant'].map((f) => (
                  <span key={f} className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop domain entry modal */}
      <Dialog open={showShopModal} onOpenChange={setShowShopModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect your Shopify store</DialogTitle>
            <DialogDescription>
              Enter your Shopify store domain to begin the connection.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Store domain
            </label>
            <div className="flex rounded-lg border border-zinc-300 overflow-hidden">
              <input
                type="text"
                placeholder="mystore"
                value={shopInput}
                onChange={(e) => setShopInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleShopSubmit() }}
                className="flex-1 px-3 py-2 text-sm border-0 focus:ring-0 focus:outline-none"
                autoFocus
              />
              <span className="flex items-center px-3 bg-zinc-50 border-l border-zinc-300 text-sm text-zinc-500 select-none">
                .myshopify.com
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Find this in your Shopify admin URL — e.g. <span className="font-mono">mystore</span>.myshopify.com
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShopModal(false)}>Cancel</Button>
            <Button onClick={handleShopSubmit} className="bg-emerald-600 hover:bg-emerald-700">
              Connect Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect confirmation */}
      <Dialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Shopify</DialogTitle>
            <DialogDescription>
              Are you sure? Visitor-to-customer sync will stop and order attribution will pause.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDisconnect(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { disconnectMutation.mutate(); setConfirmDisconnect(false) }}
              disabled={disconnectMutation.isPending}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
