import { describe, it, expect } from 'vitest'
import {
  extractV4Emails,
  buildV4EnrichPatch,
  buildInstallSignalEvent,
} from './pixel-v4-sync'

describe('extractV4Emails', () => {
  it('returns empty for resolution with no email fields', () => {
    expect(extractV4Emails({})).toEqual([])
  })

  it('extracts a single BUSINESS_EMAIL', () => {
    expect(extractV4Emails({ BUSINESS_EMAIL: 'biz@acme.com' })).toEqual(['biz@acme.com'])
  })

  it('lowercases all emails', () => {
    expect(
      extractV4Emails({
        BUSINESS_EMAIL: 'Biz@Acme.COM',
        PERSONAL_EMAILS: 'JANE@GMAIL.com',
      })
    ).toEqual(['jane@gmail.com', 'biz@acme.com'])
  })

  it('splits CSV email fields', () => {
    expect(
      extractV4Emails({
        PERSONAL_EMAILS: 'a@x.com, b@x.com, c@x.com',
      })
    ).toEqual(['a@x.com', 'b@x.com', 'c@x.com'])
  })

  it('dedupes emails seen across multiple fields', () => {
    expect(
      extractV4Emails({
        PERSONAL_EMAILS: 'jane@x.com',
        PERSONAL_VERIFIED_EMAILS: 'jane@x.com',
        BUSINESS_EMAIL: 'jane@x.com',
      })
    ).toEqual(['jane@x.com'])
  })

  it('skips strings without @ (defense vs malformed data)', () => {
    expect(
      extractV4Emails({
        PERSONAL_EMAILS: 'not-an-email, jane@gmail.com, also bad',
      })
    ).toEqual(['jane@gmail.com'])
  })

  it('skips empty / whitespace-only entries', () => {
    expect(
      extractV4Emails({
        PERSONAL_EMAILS: '  , , jane@gmail.com,  ',
      })
    ).toEqual(['jane@gmail.com'])
  })
})

describe('buildV4EnrichPatch', () => {
  it('always sets updated_at', () => {
    const patch = buildV4EnrichPatch({}, null)
    expect(patch.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('passes through DEPARTMENT and SENIORITY_LEVEL', () => {
    const patch = buildV4EnrichPatch(
      { DEPARTMENT: 'Sales', SENIORITY_LEVEL: 'VP' },
      null
    )
    expect(patch.department).toBe('Sales')
    expect(patch.seniority_level).toBe('VP')
  })

  it('coerces COMPANY_EMPLOYEE_COUNT to integer', () => {
    expect(
      buildV4EnrichPatch({ COMPANY_EMPLOYEE_COUNT: '500' }, null).company_employee_count
    ).toBe(500)
    // Garbage → null, not NaN, so the column write is clean.
    expect(
      buildV4EnrichPatch({ COMPANY_EMPLOYEE_COUNT: 'unknown' }, null).company_employee_count
    ).toBeNull()
  })

  it('sets page_url when full_url present', () => {
    expect(buildV4EnrichPatch({}, 'https://acme.com/pricing').page_url).toBe(
      'https://acme.com/pricing'
    )
  })

  it('does NOT override intent_score on default-scoring (50) URLs', () => {
    // Homepage / unknown pattern → score 50; we leave intent_score
    // alone so the lead's earlier real signal isn't clobbered.
    const patch = buildV4EnrichPatch({}, 'https://acme.com/')
    expect(patch.intent_score).toBeUndefined()
    expect(patch.intent_signal).toBeUndefined()
  })

  it('writes intent_score + signal on meaningful URL patterns', () => {
    const patch = buildV4EnrichPatch({}, 'https://acme.com/pricing')
    expect(patch.intent_score).toBe(90)
    expect(patch.intent_signal).toBe('Viewed pricing')
  })

  it('writes DNC flags when present', () => {
    const patch = buildV4EnrichPatch({ MOBILE_DNC: 'true', LANDLINE_DNC: false }, null)
    expect(patch.dnc_mobile).toBe(true)
    expect(patch.dnc_landline).toBe(false)
  })

  it('omits DNC flags when absent (does NOT default to false)', () => {
    const patch = buildV4EnrichPatch({}, null)
    expect(patch.dnc_mobile).toBeUndefined()
    expect(patch.dnc_landline).toBeUndefined()
  })

  it('handles missing fields without throwing', () => {
    expect(() => buildV4EnrichPatch({}, null)).not.toThrow()
    expect(() => buildV4EnrichPatch({}, undefined)).not.toThrow()
  })
})

describe('buildInstallSignalEvent (S4 canonical pull signal)', () => {
  const base = {
    alPixelId: 'mgmt-1',
    pixelRowId: 'pixrow-1',
    workspaceId: 'ws-1',
    leadId: 'lead-1',
    resolution: { FIRST_NAME: 'Jane', BUSINESS_EMAIL: 'jane@acme.com' },
    now: '2026-06-10T00:00:00.000Z',
  }

  it('stamps the canonical pixel_row_id + workspace and marks it processed', () => {
    const row = buildInstallSignalEvent({ ...base, eventTimestamp: null })
    expect(row.pixel_row_id).toBe('pixrow-1')
    expect(row.workspace_id).toBe('ws-1')
    expect(row.lead_id).toBe('lead-1')
    expect(row.processed).toBe(true)
    expect(row.source).toBe('pixel_v4_pull')
    // raw upstream pixel_id kept only as diagnostic
    expect(row.pixel_id).toBe('mgmt-1')
    // raw resolution preserved so the portal feed can render the visitor
    expect(row.raw).toEqual(base.resolution)
  })

  it('uses the event timestamp when present, else falls back to now', () => {
    expect(
      buildInstallSignalEvent({ ...base, eventTimestamp: '2026-06-09T12:00:00.000Z' })
        .received_at
    ).toBe('2026-06-09T12:00:00.000Z')
    expect(
      buildInstallSignalEvent({ ...base, eventTimestamp: null }).received_at
    ).toBe('2026-06-10T00:00:00.000Z')
  })
})
