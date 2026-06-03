/**
 * Copy Quality Check — V3 doctrine tests.
 *
 * Covers the new precision-doctrine checks:
 *   - Per-position word caps (75 / 60 / 40)
 *   - Fabricated claim detector (client counts, "trusted by", revenue figures, named clients)
 *   - High-trust banned phrases (founder-to-founder, false scarcity, "Here's why" starts, etc.)
 *   - CTA ladder (no calendar in email 1, no CTA in email 4)
 *   - Conditional spintax checks (skipped when spintax_enabled = false)
 */

import { describe, it, expect } from 'vitest'
import { checkCopyQuality } from '../copy-quality-check'
import type { DraftSequences, OnboardingClient, CaseStudy } from '@/types/onboarding'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeClient(overrides: Partial<OnboardingClient> = {}): Pick<
  OnboardingClient,
  'case_studies' | 'spintax_enabled' | 'setup_fee' | 'recurring_fee' | 'voice_profile'
> {
  return {
    case_studies: [],
    spintax_enabled: null,
    setup_fee: null,
    recurring_fee: null,
    voice_profile: null,
    ...overrides,
  }
}

function makeSeq(emails: Array<{ step: number; subject: string; body: string; cta_type?: any }>): DraftSequences {
  return {
    sequences: [
      {
        sequence_name: 'test',
        strategy: 'test strategy',
        emails: emails.map((e) => ({
          step: e.step,
          delay_days: e.step === 1 ? 0 : (e.step - 1) * 3,
          subject_line: e.subject,
          body: e.body,
          purpose: 'test',
          cta_type: e.cta_type,
        })),
      },
    ],
  }
}

// A clean high-trust email 1 with no violations.
const CLEAN_EMAIL_1 = {
  step: 1,
  subject: 'adaptive launch film',
  body: '{{firstName}},\n\nAdaptive launched six months ago with a film instead of a demo. Most founders bet on a product walkthrough. Adaptive bet on a different first impression.\n\nI made that film. Happy to send it over.\n\nRob',
  cta_type: 'asset_offer' as const,
}

const CLEAN_EMAIL_2 = {
  step: 2,
  subject: 'what made it work',
  body: '{{firstName}},\n\nThe Adaptive film worked because it led with the founder conviction, not features.\n\nViewers remember the story before the product. That memory converts later.\n\nHappy to jump on a call if useful.\n\nRob',
  cta_type: 'soft_call_mention' as const,
}

const CLEAN_EMAIL_3 = {
  step: 3,
  subject: '15 min this week',
  body: '{{firstName}},\n\nThe next 90 days set how your market thinks about you for years.\n\nI work with a small number of founders, usually right at launch.\n\nIf timing fits: Thursday at 2pm or Friday morning. calendly.com/apropos/intro\n\nRob',
  cta_type: 'calendar_link' as const,
}

const CLEAN_EMAIL_4 = {
  step: 4,
  subject: 'closing the loop',
  body: '{{firstName}},\n\nHaven\'t heard back so I\'ll leave it here. If the conversation ever becomes relevant, you know where to find me.\n\nRob',
  cta_type: 'breakup' as const,
}

// ---------------------------------------------------------------------------
// Per-position word caps
// ---------------------------------------------------------------------------

describe('Word count caps (V3 per-position)', () => {
  const HIGH_TRUST_CLIENT = makeClient({ setup_fee: 35000 })

  it('passes a 54-word email 1', () => {
    const result = checkCopyQuality(makeSeq([CLEAN_EMAIL_1]), HIGH_TRUST_CLIENT)
    const wcErrors = result.issues.filter((i) => i.check === 'word_count')
    expect(wcErrors).toHaveLength(0)
  })

  it('flags an email 1 with 80 words (over the 75 cap)', () => {
    const longBody = 'one '.repeat(80).trim()
    const result = checkCopyQuality(makeSeq([{ ...CLEAN_EMAIL_1, body: longBody }]), HIGH_TRUST_CLIENT)
    const wcErrors = result.issues.filter((i) => i.check === 'word_count')
    expect(wcErrors).toHaveLength(1)
    expect(wcErrors[0].severity).toBe('error')
    expect(wcErrors[0].detail).toContain('max 75')
  })

  it('flags an email 2 with 65 words (over the 60 cap)', () => {
    const longBody = 'one '.repeat(65).trim()
    const result = checkCopyQuality(makeSeq([CLEAN_EMAIL_1, { ...CLEAN_EMAIL_2, body: longBody }]), HIGH_TRUST_CLIENT)
    const wcErrors = result.issues.filter((i) => i.check === 'word_count')
    expect(wcErrors).toHaveLength(1)
    expect(wcErrors[0].detail).toContain('max 60')
  })

  it('flags an email 4 (breakup) with 50 words (over the 40 cap)', () => {
    const longBody = 'one '.repeat(50).trim()
    const result = checkCopyQuality(
      makeSeq([CLEAN_EMAIL_1, CLEAN_EMAIL_2, CLEAN_EMAIL_3, { ...CLEAN_EMAIL_4, body: longBody }]),
      HIGH_TRUST_CLIENT,
    )
    const wcErrors = result.issues.filter((i) => i.check === 'word_count')
    expect(wcErrors).toHaveLength(1)
    expect(wcErrors[0].detail).toContain('max 40')
  })
})

// ---------------------------------------------------------------------------
// Fabricated claim detector
// ---------------------------------------------------------------------------

describe('Fabricated claim detector', () => {
  const ADAPTIVE_CASE: CaseStudy = {
    client_name: 'Adaptive',
    engagement: 'launch film',
    results: '1.2M views in 90 days, revenue doubled',
    is_named: true,
  }

  it('flags an invented client count when no case_studies match', () => {
    const client = makeClient({ setup_fee: 35000, case_studies: [ADAPTIVE_CASE] })
    const seq = makeSeq([
      {
        ...CLEAN_EMAIL_1,
        body: '{{firstName}}, we have worked with 12 YC companies and the pattern is clear.',
      },
    ])
    const result = checkCopyQuality(seq, client)
    const fabErrors = result.issues.filter((i) => i.check === 'fabricated_client_count')
    expect(fabErrors.length).toBeGreaterThan(0)
    expect(fabErrors[0].severity).toBe('error')
  })

  it('flags "trusted by" claims', () => {
    const client = makeClient({ setup_fee: 35000, case_studies: [ADAPTIVE_CASE] })
    const seq = makeSeq([
      {
        ...CLEAN_EMAIL_1,
        body: '{{firstName}}, leading AI brands choose us for their launch films.',
      },
    ])
    const result = checkCopyQuality(seq, client)
    const fabErrors = result.issues.filter((i) => i.check === 'fabricated_trusted_by')
    expect(fabErrors.length).toBeGreaterThan(0)
  })

  it('allows references to clients that ARE in case_studies', () => {
    const client = makeClient({ setup_fee: 35000, case_studies: [ADAPTIVE_CASE] })
    const seq = makeSeq([CLEAN_EMAIL_1]) // body cites Adaptive, which is in case_studies
    const result = checkCopyQuality(seq, client)
    const fabErrors = result.issues.filter(
      (i) => i.check.startsWith('fabricated_'),
    )
    expect(fabErrors).toHaveLength(0)
  })

  it('flags revenue figures not present in case_studies', () => {
    const client = makeClient({ setup_fee: 35000, case_studies: [ADAPTIVE_CASE] })
    const seq = makeSeq([
      {
        ...CLEAN_EMAIL_1,
        body: '{{firstName}}, our clients have generated $4.2M in pipeline this year alone.',
      },
    ])
    const result = checkCopyQuality(seq, client)
    const fabErrors = result.issues.filter((i) => i.check === 'fabricated_quantified_result')
    expect(fabErrors.length).toBeGreaterThan(0)
  })

  it('skips fabrication checks when client is not provided (legacy)', () => {
    const seq = makeSeq([
      {
        ...CLEAN_EMAIL_1,
        body: 'we have worked with 12 YC companies',
      },
    ])
    const result = checkCopyQuality(seq) // no client
    const fabErrors = result.issues.filter((i) => i.check.startsWith('fabricated_'))
    expect(fabErrors).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// High-trust banned phrases
// ---------------------------------------------------------------------------

describe('High-trust banned phrases', () => {
  const CLIENT = makeClient({ setup_fee: 35000 })

  const phraseCases = [
    { label: 'founder-to-founder', body: '{{firstName}}, founder-to-founder, this is the deal.' },
    { label: 'just wanted to reach out', body: '{{firstName}}, just wanted to reach out about your launch.' },
    { label: 'circling back', body: '{{firstName}}, circling back on this one.' },
    { label: 'quick question (opener)', body: '{{firstName}}, quick question. about your launch?' },
    { label: 'absurd pricing', body: '{{firstName}}, your competitors charge absurd pricing for half the work.' },
    { label: 'false scarcity (2 spots)', body: '{{firstName}}, only 2 spots left for Q3 production.' },
    { label: 'looping back', body: '{{firstName}}, looping back on the proposal.' },
    { label: 'this week only', body: '{{firstName}}, this week only — taking 3 new clients.' },
  ]

  for (const c of phraseCases) {
    it(`flags "${c.label}"`, () => {
      const seq = makeSeq([{ ...CLEAN_EMAIL_1, body: c.body }])
      const result = checkCopyQuality(seq, CLIENT)
      const bannedErrors = result.issues.filter(
        (i) => i.check === 'high_trust_banned_phrase' || i.check === 'high_trust_banned_pattern',
      )
      expect(bannedErrors.length).toBeGreaterThan(0)
    })
  }

  it('flags "Here\'s why" sentence starts', () => {
    const seq = makeSeq([
      {
        ...CLEAN_EMAIL_1,
        body: '{{firstName}}, your launch matters. Here\'s why: timing is everything.',
      },
    ])
    const result = checkCopyQuality(seq, CLIENT)
    const patternErrors = result.issues.filter((i) => i.check === 'high_trust_banned_pattern')
    expect(patternErrors.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// CTA ladder
// ---------------------------------------------------------------------------

describe('CTA ladder', () => {
  const CLIENT = makeClient({ setup_fee: 35000 })

  it('flags a calendar link in email 1', () => {
    const seq = makeSeq([
      {
        ...CLEAN_EMAIL_1,
        body: '{{firstName}}, happy to chat. calendly.com/me/intro',
      },
    ])
    const result = checkCopyQuality(seq, CLIENT)
    const ladderErrors = result.issues.filter((i) => i.check === 'cta_ladder_email_1_calendar')
    expect(ladderErrors.length).toBeGreaterThan(0)
  })

  it('flags time offers in email 1', () => {
    const seq = makeSeq([
      {
        ...CLEAN_EMAIL_1,
        body: '{{firstName}}, happy to chat. Are you free Thursday?',
      },
    ])
    const result = checkCopyQuality(seq, CLIENT)
    const ladderErrors = result.issues.filter((i) => i.check === 'cta_ladder_email_1_time_offer')
    expect(ladderErrors.length).toBeGreaterThan(0)
  })

  it('flags a calendar link in email 4 (breakup)', () => {
    const seq = makeSeq([
      CLEAN_EMAIL_1,
      CLEAN_EMAIL_2,
      CLEAN_EMAIL_3,
      {
        ...CLEAN_EMAIL_4,
        body: '{{firstName}}, closing the loop. If you change your mind: calendly.com/me/intro',
      },
    ])
    const result = checkCopyQuality(seq, CLIENT)
    const ladderErrors = result.issues.filter((i) => i.check === 'cta_ladder_email_4_calendar')
    expect(ladderErrors.length).toBeGreaterThan(0)
  })

  it('flags wrong cta_type for email 1', () => {
    const seq = makeSeq([{ ...CLEAN_EMAIL_1, cta_type: 'calendar_link' }])
    const result = checkCopyQuality(seq, CLIENT)
    const ladderErrors = result.issues.filter((i) => i.check === 'cta_ladder_email_1_type')
    expect(ladderErrors.length).toBeGreaterThan(0)
  })

  it('flags wrong cta_type for email 4', () => {
    const seq = makeSeq([
      CLEAN_EMAIL_1,
      CLEAN_EMAIL_2,
      CLEAN_EMAIL_3,
      { ...CLEAN_EMAIL_4, cta_type: 'soft_call_mention' },
    ])
    const result = checkCopyQuality(seq, CLIENT)
    const ladderErrors = result.issues.filter((i) => i.check === 'cta_ladder_email_4_type')
    expect(ladderErrors.length).toBeGreaterThan(0)
  })

  it('passes the canonical clean 4-email high-trust sequence', () => {
    const client = makeClient({
      setup_fee: 35000,
      // CLEAN_EMAIL_3 embeds calendly.com/apropos/intro; declare it on the
      // client so the fabricated-url check whitelists it. In production this
      // mirrors the actual rule: a calendar URL in copy MUST come from
      // client.calendar_link.
      calendar_link: 'calendly.com/apropos/intro',
      case_studies: [
        {
          client_name: 'Adaptive',
          engagement: 'launch film',
          results: '1.2M views in 90 days, revenue doubled',
          is_named: true,
        },
      ],
    })
    const seq = makeSeq([CLEAN_EMAIL_1, CLEAN_EMAIL_2, CLEAN_EMAIL_3, CLEAN_EMAIL_4])
    const result = checkCopyQuality(seq, client)
    const errorIssues = result.issues.filter((i) => i.severity === 'error')
    // The canonical clean sequence should produce no errors. (Warnings are
    // OK — e.g. insufficient_spintax warnings only fire if spintax is
    // expected, which it isn't for this $35K AOV client.)
    expect(errorIssues).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Conditional spintax requirement
// ---------------------------------------------------------------------------

describe('Conditional spintax checks', () => {
  it('does NOT warn about insufficient spintax for high-AOV (precision doctrine)', () => {
    const client = makeClient({ setup_fee: 35000 }) // -> tier 'high', spintax default false
    const seq = makeSeq([CLEAN_EMAIL_1, CLEAN_EMAIL_2]) // no spintax in body
    const result = checkCopyQuality(seq, client)
    const spintaxIssues = result.issues.filter(
      (i) => i.check === 'insufficient_spintax' || i.check === 'no_subject_spintax',
    )
    expect(spintaxIssues).toHaveLength(0)
  })

  it('DOES warn about insufficient spintax for low-AOV (volume doctrine)', () => {
    const client = makeClient({ setup_fee: 4000 }) // -> tier 'low', spintax default true
    const seq = makeSeq([CLEAN_EMAIL_1]) // no spintax in body
    const result = checkCopyQuality(seq, client)
    const spintaxIssues = result.issues.filter(
      (i) => i.check === 'insufficient_spintax' || i.check === 'no_subject_spintax',
    )
    expect(spintaxIssues.length).toBeGreaterThan(0)
  })

  it('honors explicit spintax_enabled override over AOV default', () => {
    const client = makeClient({ setup_fee: 35000, spintax_enabled: true })
    const seq = makeSeq([CLEAN_EMAIL_1])
    const result = checkCopyQuality(seq, client)
    const spintaxIssues = result.issues.filter(
      (i) => i.check === 'insufficient_spintax' || i.check === 'no_subject_spintax',
    )
    // High AOV but explicit spintax_enabled = true -> warns about missing spintax
    expect(spintaxIssues.length).toBeGreaterThan(0)
  })
})
