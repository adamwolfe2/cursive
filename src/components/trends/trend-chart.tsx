'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface TrendChartProps {
  data: Array<{
    week_start: string
    volume: number
    change_percent: number
  }>
  topicName: string
}

export function TrendChart({ data, topicName }: TrendChartProps) {
  // Format data for chart
  const chartData = data.map((trend) => ({
    week: new Date(trend.week_start).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    volume: trend.volume,
    change: trend.change_percent,
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        No trend data available
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="week"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `${value.toLocaleString()}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {payload[0].payload.week}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Volume:{' '}
                      <span className="font-semibold">
                        {payload[0].value?.toLocaleString()}
                      </span>
                    </p>
                    {payload[0].payload.change !== undefined && (
                      <p className="text-sm text-gray-600">
                        Change:{' '}
                        <span
                          className={`font-semibold ${
                            payload[0].payload.change > 0
                              ? 'text-green-600'
                              : payload[0].payload.change < 0
                                ? 'text-red-600'
                                : 'text-gray-600'
                          }`}
                        >
                          {payload[0].payload.change > 0 ? '+' : ''}
                          {payload[0].payload.change.toFixed(1)}%
                        </span>
                      </p>
                    )}
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="volume"
            stroke="#007aff"
            strokeWidth={2}
            dot={{ fill: '#007aff', r: 4 }}
            activeDot={{ r: 6 }}
            name="Search Volume"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
