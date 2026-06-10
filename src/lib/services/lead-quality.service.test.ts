import { describe, it, expect } from 'vitest'
import { assessLeadQuality, meetsQualityBar } from './lead-quality.service'
import type { ALEnrichedProfile } from '@/lib/audiencelab/api-client'

const full = {
  BUSINESS_VERIFIED_EMAILS: 'jane@acme.com',
  FIRST_NAME: 'Jane',
  LAST_NAME: 'Doe',
  COMPANY_NAME: 'Acme',
  JOB_TITLE: 'VP Sales',
} as unknown as ALEnrichedProfile

describe('assessLeadQuality', () => {
  it('rejects a record with no verified email', () => {
    const r = { PERSONAL_EMAILS: 'jane@gmail.com', FIRST_NAME: 'Jane', LAST_NAME: 'Doe' } as unknown as ALEnrichedProfile
    expect(assessLeadQuality(r)).toEqual({ deliverable: false, needsEnrichment: false, reason: 'no_verified_email' })
  })

  it('passes a verified, fully-populated record with no top-up', () => {
    expect(assessLeadQuality(full)).toEqual({ deliverable: true, needsEnrichment: false })
  })

  it('flags a verified but sparse record for enrichment (missing company)', () => {
    const r = { ...full, COMPANY_NAME: '' } as unknown as ALEnrichedProfile
    expect(assessLeadQuality(r)).toEqual({ deliverable: true, needsEnrichment: true })
  })

  it('flags for enrichment when the job title is missing', () => {
    const r = { ...full, JOB_TITLE: '' } as unknown as ALEnrichedProfile
    expect(assessLeadQuality(r)).toEqual({ deliverable: true, needsEnrichment: true })
  })

  it('rejects a verified email that AL explicitly marks invalid', () => {
    const r = { ...full, PERSONAL_EMAIL_VALIDATION_STATUS: 'invalid' } as unknown as ALEnrichedProfile
    expect(assessLeadQuality(r)).toMatchObject({ deliverable: false, reason: 'email_status_invalid' })
  })

  it('rejects a catch-all status', () => {
    const r = { ...full, BUSINESS_EMAIL_VALIDATION_STATUS: 'catch_all' } as unknown as ALEnrichedProfile
    expect(assessLeadQuality(r)).toMatchObject({ deliverable: false, reason: 'email_status_catch_all' })
  })

  it('keeps a verified email when the status is explicitly valid', () => {
    const r = { ...full, PERSONAL_EMAIL_VALIDATION_STATUS: 'valid' } as unknown as ALEnrichedProfile
    expect(assessLeadQuality(r)).toEqual({ deliverable: true, needsEnrichment: false })
  })

  it('falls back to verified-presence when the status field is absent', () => {
    // Real audience/pixel records frequently omit *_EMAIL_VALIDATION_STATUS.
    expect(assessLeadQuality(full).deliverable).toBe(true)
  })

  it('does not reject on an unrecognized (non-bad) status', () => {
    const r = { ...full, PERSONAL_EMAIL_VALIDATION_STATUS: 'risky_but_unknown_to_us' } as unknown as ALEnrichedProfile
    expect(assessLeadQuality(r).deliverable).toBe(true)
  })
})

describe('meetsQualityBar (regression — unchanged)', () => {
  it('passes a complete lead', () => {
    expect(
      meetsQualityBar({
        first_name: 'Jane',
        last_name: 'Doe',
        company_name: 'Acme',
        email: 'jane@acme.com',
        phone: '+15551234567',
        state: 'CA',
      }).passes
    ).toBe(true)
  })

  it('fails without a company', () => {
    expect(
      meetsQualityBar({ first_name: 'Jane', last_name: 'Doe', email: 'jane@acme.com', phone: '+15551234567', state: 'CA' })
    ).toMatchObject({ passes: false, reason: 'missing_company_name' })
  })

  it('fails a phone-less lead by default (marketplace)', () => {
    expect(
      meetsQualityBar({ first_name: 'Jane', last_name: 'Doe', company_name: 'Acme', email: 'jane@acme.com', state: 'CA' })
    ).toMatchObject({ passes: false, reason: 'missing_phone' })
  })

  it('passes a phone-less identified visitor when requirePhone is false', () => {
    expect(
      meetsQualityBar(
        { first_name: 'Carol', last_name: 'Smith', company_name: 'Village Creek', email: 'carole@hotmail.com', state: 'CA', city: 'Fair Oaks' },
        { requirePhone: false }
      ).passes
    ).toBe(true)
  })
})
