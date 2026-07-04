'use client'

import { FileText, UserCheck, CheckCircle2, Flame, TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardData {
  title: string
  value: number | string
  change?: number
  changeValue?: number | string
  icon: typeof FileText
  trend?: 'up' | 'down' | 'neutral'
}

interface LeadStatsCardsProps {
  stats: StatCardData[]
  isLoading?: boolean
}

export function LeadStatsCards({ stats, isLoading = false }: LeadStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100/50 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-x-0 lg:divide-x sm:divide-y-0 divide-blue-100/50">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-4 sm:p-6 space-y-4">
              <div className="shimmer-cursive h-4 w-32 rounded" />
              <div className="shimmer-cursive h-8 w-20 rounded" />
              <div className="shimmer-cursive h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100/50 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-x-0 lg:divide-x sm:divide-y-0 divide-blue-100/50">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          const isPositive = stat.trend === 'up' || (stat.change && stat.change > 0)
          const isNegative = stat.trend === 'down' || (stat.change && stat.change < 0)

          return (
            <div
              key={index}
              className="p-4 sm:p-6 space-y-4 hover:bg-brand-50 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <IconComponent className="size-4 sm:size-[18px] text-blue-600" />
                <span className="text-xs sm:text-sm font-medium">
                  {stat.title}
                </span>
              </div>

              <p className="text-2xl sm:text-[28px] font-semibold tracking-tight text-brand-600">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </p>

              {stat.change !== undefined && (
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className={`font-medium flex items-center gap-1 ${
                    isPositive
                      ? 'text-emerald-600'
                      : isNegative
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {isPositive && <TrendingUp className="size-3" />}
                    {isNegative && <TrendingDown className="size-3" />}
                    {stat.change > 0 ? '+' : ''}{stat.change}%
                    {stat.changeValue && (
                      <span className="ml-1">
                        ({typeof stat.changeValue === 'number'
                          ? stat.changeValue.toLocaleString()
                          : stat.changeValue})
                      </span>
                    )}
                  </span>
                  <span className="size-1 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground hidden sm:inline">
                    vs Last Month
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Default export with example usage
export function DefaultLeadStatsCards() {
  const defaultStats: StatCardData[] = [
    {
      title: 'Total Leads This Month',
      value: 0,
      change: 0,
      changeValue: 0,
      icon: FileText,
      trend: 'neutral',
    },
    {
      title: 'Contacted Leads',
      value: 0,
      change: 0,
      changeValue: 0,
      icon: UserCheck,
      trend: 'neutral',
    },
    {
      title: 'Qualified Leads',
      value: 0,
      change: 0,
      changeValue: 0,
      icon: CheckCircle2,
      trend: 'neutral',
    },
    {
      title: 'Hot Leads',
      value: 0,
      change: 0,
      changeValue: 0,
      icon: Flame,
      trend: 'neutral',
    },
  ]

  return <LeadStatsCards stats={defaultStats} />
}
