'use client'

/**
 * Credit Balance Widget
 * Shows current credit balance with purchase button
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Plus, Loader2, TrendingDown } from 'lucide-react'
import { PurchaseCreditsModal } from './purchase-credits-modal'

interface CreditBalanceWidgetProps {
  compact?: boolean
  showPurchaseButton?: boolean
}

export function CreditBalanceWidget({
  compact = false,
  showPurchaseButton = true,
}: CreditBalanceWidgetProps) {
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'workspace-stats'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/workspace-stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const balance = data?.stats?.credits_balance || 0
  const spent30d = data?.stats?.credits_spent_30d || 0

  if (isLoading) {
    return (
      <Card className={compact ? 'p-2' : ''}>
        <CardContent className={compact ? 'p-2' : 'pt-6'}>
          <Loader2 className="h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{balance.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">credits</span>
          </div>
          {showPurchaseButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPurchaseModalOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>

        {showPurchaseButton && (
          <PurchaseCreditsModal
            open={purchaseModalOpen}
            onOpenChange={setPurchaseModalOpen}
            currentBalance={balance}
          />
        )}
      </>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Credit Balance
                </span>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold">{balance.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground ml-2">credits</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <TrendingDown className="h-3 w-3" />
                <span>{spent30d.toLocaleString()} used in last 30 days</span>
              </div>
            </div>

            {showPurchaseButton && (
              <Button onClick={() => setPurchaseModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Purchase Credits
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showPurchaseButton && (
        <PurchaseCreditsModal
          open={purchaseModalOpen}
          onOpenChange={setPurchaseModalOpen}
          currentBalance={balance}
        />
      )}
    </>
  )
}
