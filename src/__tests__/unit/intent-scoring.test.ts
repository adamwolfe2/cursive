/**
 * URL intent scoring + DNC flag parsing unit tests.
 * Tests the real production module in src/lib/audiencelab/intent-scoring.ts.
 */

import { describe, it, expect } from 'vitest'
import { scoreUrlIntent, parseDncFlag } from '@/lib/audiencelab/intent-scoring'

describe('scoreUrlIntent', () => {
  describe('high-intent URL patterns', () => {
    it('scores a checkout page at 95 (strongest buy signal)', () => {
      expect(scoreUrlIntent('https://example.com/checkout')).toEqual({
        score: 95,
        signal: 'Purchase intent',
      })
    })

    it('scores a pricing page at 90', () => {
      expect(scoreUrlIntent('https://example.com/pricing')).toEqual({
        score: 90,
        signal: 'Viewed pricing',
      })
    })

    it('scores a request-demo page at 88 (matched before the generic /demo/ pattern)', () => {
      expect(scoreUrlIntent('https://example.com/request-demo')).toEqual({
        score: 88,
        signal: 'Requested demo',
      })
    })

    it('scores a generic /demo/ page at 82', () => {
      expect(scoreUrlIntent('https://example.com/demo/product-tour')).toEqual({
        score: 82,
        signal: 'Demo interest',
      })
    })

    it('scores a contact-us page at 85', () => {
      expect(scoreUrlIntent('https://example.com/contact-us')).toEqual({
        score: 85,
        signal: 'Contact intent',
      })
    })

    it('scores a sign-up page at 92', () => {
      expect(scoreUrlIntent('https://example.com/sign-up')).toEqual({
        score: 92,
        signal: 'Trial signup',
      })
    })

    it('ignores query params, only the pathname is scored', () => {
      expect(scoreUrlIntent('https://example.com/pricing?utm_source=ads&plan=pro')).toEqual({
        score: 90,
        signal: 'Viewed pricing',
      })
    })
  })

  describe('homepage / unknown page default', () => {
    it('defaults to score 50 with no signal for the bare homepage', () => {
      expect(scoreUrlIntent('https://example.com/')).toEqual({ score: 50, signal: null })
    })

    it('defaults to score 50 for a homepage URL with no trailing slash', () => {
      expect(scoreUrlIntent('https://example.com')).toEqual({ score: 50, signal: null })
    })

    it('defaults to score 50 for a page that matches no known pattern', () => {
      expect(scoreUrlIntent('https://example.com/random-unmapped-page')).toEqual({ score: 50, signal: null })
    })
  })

  describe('null/empty input', () => {
    it('defaults to score 50 for null', () => {
      expect(scoreUrlIntent(null)).toEqual({ score: 50, signal: null })
    })

    it('defaults to score 50 for undefined', () => {
      expect(scoreUrlIntent(undefined)).toEqual({ score: 50, signal: null })
    })

    it('defaults to score 50 for an empty string', () => {
      expect(scoreUrlIntent('')).toEqual({ score: 50, signal: null })
    })
  })

  describe('malformed / garbage URL fallback', () => {
    it('falls back to raw-string pattern matching when URL parsing fails', () => {
      // "not a url" fails `new URL()`, so the catch block tests the raw
      // string itself against every pattern. This string contains
      // "/checkout" as a substring, so it should still match.
      expect(scoreUrlIntent('not a url but has /checkout in it')).toEqual({
        score: 95,
        signal: 'Purchase intent',
      })
    })

    it('defaults to score 50 for a garbage string that matches no pattern even in raw-string fallback', () => {
      expect(scoreUrlIntent('totally-unparseable-garbage-!!!')).toEqual({ score: 50, signal: null })
    })
  })
})

describe('parseDncFlag', () => {
  describe('boolean input', () => {
    it('returns true for boolean true', () => {
      expect(parseDncFlag(true)).toBe(true)
    })

    it('returns false for boolean false', () => {
      expect(parseDncFlag(false)).toBe(false)
    })
  })

  describe('string input', () => {
    it('returns true for the string "true"', () => {
      expect(parseDncFlag('true')).toBe(true)
    })

    it('is case-insensitive ("TRUE" also parses to true)', () => {
      expect(parseDncFlag('TRUE')).toBe(true)
    })

    it('returns false for the string "false"', () => {
      expect(parseDncFlag('false')).toBe(false)
    })

    // Only the literal string "true" (any case) is treated as truthy per
    // the module's own docstring ("AL may return 'true'/'false' strings or
    // boolean values"). Numeric/word variants are NOT coerced to true —
    // documenting actual behavior, not assuming it.
    it('returns false for "1" (not coerced to true)', () => {
      expect(parseDncFlag('1')).toBe(false)
    })

    it('returns false for "yes" (not coerced to true)', () => {
      expect(parseDncFlag('yes')).toBe(false)
    })

    it('returns false for an empty string', () => {
      expect(parseDncFlag('')).toBe(false)
    })
  })

  describe('nullish input', () => {
    it('returns false for null', () => {
      expect(parseDncFlag(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(parseDncFlag(undefined)).toBe(false)
    })
  })
})
