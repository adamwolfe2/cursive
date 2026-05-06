/**
 * Cold Email Knowledge Base — V3 doctrine tests.
 *
 * Covers:
 *   - inferAovTier (annualization rule, edge cases)
 *   - getAovTierSpec
 *   - scoreCopy with the new highTrust + knownCaseStudyClients context
 *     (no longer rewards fabricated number patterns).
 */

import { describe, it, expect } from 'vitest'
import {
  inferAovTier,
  getAovTierSpec,
  scoreCopy,
  HIGH_TRUST_BANNED_PHRASES,
  HIGH_TRUST_BANNED_PATTERNS,
} from '../cold-email-knowledge'

describe('inferAovTier', () => {
  it('returns "low" for under $5K', () => {
    expect(inferAovTier({ setupFee: 4999, recurringFee: 0 })).toBe('low')
    expect(inferAovTier({ setupFee: 0, recurringFee: 0 })).toBe('low')
    expect(inferAovTier({ setupFee: null, recurringFee: null })).toBe('low')
  })

  it('returns "mid" for $5K-$15K', () => {
    expect(inferAovTier({ setupFee: 5000 })).toBe('mid')
    expect(inferAovTier({ setupFee: 14999 })).toBe('mid')
  })

  it('returns "high" for $15K-$75K', () => {
    expect(inferAovTier({ setupFee: 15000 })).toBe('high')
    expect(inferAovTier({ setupFee: 35000 })).toBe('high')
    expect(inferAovTier({ setupFee: 74999 })).toBe('high')
  })

  it('returns "enterprise" for $75K+', () => {
    expect(inferAovTier({ setupFee: 75000 })).toBe('enterprise')
    expect(inferAovTier({ setupFee: 250000 })).toBe('enterprise')
  })

  it('annualizes recurring at 6 months', () => {
    // recurring = $2.5K/mo; 6 * 2500 = $15K -> high
    expect(inferAovTier({ setupFee: 0, recurringFee: 2500 })).toBe('high')
    // recurring = $1.5K/mo; 6 * 1500 = $9K -> mid
    expect(inferAovTier({ setupFee: 0, recurringFee: 1500 })).toBe('mid')
  })

  it('takes max of setup vs annualized recurring', () => {
    // setup=$50K wins over recurring=$1K/mo (annualized $6K)
    expect(inferAovTier({ setupFee: 50000, recurringFee: 1000 })).toBe('high')
    // recurring=$15K/mo (annualized $90K) wins over setup=$5K
    expect(inferAovTier({ setupFee: 5000, recurringFee: 15000 })).toBe('enterprise')
  })
})

describe('getAovTierSpec', () => {
  it('returns spec with the expected doctrine for each tier', () => {
    expect(getAovTierSpec('low').doctrine).toBe('volume')
    expect(getAovTierSpec('mid').doctrine).toBe('volume')
    expect(getAovTierSpec('high').doctrine).toBe('precision')
    expect(getAovTierSpec('enterprise').doctrine).toBe('precision')
  })

  it('high/enterprise default spintax to false', () => {
    expect(getAovTierSpec('high').spintax_default).toBe(false)
    expect(getAovTierSpec('enterprise').spintax_default).toBe(false)
  })

  it('low/mid default spintax to true', () => {
    expect(getAovTierSpec('low').spintax_default).toBe(true)
    expect(getAovTierSpec('mid').spintax_default).toBe(true)
  })

  it('high tier defaults to founder_direct voice', () => {
    expect(getAovTierSpec('high').default_voice).toBe('founder_direct')
  })

  it('enterprise defaults to consultant_authoritative voice', () => {
    expect(getAovTierSpec('enterprise').default_voice).toBe('consultant_authoritative')
  })

  it('high/enterprise tiers avoid pain_agitation as email-1 angle', () => {
    expect(getAovTierSpec('high').avoid_angles).toContain('pain_agitation')
    expect(getAovTierSpec('enterprise').avoid_angles).toContain('pain_agitation')
  })
})

describe('scoreCopy — high-trust mode (V3)', () => {
  it('does NOT award social_proof for unverified number patterns in high-trust mode', () => {
    const result = scoreCopy({
      subject: 'launch films',
      body: 'we work with 12 YC companies',
      hasSocialProof: true, // pattern matched but no real proof
      hasSpecificNumbers: true,
      hasOffer: false,
      hasCta: false,
      hasPersonalization: false,
      highTrust: true,
      knownCaseStudyClients: [], // empty -> no proof to verify against
    })
    expect(result.principlesPresent).not.toContain('social_proof')
  })

  it('DOES award social_proof when a known case study client is cited', () => {
    const result = scoreCopy({
      subject: 'launch films',
      body: 'Adaptive launched with one and doubled revenue.',
      hasSocialProof: false,
      hasSpecificNumbers: false,
      hasOffer: false,
      hasCta: false,
      hasPersonalization: false,
      highTrust: true,
      knownCaseStudyClients: ['Adaptive'],
    })
    expect(result.principlesPresent).toContain('social_proof')
  })

  it('does NOT award scarcity in high-trust mode (false-scarcity language is banned)', () => {
    const result = scoreCopy({
      subject: 'last chance',
      body: 'only taking 2 more clients this quarter.',
      hasSocialProof: false,
      hasSpecificNumbers: false,
      hasOffer: false,
      hasCta: false,
      hasPersonalization: false,
      highTrust: true,
    })
    expect(result.principlesPresent).not.toContain('scarcity')
  })

  it('does NOT require "free" or "guarantee" for give_first in high-trust mode', () => {
    // Opening with an observation/insight counts as give_first in high-trust.
    const result = scoreCopy({
      subject: 'noticed your launch',
      body: 'I pulled the launch films of every Series A AI co that raised in Q1.',
      hasSocialProof: false,
      hasSpecificNumbers: false,
      hasOffer: false,
      hasCta: false,
      hasPersonalization: false,
      highTrust: true,
    })
    expect(result.principlesPresent).toContain('give_first')
  })

  it('volume mode unchanged: number patterns + specific numbers grant social_proof', () => {
    const result = scoreCopy({
      subject: 'pipeline',
      body: 'we work with 50 companies and grew their pipeline 3x',
      hasSocialProof: true,
      hasSpecificNumbers: true,
      hasOffer: false,
      hasCta: false,
      hasPersonalization: false,
      highTrust: false,
    })
    expect(result.principlesPresent).toContain('social_proof')
  })
})

describe('HIGH_TRUST_BANNED_PHRASES', () => {
  it('contains the canonical V3 banned list', () => {
    const expectedSubsamples = [
      'founder-to-founder',
      'just wanted to reach out',
      'circling back',
      'looping back',
      'Here\'s why',
      'absurd pricing',
      '2 spots left',
      'this week only',
    ]
    for (const phrase of expectedSubsamples) {
      expect(
        (HIGH_TRUST_BANNED_PHRASES as readonly string[]).some(
          (p) => p.toLowerCase() === phrase.toLowerCase(),
        ),
      ).toBe(true)
    }
  })
})

describe('HIGH_TRUST_BANNED_PATTERNS', () => {
  it('includes a "Here\'s why" sentence-start pattern', () => {
    const pat = HIGH_TRUST_BANNED_PATTERNS.find((p) => p.name === 'starts_with_heres_why')
    expect(pat).toBeDefined()
    expect(pat!.regex.test('Here\'s why this matters.')).toBe(true)
    // Should match when it appears AFTER a sentence too.
    expect(pat!.regex.test('Long preamble. Here\'s why this matters.')).toBe(true)
  })

  it('the "quick question" opener pattern matches at start, not mid-body', () => {
    const pat = HIGH_TRUST_BANNED_PATTERNS.find((p) => p.name === 'starts_with_quick_question_opener')
    expect(pat).toBeDefined()
    // Matches as opener
    expect(pat!.regex.test('quick question, are you free?')).toBe(true)
    expect(pat!.regex.test('quick question.')).toBe(true)
    // Should NOT match mid-body
    expect(pat!.regex.test('I had a quick question for you')).toBe(false)
  })
})
