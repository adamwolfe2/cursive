/**
 * Design System Tests
 * OpenInfo Platform
 *
 * Tests for design system utilities and helpers.
 * Note: Some helpers are in @/lib/utils (cn with tailwind-merge),
 * others are in @/lib/design-system.
 */

import { describe, it, expect } from 'vitest'
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  getInitials,
  getStatusClasses,
  getIntentClasses,
  getPlanClasses,
  statusColors,
  intentColors,
  planColors,
} from '@/lib/design-system'
import { cn } from '@/lib/utils'

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
    expect(formatCurrency(1000)).toBe('$1,000')
  })

  it('formats cents correctly', () => {
    expect(formatCurrency(99.99)).toBe('$99.99')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })
})

describe('formatPercentage', () => {
  // Note: formatPercentage takes the raw percentage value (not 0-1)
  // and adds the % symbol with specified decimal places
  it('formats percentage with default decimals', () => {
    expect(formatPercentage(50)).toBe('50.0%')
  })

  it('formats with custom decimals', () => {
    expect(formatPercentage(55.55, 2)).toBe('55.55%')
  })

  it('handles zero', () => {
    expect(formatPercentage(0)).toBe('0.0%')
  })

  it('handles 100%', () => {
    expect(formatPercentage(100)).toBe('100.0%')
  })
})

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns single initial for single name', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('handles multiple names (takes first two initials)', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })

  it('handles empty string', () => {
    expect(getInitials('')).toBe('')
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

describe('getStatusClasses', () => {
  it('returns correct classes for active status', () => {
    const result = getStatusClasses('active')
    expect(result).toEqual(statusColors.active)
    expect(result.bg).toBe('bg-success-muted')
    expect(result.text).toBe('text-success')
  })

  it('returns correct classes for pending status', () => {
    const result = getStatusClasses('pending')
    expect(result).toEqual(statusColors.pending)
    expect(result.bg).toBe('bg-info-muted')
    expect(result.text).toBe('text-info')
  })

  it('returns correct classes for error status', () => {
    const result = getStatusClasses('error')
    expect(result).toEqual(statusColors.error)
    expect(result.bg).toBe('bg-destructive-muted')
    expect(result.text).toBe('text-destructive')
  })

  it('returns correct classes for paused status', () => {
    const result = getStatusClasses('paused')
    expect(result).toEqual(statusColors.paused)
    expect(result.bg).toBe('bg-warning-muted')
    expect(result.text).toBe('text-warning')
  })

  it('returns correct classes for inactive status', () => {
    const result = getStatusClasses('inactive')
    expect(result).toEqual(statusColors.inactive)
    expect(result.bg).toBe('bg-muted')
    expect(result.text).toBe('text-muted-foreground')
  })
})

describe('getIntentClasses', () => {
  it('returns correct classes for hot intent', () => {
    const result = getIntentClasses('hot')
    expect(result).toEqual(intentColors.hot)
    expect(result.bg).toBe('bg-destructive-muted')
    expect(result.text).toBe('text-destructive')
  })

  it('returns correct classes for warm intent', () => {
    const result = getIntentClasses('warm')
    expect(result).toEqual(intentColors.warm)
    expect(result.bg).toBe('bg-warning-muted')
    expect(result.text).toBe('text-warning')
  })

  it('returns correct classes for cold intent', () => {
    const result = getIntentClasses('cold')
    expect(result).toEqual(intentColors.cold)
    expect(result.bg).toBe('bg-info-muted')
    expect(result.text).toBe('text-info')
  })
})

describe('getPlanClasses', () => {
  it('returns correct classes for free plan', () => {
    const result = getPlanClasses('free')
    expect(result).toEqual(planColors.free)
    expect(result.bg).toBe('bg-muted')
    expect(result.text).toBe('text-muted-foreground')
  })

  it('returns correct classes for pro plan', () => {
    const result = getPlanClasses('pro')
    expect(result).toEqual(planColors.pro)
    expect(result.bg).toBe('bg-primary-muted')
    expect(result.text).toBe('text-primary')
  })

  it('returns correct classes for enterprise plan', () => {
    const result = getPlanClasses('enterprise')
    expect(result).toEqual(planColors.enterprise)
    expect(result.bg).toBe('bg-primary')
    expect(result.text).toBe('text-primary-foreground')
  })
})
