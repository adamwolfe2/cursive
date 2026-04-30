'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { AutoresearchResult } from '@/types/autoresearch'

interface Props {
  results: AutoresearchResult[]
  winnerVariantId: string | null
  variantNames?: Record<string, string>
}

const COLORS = {
  positive_reply_rate: '#22c55e',
  total_reply_rate: '#3b82f6',
  open_rate: '#a855f7',
}

const WINNER_COLORS = {
  positive_reply_rate: '#16a34a',
  total_reply_rate: '#2563eb',
  open_rate: '#9333ea',
}

export default function VariantComparisonChart({ results, winnerVariantId, variantNames = {} }: Props) {
  if (results.length === 0) {
    return null
  }

  const chartData = results.map((r) => ({
    name: variantNames[r.variant_id] ?? r.variant_id.slice(0, 8),
    'Positive Reply Rate': Number((r.positive_reply_rate * 100).toFixed(2)),
    'Total Reply Rate': Number((r.total_reply_rate * 100).toFixed(2)),
    'Open Rate': Number((r.open_rate * 100).toFixed(2)),
    isWinner: r.variant_id === winnerVariantId,
    variantId: r.variant_id,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Variant Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value) => `${value ?? 0}%`}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Positive Reply Rate" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.variantId}
                  fill={entry.isWinner ? WINNER_COLORS.positive_reply_rate : COLORS.positive_reply_rate}
                  strokeWidth={entry.isWinner ? 2 : 0}
                  stroke={entry.isWinner ? '#15803d' : 'none'}
                />
              ))}
            </Bar>
            <Bar dataKey="Total Reply Rate" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.variantId}
                  fill={entry.isWinner ? WINNER_COLORS.total_reply_rate : COLORS.total_reply_rate}
                />
              ))}
            </Bar>
            <Bar dataKey="Open Rate" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.variantId}
                  fill={entry.isWinner ? WINNER_COLORS.open_rate : COLORS.open_rate}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
