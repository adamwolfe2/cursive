'use client'

import { ShoppingCart, DollarSign, Package, TrendingUp } from 'lucide-react'
import { LeadStatsCards } from './lead-stats-cards'
import { useQuery } from '@tanstack/react-query'

interface MarketplaceStatsResponse {
  availableLeads: number
  credits: number
  totalPurchased: number
  totalSpent: number
  averagePrice: number
  recentPurchases: number
}

export function MarketplaceStatsCards() {
  const { data, isLoading, error: _error } = useQuery({
    queryKey: ['marketplace-stats'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch marketplace statistics')
      }
      return response.json() as Promise<MarketplaceStatsResponse>
    },
    refetchInterval: 60000, // Refetch every minute
  })

  const statsCards = data
    ? [
        {
          title: 'Available Leads',
          value: data.availableLeads.toLocaleString(),
          icon: Package,
          trend: 'neutral' as const,
        },
        {
          title: 'Credit Balance',
          value: `$${data.credits.toFixed(2)}`,
          icon: DollarSign,
          trend: 'neutral' as const,
        },
        {
          title: 'Total Purchased',
          value: data.totalPurchased.toLocaleString(),
          icon: ShoppingCart,
          trend: 'neutral' as const,
        },
        {
          title: 'Total Spent',
          value: `$${data.totalSpent.toFixed(2)}`,
          icon: TrendingUp,
          trend: 'neutral' as const,
        },
      ]
    : []

  return <LeadStatsCards stats={statsCards} isLoading={isLoading} />
}
