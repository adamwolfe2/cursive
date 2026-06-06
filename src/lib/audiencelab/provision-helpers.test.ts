import { describe, it, expect } from 'vitest'
import {
  classifyPollResult,
  matchesWorkspaceICP,
  v4ResolutionToProfile,
  pickBestEmail,
  AUDIENCE_POLL_DELAYS_SECONDS,
} from './provision-helpers'
import type { ALEnrichedProfile, ALPixelResolutionV4 } from './api-client'

describe('classifyPollResult', () => {
  const UNFILTERED = 100_000

  it('returns ready when AL has materialized records', () => {
    expect(classifyPollResult(50, UNFILTERED)).toEqual({
      state: 'ready',
      totalRecords: 50,
    })
  })

  it('returns building when AL has accepted but not yet materialized', () => {
    expect(classifyPollResult(0, UNFILTERED)).toEqual({ state: 'building' })
  })

  it('returns unfiltered abort when count crosses the safety threshold', () => {
    expect(classifyPollResult(100_001, UNFILTERED)).toEqual({
      state: 'unfiltered',
      totalRecords: 100_001,
    })
  })

  it('treats exactly the threshold as unfiltered (defense in depth)', () => {
    expect(classifyPollResult(UNFILTERED, UNFILTERED)).toEqual({
      state: 'unfiltered',
      totalRecords: UNFILTERED,
    })
  })

  it('handles 1-record audiences as ready', () => {
    expect(classifyPollResult(1, UNFILTERED)).toEqual({
      state: 'ready',
      totalRecords: 1,
    })
  })
})

describe('AUDIENCE_POLL_DELAYS_SECONDS', () => {
  it('has at least one delay and total is bounded', () => {
    expect(AUDIENCE_POLL_DELAYS_SECONDS.length).toBeGreaterThan(0)
    const total = AUDIENCE_POLL_DELAYS_SECONDS.reduce((a, b) => a + b, 0)
    // Comfortably inside the 12-min step.finish budget — leaving room
    // for the page-fetch loop + downstream notify/affiliate/email work.
    expect(total).toBeLessThan(10 * 60)
  })

  it('uses non-decreasing backoff (no thrashing)', () => {
    for (let i = 1; i < AUDIENCE_POLL_DELAYS_SECONDS.length; i++) {
      expect(AUDIENCE_POLL_DELAYS_SECONDS[i]).toBeGreaterThanOrEqual(
        AUDIENCE_POLL_DELAYS_SECONDS[i - 1]
      )
    }
  })
})

describe('matchesWorkspaceICP', () => {
  const record = (over: Partial<ALEnrichedProfile> = {}): ALEnrichedProfile => ({
    COMPANY_INDUSTRY: 'Software',
    PERSONAL_STATE: 'CA',
    COMPANY_STATE: 'CA',
    ...over,
  })

  it('passes when no preferences are set', () => {
    expect(matchesWorkspaceICP(record(), [], [])).toBe(true)
  })

  it('matches industry by case-insensitive substring (either direction)', () => {
    expect(matchesWorkspaceICP(record({ COMPANY_INDUSTRY: 'Software' }), ['software'], [])).toBe(true)
    expect(matchesWorkspaceICP(record({ COMPANY_INDUSTRY: 'B2B Software' }), ['software'], [])).toBe(true)
    expect(matchesWorkspaceICP(record({ COMPANY_INDUSTRY: 'Soft' }), ['software'], [])).toBe(true)
  })

  it('rejects industry mismatch', () => {
    expect(matchesWorkspaceICP(record({ COMPANY_INDUSTRY: 'Retail' }), ['software'], [])).toBe(false)
  })

  it('rejects when industry preference is set but record has none', () => {
    expect(matchesWorkspaceICP(record({ COMPANY_INDUSTRY: undefined }), ['software'], [])).toBe(false)
  })

  it('matches state when record matches one in the list', () => {
    expect(matchesWorkspaceICP(record({ PERSONAL_STATE: 'CA' }), [], ['CA', 'TX'])).toBe(true)
    expect(matchesWorkspaceICP(record({ PERSONAL_STATE: 'TX' }), [], ['CA', 'TX'])).toBe(true)
  })

  it('rejects state mismatch', () => {
    expect(matchesWorkspaceICP(record({ PERSONAL_STATE: 'NY', COMPANY_STATE: 'NY' }), [], ['CA'])).toBe(false)
  })

  it('passes state filter when record has no state at all (AL data gap, not a mismatch)', () => {
    // Intentional: missing data shouldn't filter the record out at the
    // ICP gate — quality scoring downstream catches sparse records.
    expect(
      matchesWorkspaceICP(
        record({ PERSONAL_STATE: undefined, COMPANY_STATE: undefined }),
        [],
        ['CA']
      )
    ).toBe(true)
  })

  it('requires BOTH industry and state when both set', () => {
    expect(
      matchesWorkspaceICP(
        record({ COMPANY_INDUSTRY: 'Software', PERSONAL_STATE: 'CA' }),
        ['software'],
        ['CA']
      )
    ).toBe(true)

    expect(
      matchesWorkspaceICP(
        record({ COMPANY_INDUSTRY: 'Software', PERSONAL_STATE: 'NY' }),
        ['software'],
        ['CA']
      )
    ).toBe(false)

    expect(
      matchesWorkspaceICP(
        record({ COMPANY_INDUSTRY: 'Retail', PERSONAL_STATE: 'CA' }),
        ['software'],
        ['CA']
      )
    ).toBe(false)
  })

  it('falls back to company state when personal state missing', () => {
    expect(
      matchesWorkspaceICP(
        record({ PERSONAL_STATE: undefined, COMPANY_STATE: 'CA' }),
        [],
        ['CA']
      )
    ).toBe(true)
  })
})

describe('v4ResolutionToProfile', () => {
  it('passes through shared upper-case fields unchanged', () => {
    const res: ALPixelResolutionV4 = {
      FIRST_NAME: 'Jane',
      LAST_NAME: 'Doe',
      BUSINESS_EMAIL: 'jane@acme.com',
      COMPANY_NAME: 'Acme',
      JOB_TITLE: 'VP Sales',
    }
    const out = v4ResolutionToProfile(res)
    expect(out.FIRST_NAME).toBe('Jane')
    expect(out.BUSINESS_EMAIL).toBe('jane@acme.com')
    expect(out.COMPANY_NAME).toBe('Acme')
    expect(out.JOB_TITLE).toBe('VP Sales')
  })

  it('derives MOBILE_PHONE from ALL_MOBILES when not present', () => {
    const out = v4ResolutionToProfile({ ALL_MOBILES: '+15551234567,+15557654321' })
    expect(out.MOBILE_PHONE).toBe('+15551234567')
  })

  it('does not overwrite an explicit MOBILE_PHONE with derived value', () => {
    const out = v4ResolutionToProfile({
      MOBILE_PHONE: '+15550000000',
      ALL_MOBILES: '+15551234567',
    })
    expect(out.MOBILE_PHONE).toBe('+15550000000')
  })

  it('derives DIRECT_NUMBER from ALL_LANDLINES when not present', () => {
    const out = v4ResolutionToProfile({ ALL_LANDLINES: '+18005550100' })
    expect(out.DIRECT_NUMBER).toBe('+18005550100')
  })

  it('handles empty / missing phone CSVs without crashing', () => {
    expect(() => v4ResolutionToProfile({})).not.toThrow()
    expect(() => v4ResolutionToProfile({ ALL_MOBILES: '' })).not.toThrow()
    expect(() => v4ResolutionToProfile({ ALL_MOBILES: ',' })).not.toThrow()
  })

  it('carries v4-specific fields through the catch-all signature', () => {
    const out = v4ResolutionToProfile({
      DEPARTMENT: 'Engineering',
      SENIORITY_LEVEL: 'C-Suite',
      HEADLINE: 'Builder',
      INFERRED_YEARS_EXPERIENCE: '12',
    })
    // These pass through via the index signature even though
    // ALEnrichedProfile doesn't enumerate them.
    expect((out as unknown as Record<string, unknown>).DEPARTMENT).toBe('Engineering')
    expect((out as unknown as Record<string, unknown>).SENIORITY_LEVEL).toBe('C-Suite')
    expect((out as unknown as Record<string, unknown>).HEADLINE).toBe('Builder')
  })
})

describe('pickBestEmail', () => {
  it('prefers BUSINESS_VERIFIED_EMAILS array', () => {
    expect(
      pickBestEmail({
        BUSINESS_VERIFIED_EMAILS: ['biz@acme.com'] as unknown as string,
        BUSINESS_EMAIL: 'biz2@acme.com',
      })
    ).toBe('biz@acme.com')
  })

  it('handles BUSINESS_VERIFIED_EMAILS as CSV string', () => {
    expect(
      pickBestEmail({
        BUSINESS_VERIFIED_EMAILS: 'biz@acme.com, alt@acme.com',
      })
    ).toBe('biz@acme.com')
  })

  it('falls back to PERSONAL_VERIFIED_EMAILS', () => {
    expect(
      pickBestEmail({
        PERSONAL_VERIFIED_EMAILS: 'jane@gmail.com',
      })
    ).toBe('jane@gmail.com')
  })

  it('falls back to PERSONAL_EMAILS CSV first entry', () => {
    expect(
      pickBestEmail({
        PERSONAL_EMAILS: 'jane@gmail.com,jane2@gmail.com',
      })
    ).toBe('jane@gmail.com')
  })

  it('falls back to BUSINESS_EMAIL', () => {
    expect(
      pickBestEmail({
        BUSINESS_EMAIL: 'biz@acme.com',
      })
    ).toBe('biz@acme.com')
  })

  it('returns null when no email present', () => {
    expect(pickBestEmail({})).toBeNull()
  })
})
