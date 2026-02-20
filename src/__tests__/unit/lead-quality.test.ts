/**
 * Lead Quality Gate Unit Tests
 *
 * Tests the meetsQualityBar() function from src/lib/services/lead-quality.service.ts.
 *
 * The gate requires:
 *   - first_name: trimmed, >= 2 chars
 *   - last_name:  trimmed, >= 2 chars
 *   - company_name: trimmed, non-empty
 *   - email: matches /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
 */

import { describe, it, expect } from 'vitest'
import { meetsQualityBar } from '@/lib/services/lead-quality.service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_LEAD = {
  first_name: 'John',
  last_name: 'Smith',
  company_name: 'Acme Corp',
  email: 'john.smith@acme.com',
}

// ---------------------------------------------------------------------------
// Missing field tests
// ---------------------------------------------------------------------------

describe('meetsQualityBar — missing required fields', () => {
  it('returns passes:false when first_name is null', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, first_name: null })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_first_name')
  })

  it('returns passes:false when first_name is undefined', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, first_name: undefined })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_first_name')
  })

  it('returns passes:false when first_name is empty string', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, first_name: '' })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_first_name')
  })

  it('returns passes:false when first_name is whitespace only', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, first_name: '   ' })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_first_name')
  })

  it('returns passes:false when first_name is a single character', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, first_name: 'J' })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_first_name')
  })

  it('returns passes:false when last_name is null', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, last_name: null })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_last_name')
  })

  it('returns passes:false when last_name is empty string', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, last_name: '' })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_last_name')
  })

  it('returns passes:false when last_name is a single character', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, last_name: 'S' })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_last_name')
  })

  it('returns passes:false when company_name is null', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, company_name: null })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_company_name')
  })

  it('returns passes:false when company_name is empty string', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, company_name: '' })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_company_name')
  })

  it('returns passes:false when company_name is whitespace only', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, company_name: '   ' })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_company_name')
  })

  it('returns passes:false when email is null', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, email: null })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_email')
  })

  it('returns passes:false when email is empty string', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, email: '' })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_email')
  })

  it('returns passes:false when email has no @ symbol', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, email: 'notanemail' })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_email')
  })

  it('returns passes:false when email has no TLD', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, email: 'user@nodot' })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_email')
  })

  it('returns passes:false when email TLD is only 1 char', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, email: 'user@domain.c' })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_email')
  })

  it('returns passes:false when email contains spaces', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, email: 'user name@domain.com' })
    expect(result.passes).toBe(false)
    expect(result.reason).toBe('missing_email')
  })
})

// ---------------------------------------------------------------------------
// Valid leads
// ---------------------------------------------------------------------------

describe('meetsQualityBar — valid leads', () => {
  it('returns passes:true when all 4 required fields are present and valid', () => {
    const result = meetsQualityBar(VALID_LEAD)
    expect(result.passes).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('accepts a business email address', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, email: 'ceo@bigcorp.io' })
    expect(result.passes).toBe(true)
  })

  it('accepts a gmail address', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, email: 'jane.doe@gmail.com' })
    expect(result.passes).toBe(true)
  })

  it('accepts names exactly 2 characters long', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, first_name: 'Jo', last_name: 'Li' })
    expect(result.passes).toBe(true)
  })

  it('accepts company name that is 1 word', () => {
    const result = meetsQualityBar({ ...VALID_LEAD, company_name: 'Apple' })
    expect(result.passes).toBe(true)
  })

  it('trims leading/trailing whitespace on names before checking length', () => {
    // " Jo " trims to "Jo" which is 2 chars — valid
    const result = meetsQualityBar({ ...VALID_LEAD, first_name: '  Jo  ' })
    expect(result.passes).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Priority ordering — first missing field wins the reason
// ---------------------------------------------------------------------------

describe('meetsQualityBar — reason reflects first failing check', () => {
  it('reports missing_first_name before missing_last_name', () => {
    const result = meetsQualityBar({
      first_name: null,
      last_name: null,
      company_name: 'Corp',
      email: 'x@y.com',
    })
    expect(result.reason).toBe('missing_first_name')
  })

  it('reports missing_last_name when first_name is ok but last_name is missing', () => {
    const result = meetsQualityBar({
      first_name: 'Jane',
      last_name: null,
      company_name: 'Corp',
      email: 'x@y.com',
    })
    expect(result.reason).toBe('missing_last_name')
  })

  it('reports missing_company_name when first/last are ok but company is missing', () => {
    const result = meetsQualityBar({
      first_name: 'Jane',
      last_name: 'Doe',
      company_name: null,
      email: 'x@y.com',
    })
    expect(result.reason).toBe('missing_company_name')
  })

  it('reports missing_email last, after all other fields pass', () => {
    const result = meetsQualityBar({
      first_name: 'Jane',
      last_name: 'Doe',
      company_name: 'Corp',
      email: null,
    })
    expect(result.reason).toBe('missing_email')
  })
})
