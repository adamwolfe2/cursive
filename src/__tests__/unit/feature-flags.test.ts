/**
 * Unit tests for workspace nav feature flag utilities
 */

import { describe, it, expect } from 'vitest'
import {
  isFeatureVisible,
  hasFeatureAllowlist,
  normalizeFeatures,
  FUNNEL_TIER_FEATURES,
  FEATURE_KEYS,
} from '@/lib/workspaces/feature-flags'

describe('isFeatureVisible', () => {
  describe('NULL/undefined allowlist means show-all', () => {
    it('returns true for any key when allowlist is null', () => {
      expect(isFeatureVisible(null, 'dashboard')).toBe(true)
      expect(isFeatureVisible(null, 'anything-unknown')).toBe(true)
    })

    it('returns true for any key when allowlist is undefined', () => {
      expect(isFeatureVisible(undefined, 'dashboard')).toBe(true)
    })
  })

  describe('empty-array vs null distinction', () => {
    it('treats an empty array the same as null: show-all', () => {
      expect(isFeatureVisible([], 'dashboard')).toBe(true)
      expect(isFeatureVisible([], 'crm')).toBe(true)
    })
  })

  describe('populated allowlist is a strict allowlist', () => {
    it('returns true only for keys present in the list', () => {
      const allowlist = ['dashboard', 'leads']
      expect(isFeatureVisible(allowlist, 'dashboard')).toBe(true)
      expect(isFeatureVisible(allowlist, 'leads')).toBe(true)
    })

    it('returns false for keys not present in the list', () => {
      const allowlist = ['dashboard', 'leads']
      expect(isFeatureVisible(allowlist, 'crm')).toBe(false)
      expect(isFeatureVisible(allowlist, 'outbound')).toBe(false)
    })
  })
})

describe('hasFeatureAllowlist', () => {
  it('returns false for null', () => {
    expect(hasFeatureAllowlist(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(hasFeatureAllowlist(undefined)).toBe(false)
  })

  it('returns false for an empty array', () => {
    expect(hasFeatureAllowlist([])).toBe(false)
  })

  it('returns true for a populated array', () => {
    expect(hasFeatureAllowlist(['dashboard'])).toBe(true)
  })
})

describe('normalizeFeatures', () => {
  it('returns an empty array for non-array input', () => {
    expect(normalizeFeatures(null)).toEqual([])
    expect(normalizeFeatures(undefined)).toEqual([])
    expect(normalizeFeatures('dashboard')).toEqual([])
    expect(normalizeFeatures(42)).toEqual([])
    expect(normalizeFeatures({})).toEqual([])
  })

  it('drops unknown keys', () => {
    expect(normalizeFeatures(['dashboard', 'not-a-real-key', 'leads'])).toEqual([
      'dashboard',
      'leads',
    ])
  })

  it('drops non-string items mixed into the array', () => {
    expect(normalizeFeatures(['dashboard', 42, null, {}, 'leads'])).toEqual([
      'dashboard',
      'leads',
    ])
  })

  it('dedupes repeated valid keys, preserving first-seen order', () => {
    expect(normalizeFeatures(['leads', 'dashboard', 'leads', 'dashboard'])).toEqual([
      'leads',
      'dashboard',
    ])
  })

  it('returns an empty array for an empty array', () => {
    expect(normalizeFeatures([])).toEqual([])
  })

  it('accepts every known feature key', () => {
    expect(normalizeFeatures([...FEATURE_KEYS])).toEqual([...FEATURE_KEYS])
  })
})

describe('FUNNEL_TIER_FEATURES as an allowlist', () => {
  it('is a minimal 3-item list', () => {
    expect(FUNNEL_TIER_FEATURES).toEqual(['dashboard', 'leads', 'settings'])
  })

  it('makes only its listed features visible via isFeatureVisible', () => {
    expect(isFeatureVisible(FUNNEL_TIER_FEATURES, 'dashboard')).toBe(true)
    expect(isFeatureVisible(FUNNEL_TIER_FEATURES, 'leads')).toBe(true)
    expect(isFeatureVisible(FUNNEL_TIER_FEATURES, 'settings')).toBe(true)
  })

  it('hides every feature outside the funnel tier list, including admin-heavy ones', () => {
    expect(isFeatureVisible(FUNNEL_TIER_FEATURES, 'crm')).toBe(false)
    expect(isFeatureVisible(FUNNEL_TIER_FEATURES, 'outbound')).toBe(false)
    expect(isFeatureVisible(FUNNEL_TIER_FEATURES, 'ai-agents')).toBe(false)
    expect(isFeatureVisible(FUNNEL_TIER_FEATURES, 'analytics')).toBe(false)
  })

  it('registers as an active allowlist via hasFeatureAllowlist', () => {
    expect(hasFeatureAllowlist(FUNNEL_TIER_FEATURES)).toBe(true)
  })
})
