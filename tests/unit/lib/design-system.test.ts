/**
 * Design System Tests
 * OpenInfo Platform
 */

import { describe, it, expect } from 'vitest'
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  getInitials,
  cn,
  getStatusColor,
  getIntentColor,
  getPlanColor,
} from '@/lib/design-system'

describe('formatNumber', () => {
  it('formats numbers with commas', () => {
    expect(formatNumber(1000)).toBe('1,000')
    expect(formatNumber(1000000)).toBe('1,000,000')
  })

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('handles negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1,000')
  })

  it('handles decimals', () => {
    expect(formatNumber(1234.56)).toBe('1,234.56')
  })
})

describe('formatCurrency', () => {
  it('formats as USD by default', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00')
  })

  it('formats cents correctly', () => {
    expect(formatCurrency(99.99)).toBe('$99.99')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })
})

describe('formatPercentage', () => {
  it('formats percentage with default decimals', () => {
    expect(formatPercentage(0.5)).toBe('50%')
  })

  it('formats with custom decimals', () => {
    expect(formatPercentage(0.5555, 2)).toBe('55.55%')
  })

  it('handles zero', () => {
    expect(formatPercentage(0)).toBe('0%')
  })

  it('handles 100%', () => {
    expect(formatPercentage(1)).toBe('100%')
  })
})

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns single initial for single name', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('handles multiple names', () => {
    expect(getInitials('John Michael Doe')).toBe('JD')
  })

  it('handles empty string', () => {
    expect(getInitials('')).toBe('')
  })

  it('handles null/undefined', () => {
    expect(getInitials(null as unknown as string)).toBe('')
    expect(getInitials(undefined as unknown as string)).toBe('')
  })

  it('limits to 2 characters', () => {
    expect(getInitials('John Doe')).toHaveLength(2)
  })
})

describe('cn (class names)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('merges Tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('handles objects', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })
})

describe('getStatusColor', () => {
  it('returns correct color for pending status', () => {
    expect(getStatusColor('pending')).toBe('bg-warning-muted text-warning')
  })

  it('returns correct color for processing status', () => {
    expect(getStatusColor('processing')).toBe('bg-info-muted text-info')
  })

  it('returns correct color for completed status', () => {
    expect(getStatusColor('completed')).toBe('bg-success-muted text-success')
  })

  it('returns correct color for failed status', () => {
    expect(getStatusColor('failed')).toBe('bg-destructive-muted text-destructive')
  })

  it('returns default color for unknown status', () => {
    expect(getStatusColor('unknown' as never)).toBe('bg-muted text-muted-foreground')
  })
})

describe('getIntentColor', () => {
  it('returns high intent color for scores >= 80', () => {
    expect(getIntentColor(80)).toBe('bg-success-muted text-success')
    expect(getIntentColor(100)).toBe('bg-success-muted text-success')
  })

  it('returns medium intent color for scores >= 50', () => {
    expect(getIntentColor(50)).toBe('bg-warning-muted text-warning')
    expect(getIntentColor(79)).toBe('bg-warning-muted text-warning')
  })

  it('returns low intent color for scores < 50', () => {
    expect(getIntentColor(49)).toBe('bg-muted text-muted-foreground')
    expect(getIntentColor(0)).toBe('bg-muted text-muted-foreground')
  })
})

describe('getPlanColor', () => {
  it('returns correct color for free plan', () => {
    expect(getPlanColor('free')).toBe('bg-muted text-muted-foreground')
  })

  it('returns correct color for pro plan', () => {
    expect(getPlanColor('pro')).toBe('bg-primary/10 text-primary')
  })

  it('returns correct color for enterprise plan', () => {
    expect(getPlanColor('enterprise')).toBe('bg-success-muted text-success')
  })

  it('returns default color for unknown plan', () => {
    expect(getPlanColor('unknown' as never)).toBe('bg-muted text-muted-foreground')
  })
})
