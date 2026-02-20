/**
 * Name Normalization Unit Tests
 *
 * Tests sanitizeName() and isLeadWorthy() from
 * src/lib/audiencelab/field-map.ts, where JUNK_NAME_RE is defined.
 *
 * JUNK_NAME_RE pattern rejects:
 *   - Single alphanumeric characters
 *   - Strings that are all digits
 *   - Known placeholder values (case-insensitive):
 *       test, admin, user, unknown, n/a, na, null, undefined,
 *       none, anonymous, noreply, info, contact, lead, id
 *
 * sanitizeName() additionally rejects:
 *   - null / undefined / empty / whitespace-only input
 *   - strings shorter than 2 chars after trim
 */

import { describe, it, expect } from 'vitest'
import { sanitizeName, isLeadWorthy, LEAD_CREATION_SCORE_THRESHOLD } from '@/lib/audiencelab/field-map'

// ---------------------------------------------------------------------------
// sanitizeName — junk values rejected
// ---------------------------------------------------------------------------

describe('sanitizeName — known junk names are rejected', () => {
  const junkNames = [
    'user', 'admin', 'test', 'unknown', 'anonymous',
    'n/a', 'na', 'null', 'undefined', 'none',
    'noreply', 'info', 'contact', 'lead', 'id',
  ]

  for (const name of junkNames) {
    it(`rejects lowercase junk name "${name}"`, () => {
      expect(sanitizeName(name)).toBeNull()
    })
  }

  it('rejects "USER" (uppercase)', () => {
    expect(sanitizeName('USER')).toBeNull()
  })

  it('rejects "Admin" (mixed case)', () => {
    expect(sanitizeName('Admin')).toBeNull()
  })

  it('rejects "TEST" (uppercase)', () => {
    expect(sanitizeName('TEST')).toBeNull()
  })

  it('rejects "Unknown" (title case)', () => {
    expect(sanitizeName('Unknown')).toBeNull()
  })

  it('rejects "ANONYMOUS"', () => {
    expect(sanitizeName('ANONYMOUS')).toBeNull()
  })

  it('rejects single letter "a"', () => {
    expect(sanitizeName('a')).toBeNull()
  })

  it('rejects single digit "5"', () => {
    expect(sanitizeName('5')).toBeNull()
  })

  it('rejects pure digit strings like "12345"', () => {
    expect(sanitizeName('12345')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// sanitizeName — null / empty / whitespace inputs
// ---------------------------------------------------------------------------

describe('sanitizeName — null, empty, and whitespace inputs', () => {
  it('returns null for null input', () => {
    expect(sanitizeName(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(sanitizeName(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(sanitizeName('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(sanitizeName('   ')).toBeNull()
  })

  it('returns null for a single-character name after trimming', () => {
    expect(sanitizeName(' J ')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// sanitizeName — real names accepted
// ---------------------------------------------------------------------------

describe('sanitizeName — real names are accepted', () => {
  const realNames = ['John', 'Jane', 'Michael', 'Sarah', 'Li', 'Bo']

  for (const name of realNames) {
    it(`accepts "${name}"`, () => {
      expect(sanitizeName(name)).toBe(name)
    })
  }

  it('trims surrounding whitespace and returns the cleaned name', () => {
    expect(sanitizeName('  Alice  ')).toBe('Alice')
  })

  it('accepts hyphenated names like "Mary-Jane"', () => {
    expect(sanitizeName('Mary-Jane')).toBe('Mary-Jane')
  })

  it('accepts two-character names (minimum valid length)', () => {
    expect(sanitizeName('Jo')).toBe('Jo')
  })

  it('accepts names with accented characters', () => {
    expect(sanitizeName('José')).toBe('José')
  })
})

// ---------------------------------------------------------------------------
// sanitizeName — compound junk patterns
// ---------------------------------------------------------------------------

describe('sanitizeName — compound/combined junk patterns', () => {
  // "test user" does NOT match JUNK_NAME_RE (pattern anchors with ^ and $,
  // so multi-word strings with spaces are NOT caught by it).
  // The function returns the trimmed string for these inputs.
  it('does NOT reject "test user" (multi-word, JUNK_NAME_RE requires exact match)', () => {
    // "test user" passes sanitizeName since it has spaces and doesn't
    // match the anchored single-word junk pattern.
    const result = sanitizeName('test user')
    expect(result).toBe('test user')
  })

  it('does NOT reject "admin123" (alphanumeric suffix breaks the regex match)', () => {
    const result = sanitizeName('admin123')
    // "admin123" is not in the junk list — the regex matches "admin" only
    expect(result).toBe('admin123')
  })
})

// ---------------------------------------------------------------------------
// isLeadWorthy
// ---------------------------------------------------------------------------

describe('isLeadWorthy', () => {
  const VALID_PARAMS = {
    eventType: 'identify',
    deliverabilityScore: 70,
    hasVerifiedEmail: true,
    hasBusinessEmail: true,
    hasPhone: true,
    hasName: true,
    hasCompany: true,
  }

  it('returns true when all quality signals are present', () => {
    expect(isLeadWorthy(VALID_PARAMS)).toBe(true)
  })

  it('returns false when hasVerifiedEmail is false', () => {
    expect(isLeadWorthy({ ...VALID_PARAMS, hasVerifiedEmail: false })).toBe(false)
  })

  it('returns false when hasName is false', () => {
    expect(isLeadWorthy({ ...VALID_PARAMS, hasName: false })).toBe(false)
  })

  it('returns false when hasName is undefined (defaults to false)', () => {
    const { hasName, ...rest } = VALID_PARAMS
    expect(isLeadWorthy(rest)).toBe(false)
  })

  it('returns false when deliverabilityScore is below threshold', () => {
    expect(
      isLeadWorthy({ ...VALID_PARAMS, deliverabilityScore: LEAD_CREATION_SCORE_THRESHOLD - 1 })
    ).toBe(false)
  })

  it('returns true when deliverabilityScore equals the threshold exactly', () => {
    expect(
      isLeadWorthy({ ...VALID_PARAMS, deliverabilityScore: LEAD_CREATION_SCORE_THRESHOLD })
    ).toBe(true)
  })

  it('returns false when deliverabilityScore is 0', () => {
    expect(isLeadWorthy({ ...VALID_PARAMS, deliverabilityScore: 0 })).toBe(false)
  })

  it('LEAD_CREATION_SCORE_THRESHOLD constant is 60', () => {
    expect(LEAD_CREATION_SCORE_THRESHOLD).toBe(60)
  })

  it('phone and company are not required — lead still passes without them', () => {
    expect(
      isLeadWorthy({
        ...VALID_PARAMS,
        hasPhone: false,
        hasBusinessEmail: false,
        hasCompany: false,
      })
    ).toBe(true)
  })
})
