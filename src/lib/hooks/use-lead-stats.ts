import { useQuery } from '@tanstack/react-query'
import { FileText, UserCheck, CheckCircle2, Flame } from 'lucide-react'

interface LeadStatsResponse {
  stats: {
    totalLeads: number
    totalLeadsChange: number
    totalLeadsChangeValue: number
    contactedLeads: number
    contactedLeadsChange: number
    contactedLeadsChangeValue: number
    qualifiedLeads: number
    qualifiedLeadsChange: number
    qualifiedLeadsChangeValue: number
    hotLeads: number
    hotLeadsChange: number
    hotLeadsChangeValue: number
  }
  statusBreakdown: Record<string, number>
  chartData: Array<{
    label: string
    value: number
    fullDate: string
  }>
}

export function useLeadStats() {
  return useQuery({
    queryKey: ['lead-stats'],
    queryFn: async () => {
      const response = await fetch('/api/crm/leads/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch lead statistics')
      }
      return response.json() as Promise<LeadStatsResponse>
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  })
}

export function useLeadStatsCards() {
  const { data, isLoading, error } = useLeadStats()

  const statsCards = data
    ? [
        {
          title: 'Total Leads This Month',
          value: data.stats.totalLeads,
          change: data.stats.totalLeadsChange,
          changeValue: data.stats.totalLeadsChangeValue,
          icon: FileText,
          trend: (data.stats.totalLeadsChange > 0
            ? 'up'
            : data.stats.totalLeadsChange < 0
            ? 'down'
            : 'neutral') as 'up' | 'down' | 'neutral',
        },
        {
          title: 'Contacted Leads',
          value: data.stats.contactedLeads,
          change: data.stats.contactedLeadsChange,
          changeValue: data.stats.contactedLeadsChangeValue,
          icon: UserCheck,
          trend: (data.stats.contactedLeadsChange > 0
            ? 'up'
            : data.stats.contactedLeadsChange < 0
            ? 'down'
            : 'neutral') as 'up' | 'down' | 'neutral',
        },
        {
          title: 'Qualified Leads',
          value: data.stats.qualifiedLeads,
          change: data.stats.qualifiedLeadsChange,
          changeValue: data.stats.qualifiedLeadsChangeValue,
          icon: CheckCircle2,
          trend: (data.stats.qualifiedLeadsChange > 0
            ? 'up'
            : data.stats.qualifiedLeadsChange < 0
            ? 'down'
            : 'neutral') as 'up' | 'down' | 'neutral',
        },
        {
          title: 'Hot Leads',
          value: data.stats.hotLeads,
          change: data.stats.hotLeadsChange,
          changeValue: data.stats.hotLeadsChangeValue,
          icon: Flame,
          trend: (data.stats.hotLeadsChange > 0
            ? 'up'
            : data.stats.hotLeadsChange < 0
            ? 'down'
            : 'neutral') as 'up' | 'down' | 'neutral',
        },
      ]
    : []

  return { statsCards, isLoading, error }
}

export function useLeadStatusBreakdown() {
  const { data, isLoading, error } = useLeadStats()

  // Define status colors matching your existing design
  const statusColors: Record<string, string> = {
    new: '#007aff', // cursive blue
    contacted: '#8b5cf6', // violet-500
    qualified: '#10b981', // emerald-500
    negotiation: '#f59e0b', // amber-500
    hot: '#ef4444', // red-500
    inactive: '#6b7280', // gray-500
    recycled: '#ec4899', // pink-500
  }

  const statusData = data
    ? Object.entries(data.statusBreakdown).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: value as number,
        color: statusColors[name] || '#007aff',
      }))
    : []

  return { statusData, isLoading, error }
}

export function useLeadGrowthData() {
  const { data, isLoading, error } = useLeadStats()

  const chartData = data?.chartData || []

  return { chartData, isLoading, error }
}
