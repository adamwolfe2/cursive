import { describe, it, expect } from 'vitest'
import {
  isFeatureVisible,
  hasFeatureAllowlist,
  normalizeFeatures,
  FUNNEL_TIER_FEATURES,
  FEATURE_KEYS,
} from './feature-flags'

describe('isFeatureVisible', () => {
  it('shows everything when allowlist is null (backward-compat)', () => {
    expect(isFeatureVisible(null, 'dashboard')).toBe(true)
    expect(isFeatureVisible(null, 'ai-studio')).toBe(true)
  })

  it('shows everything when allowlist is undefined', () => {
    expect(isFeatureVisible(undefined, 'campaigns')).toBe(true)
  })

  it('shows everything when allowlist is an empty array', () => {
    expect(isFeatureVisible([], 'crm')).toBe(true)
  })

  it('shows only listed features when allowlist is populated', () => {
    const allow = FUNNEL_TIER_FEATURES
    expect(isFeatureVisible(allow, 'dashboard')).toBe(true)
    expect(isFeatureVisible(allow, 'leads')).toBe(true)
    expect(isFeatureVisible(allow, 'settings')).toBe(true)
  })

  it('hides features absent from a populated allowlist', () => {
    const allow = FUNNEL_TIER_FEATURES
    expect(isFeatureVisible(allow, 'ai-studio')).toBe(false)
    expect(isFeatureVisible(allow, 'outbound')).toBe(false)
    expect(isFeatureVisible(allow, 'campaigns')).toBe(false)
    expect(isFeatureVisible(allow, 'crm')).toBe(false)
  })
})

describe('hasFeatureAllowlist', () => {
  it('is false for null/undefined/empty', () => {
    expect(hasFeatureAllowlist(null)).toBe(false)
    expect(hasFeatureAllowlist(undefined)).toBe(false)
    expect(hasFeatureAllowlist([])).toBe(false)
  })

  it('is true for a populated allowlist', () => {
    expect(hasFeatureAllowlist(['dashboard'])).toBe(true)
  })
})

describe('normalizeFeatures', () => {
  it('returns [] for non-arrays', () => {
    expect(normalizeFeatures(null)).toEqual([])
    expect(normalizeFeatures('dashboard')).toEqual([])
    expect(normalizeFeatures(undefined)).toEqual([])
  })

  it('drops unknown keys', () => {
    expect(normalizeFeatures(['dashboard', 'bogus', 'leads'])).toEqual([
      'dashboard',
      'leads',
    ])
  })

  it('dedupes repeated keys', () => {
    expect(normalizeFeatures(['leads', 'leads', 'settings'])).toEqual([
      'leads',
      'settings',
    ])
  })

  it('accepts every known feature key', () => {
    expect(normalizeFeatures([...FEATURE_KEYS])).toEqual([...FEATURE_KEYS])
  })
})

describe('FUNNEL_TIER_FEATURES', () => {
  it('is the clean 3-item set', () => {
    expect(FUNNEL_TIER_FEATURES).toEqual(['dashboard', 'leads', 'settings'])
  })

  it('only contains valid feature keys', () => {
    for (const key of FUNNEL_TIER_FEATURES) {
      expect(FEATURE_KEYS).toContain(key)
    }
  })
})
