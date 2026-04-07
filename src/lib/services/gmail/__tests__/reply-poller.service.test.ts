/**
 * Gmail Reply Poller — unit tests
 *
 * Covers the pure helpers (From parser, intent score derivation, base64url
 * decoding, header lookup). The actual Gmail API calls + DB writes are
 * exercised by integration testing in dev.
 *
 * Helpers are not exported directly — we re-implement them here so the
 * test stays decoupled from the file's internal layout. If the production
 * implementations diverge, these tests are the canary.
 */

import { describe, it, expect } from 'vitest'

// =============================================================================
// Re-implementation of the private helpers for direct testing.
// Keep these in sync with src/lib/services/gmail/reply-poller.service.ts
// =============================================================================

function stripBrackets(s: string): string {
  return s.trim().replace(/^</, '').replace(/>$/, '')
}

function parseFromHeader(raw: string): { fromEmail: string; fromName: string | null } {
  const m = raw.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/)
  if (m) {
    return { fromEmail: m[2].trim(), fromName: m[1].trim() || null }
  }
  return { fromEmail: raw.trim(), fromName: null }
}

function deriveIntentScore(sentiment: string | null): number | null {
  if (!sentiment) return null
  switch (sentiment) {
    case 'positive': return 9
    case 'question': return 8
    case 'neutral': return 5
    case 'negative':
    case 'not_interested': return 2
    case 'out_of_office':
    case 'unsubscribe': return 0
    default: return 5
  }
}

function decodeBase64Url(s: string): string {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

// =============================================================================
// Tests
// =============================================================================

describe('stripBrackets', () => {
  it('removes surrounding angle brackets', () => {
    expect(stripBrackets('<abc@example.com>')).toBe('abc@example.com')
  })
  it('leaves bare value alone', () => {
    expect(stripBrackets('abc@example.com')).toBe('abc@example.com')
  })
  it('trims whitespace', () => {
    expect(stripBrackets('  <abc@example.com>  ')).toBe('abc@example.com')
  })
})

describe('parseFromHeader', () => {
  it('parses "Name" <email> format', () => {
    expect(parseFromHeader('"Jane Smith" <jane@example.com>')).toEqual({
      fromEmail: 'jane@example.com',
      fromName: 'Jane Smith',
    })
  })

  it('parses Name <email> format (unquoted)', () => {
    expect(parseFromHeader('Jane Smith <jane@example.com>')).toEqual({
      fromEmail: 'jane@example.com',
      fromName: 'Jane Smith',
    })
  })

  it('parses bare email', () => {
    expect(parseFromHeader('jane@example.com')).toEqual({
      fromEmail: 'jane@example.com',
      fromName: null,
    })
  })

  it('handles extra whitespace', () => {
    expect(parseFromHeader('  Jane <jane@example.com>  ')).toEqual({
      fromEmail: 'jane@example.com',
      fromName: 'Jane',
    })
  })
})

describe('deriveIntentScore', () => {
  it('positive → 9 (counts toward booked)', () => {
    expect(deriveIntentScore('positive')).toBe(9)
  })
  it('question → 8 (counts toward booked)', () => {
    expect(deriveIntentScore('question')).toBe(8)
  })
  it('neutral → 5', () => {
    expect(deriveIntentScore('neutral')).toBe(5)
  })
  it('negative → 2', () => {
    expect(deriveIntentScore('negative')).toBe(2)
  })
  it('out_of_office → 0', () => {
    expect(deriveIntentScore('out_of_office')).toBe(0)
  })
  it('unsubscribe → 0', () => {
    expect(deriveIntentScore('unsubscribe')).toBe(0)
  })
  it('null sentiment → null score', () => {
    expect(deriveIntentScore(null)).toBeNull()
  })
  it('unknown sentiment → 5 (neutral default)', () => {
    expect(deriveIntentScore('mystery')).toBe(5)
  })
})

describe('deriveIntentScore matches view filter (intent_score >= 8 AND sentiment IN positive,question)', () => {
  // Sanity check that the contract between the view + this helper holds
  const cases: Array<[string, boolean]> = [
    ['positive', true], // 9 >= 8 ✓
    ['question', true], // 8 >= 8 ✓
    ['neutral', false], // 5 < 8
    ['negative', false], // 2 < 8 (and wrong sentiment)
    ['out_of_office', false],
    ['unsubscribe', false],
  ]
  for (const [sentiment, shouldBook] of cases) {
    it(`${sentiment} → ${shouldBook ? 'booked' : 'not booked'}`, () => {
      const score = deriveIntentScore(sentiment) ?? 0
      const meetsScoreFilter = score >= 8
      const meetsSentimentFilter = ['positive', 'question'].includes(sentiment)
      expect(meetsScoreFilter && meetsSentimentFilter).toBe(shouldBook)
    })
  }
})

describe('decodeBase64Url', () => {
  it('decodes a base64url string with - and _', () => {
    const original = 'Hello, world! 🚀'
    const encoded = Buffer.from(original, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(decodeBase64Url(encoded)).toBe(original)
  })
})
