'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface CategoryBreakdown {
  category: string
  credits: number
  count: number
}

interface DailyBreakdown {
  date: string
  credits: number
}

interface TopPurchase {
  id: string
  description: string
  credits: number
  created_at: string
}

interface BreakdownResponse {
  by_category: CategoryBreakdown[]
  daily: DailyBreakdown[]
  top_purchases: TopPurchase[]
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function CreditUsage() {
  const { data, isLoading, isError } = useQuery<BreakdownResponse>({
    queryKey: ['credit-breakdown'],
    queryFn: async () => {
      const res = await fetch('/api/billing/credit-breakdown')
      if (!res.ok) throw new Error('Failed to load credit breakdown')
      return res.json()
    },
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-muted-foreground">Failed to load credit usage breakdown. Please refresh.</p>
      </div>
    )
  }

  const { by_category, daily, top_purchases } = data

  // Compute max for bar chart scaling
  const maxDailyCredits = Math.max(...daily.map((d) => d.credits), 1)
  const totalCategoryCredits = by_category.reduce((sum, c) => sum + c.credits, 0)

  return (
    <div className="space-y-6">
      {/* By Category */}
      <Card>
        <CardHeader>
          <CardTitle>Credits by Feature</CardTitle>
        </CardHeader>
        <CardContent>
          {by_category.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No credit usage in the last 30 days.
            </p>
          ) : (
            <div className="space-y-3">
              {by_category.map((cat) => {
                const pct = totalCategoryCredits > 0 ? (cat.credits / totalCategoryCredits) * 100 : 0
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium text-foreground">{cat.category}</span>
                      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                        <span>{cat.count} transaction{cat.count !== 1 ? 's' : ''}</span>
                        <span className="font-semibold text-foreground">{cat.credits.toLocaleString()} credits</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Bar Chart — last 30 days */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Credit Usage (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {daily.every((d) => d.credits === 0) ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No credit activity in the last 30 days.</p>
          ) : (
            <div className="flex items-end gap-0.5 h-32 w-full overflow-hidden">
              {daily.map((d) => {
                const heightPct = maxDailyCredits > 0 ? (d.credits / maxDailyCredits) * 100 : 0
                const isToday = d.date === new Date().toISOString().split('T')[0]
                return (
                  <div
                    key={d.date}
                    className="group relative flex-1 flex flex-col items-center justify-end"
                    title={`${formatDate(d.date)}: ${d.credits} credits`}
                  >
                    <div
                      className={`w-full rounded-t transition-all ${
                        isToday ? 'bg-primary' : d.credits > 0 ? 'bg-primary/60' : 'bg-muted'
                      }`}
                      style={{ height: `${Math.max(heightPct, d.credits > 0 ? 4 : 2)}%` }}
                    />
                    {/* Tooltip on hover */}
                    {d.credits > 0 && (
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                        <div className="bg-zinc-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                          {formatDate(d.date)}: {d.credits}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
            <span>{daily.length > 0 ? formatDate(daily[0].date) : ''}</span>
            <span>{daily.length > 0 ? formatDate(daily[daily.length - 1].date) : ''}</span>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Biggest Expenditures */}
      <Card>
        <CardHeader>
          <CardTitle>Top Expenditures (All Time)</CardTitle>
        </CardHeader>
        <CardContent>
          {top_purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No purchases yet.</p>
          ) : (
            <div className="space-y-2">
              {top_purchases.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/40 text-[13px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{p.description}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDateTime(p.created_at)}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-foreground">
                    {p.credits.toLocaleString()} credits
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
