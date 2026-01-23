'use client'

import * as React from 'react'
import { cn, formatNumber, formatPercentage } from '@/lib/design-system'
import { Card } from './card'

export interface StatCardProps {
  label: string
  value: number | string
  previousValue?: number
  format?: 'number' | 'currency' | 'percentage' | 'none'
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  description?: string
  className?: string
}

export function StatCard({
  label,
  value,
  previousValue,
  format = 'number',
  icon,
  trend,
  trendValue,
  description,
  className,
}: StatCardProps) {
  const formattedValue = React.useMemo(() => {
    if (typeof value === 'string') return value
    switch (format) {
      case 'number':
        return formatNumber(value)
      case 'currency':
        return `$${formatNumber(value)}`
      case 'percentage':
        return formatPercentage(value)
      default:
        return value
    }
  }, [value, format])

  const calculatedTrend = React.useMemo(() => {
    if (trend) return trend
    if (previousValue !== undefined && typeof value === 'number') {
      if (value > previousValue) return 'up'
      if (value < previousValue) return 'down'
    }
    return 'neutral'
  }, [trend, previousValue, value])

  const calculatedTrendValue = React.useMemo(() => {
    if (trendValue !== undefined) return trendValue
    if (previousValue !== undefined && typeof value === 'number' && previousValue !== 0) {
      return ((value - previousValue) / previousValue) * 100
    }
    return undefined
  }, [trendValue, previousValue, value])

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formattedValue}
          </p>
          {calculatedTrendValue !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {calculatedTrend === 'up' && (
                <svg
                  className="h-4 w-4 text-success"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {calculatedTrend === 'down' && (
                <svg
                  className="h-4 w-4 text-destructive"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  calculatedTrend === 'up' && 'text-success',
                  calculatedTrend === 'down' && 'text-destructive',
                  calculatedTrend === 'neutral' && 'text-muted-foreground'
                )}
              >
                {formatPercentage(Math.abs(calculatedTrendValue))}
              </span>
              {description && (
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
