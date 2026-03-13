'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/lib/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Credit package options for the auto-recharge dropdown (matches CREDIT_PACKAGES)
const AUTO_RECHARGE_PACKAGES = [
  { id: 'starter', label: 'Starter — 100 credits ($99)' },
  { id: 'growth', label: 'Growth — 500 credits ($399)' },
  { id: 'scale', label: 'Scale — 1,000 credits ($699)' },
  { id: 'enterprise', label: 'Enterprise — 5,000 credits ($2,999)' },
]

interface AutoRechargeSettings {
  enabled: boolean
  threshold: number
  recharge_amount: string
}

export function AutoRechargeCard() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [arEnabled, setArEnabled] = useState(false)
  const [arThreshold, setArThreshold] = useState(10)
  const [arPackage, setArPackage] = useState('starter')

  // Fetch auto-recharge settings
  const { data: autoRechargeData } = useQuery<{ data: AutoRechargeSettings }>({
    queryKey: ['auto-recharge-settings'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/credits/auto-recharge')
      if (!response.ok) return { data: { enabled: false, threshold: 10, recharge_amount: 'starter' } }
      return response.json()
    },
  })

  // Sync fetched auto-recharge settings into local state
  useEffect(() => {
    if (autoRechargeData?.data) {
      setArEnabled(autoRechargeData.data.enabled)
      setArThreshold(autoRechargeData.data.threshold)
      setArPackage(autoRechargeData.data.recharge_amount)
    }
  }, [autoRechargeData])

  const saveAutoRechargeMutation = useMutation({
    mutationFn: async (settings: AutoRechargeSettings) => {
      const response = await fetch('/api/marketplace/credits/auto-recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save auto-recharge settings')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-recharge-settings'] })
      toast.success('Auto-recharge settings saved')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save auto-recharge settings')
    },
  })

  const handleSaveAutoRecharge = () => {
    saveAutoRechargeMutation.mutate({
      enabled: arEnabled,
      threshold: arThreshold,
      recharge_amount: arPackage,
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Auto-Recharge</CardTitle>
          <Badge variant="outline" className="text-xs">Never run out</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Automatically top up your credits when your balance falls below a threshold so enrichments never get interrupted.
        </p>

        {/* Enable / disable toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Enable auto-recharge</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically purchase credits when your balance drops below the threshold
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={arEnabled}
            onClick={() => setArEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              arEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                arEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Threshold and package inputs — only shown when enabled */}
        {arEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Threshold input */}
            <div className="space-y-1.5">
              <label
                htmlFor="ar-threshold"
                className="text-sm font-medium text-foreground"
              >
                Recharge when balance falls below
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="ar-threshold"
                  type="number"
                  min={1}
                  max={500}
                  value={arThreshold}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (!isNaN(val) && val >= 1 && val <= 500) {
                      setArThreshold(val)
                    }
                  }}
                  className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
              <p className="text-xs text-muted-foreground">Between 1 and 500</p>
            </div>

            {/* Package selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="ar-package"
                className="text-sm font-medium text-foreground"
              >
                Recharge amount
              </label>
              <select
                id="ar-package"
                value={arPackage}
                onChange={(e) => setArPackage(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {AUTO_RECHARGE_PACKAGES.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Payment method notice */}
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <svg
            className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <p className="text-xs text-muted-foreground">
            Requires a saved payment method. Auto-recharge will charge your card on file. If the charge fails, auto-recharge is automatically disabled.
          </p>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveAutoRecharge}
            disabled={saveAutoRechargeMutation.isPending}
            className="min-w-[100px]"
          >
            {saveAutoRechargeMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
