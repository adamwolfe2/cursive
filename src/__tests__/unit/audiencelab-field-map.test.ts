/**
 * Audience Labs Field Map Unit Tests
 *
 * Tests normalization, deliverability scoring, lead-worthiness policy,
 * primary email selection, and payload flattening.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeALPayload,
  computeDeliverabilityScore,
  isLeadWorthy,
  isVerifiedEmail,
  sanitizeName,
  extractEventType,
  extractIpAddress,
  unwrapWebhookPayload,
  LEAD_CREATION_SCORE_THRESHOLD,
} from '@/lib/audiencelab/field-map'

// ==========================================================================
// DELIVERABILITY SCORING
// ==========================================================================
describe('computeDeliverabilityScore', () => {
  it('should return max score for best-case identity', () => {
    const score = computeDeliverabilityScore({
      validationStatus: 'Valid (Esp)',
      lastSeenDate: new Date().toISOString(), // today
      skiptraceMatchBy: 'phone',
      hasBusinessEmail: true,
      hasPhone: true,
    })
    // 40 (valid esp) + 30 (<30d) + 15 (skiptrace) + 10 (phone) + 5 (biz email) = 100
    expect(score).toBe(100)
  })

  it('should return 0 for invalid status with no other signals', () => {
    const score = computeDeliverabilityScore({
      validationStatus: 'invalid',
      lastSeenDate: null,
      skiptraceMatchBy: null,
      hasBusinessEmail: false,
      hasPhone: false,
    })
    expect(score).toBe(0)
  })

  it('should handle case-insensitive validation status', () => {
    const score = computeDeliverabilityScore({
      validationStatus: 'VALID (ESP)',
      lastSeenDate: null,
      skiptraceMatchBy: null,
      hasBusinessEmail: false,
      hasPhone: false,
    })
    expect(score).toBe(40)
  })

  it('should score catch-all at 15', () => {
    const score = computeDeliverabilityScore({
      validationStatus: 'catch-all',
      lastSeenDate: null,
      skiptraceMatchBy: null,
      hasBusinessEmail: false,
      hasPhone: false,
    })
    expect(score).toBe(15)
  })

  it('should score unknown/null as 5', () => {
    const score = computeDeliverabilityScore({
      validationStatus: null,
      lastSeenDate: null,
      skiptraceMatchBy: null,
      hasBusinessEmail: false,
      hasPhone: false,
    })
    expect(score).toBe(5)
  })

  it('should add 30 for last seen within 30 days', () => {
    const recent = new Date()
    recent.setDate(recent.getDate() - 10)
    const score = computeDeliverabilityScore({
      validationStatus: null,
      lastSeenDate: recent.toISOString(),
      skiptraceMatchBy: null,
      hasBusinessEmail: false,
      hasPhone: false,
    })
    expect(score).toBe(5 + 30) // unknown + <30d
  })

  it('should add 20 for last seen 30-90 days ago', () => {
    const older = new Date()
    older.setDate(older.getDate() - 60)
    const score = computeDeliverabilityScore({
      validationStatus: null,
      lastSeenDate: older.toISOString(),
      skiptraceMatchBy: null,
      hasBusinessEmail: false,
      hasPhone: false,
    })
    expect(score).toBe(5 + 20) // unknown + <90d
  })

  it('should add 10 for last seen 90-180 days ago', () => {
    const old = new Date()
    old.setDate(old.getDate() - 120)
    const score = computeDeliverabilityScore({
      validationStatus: null,
      lastSeenDate: old.toISOString(),
      skiptraceMatchBy: null,
      hasBusinessEmail: false,
      hasPhone: false,
    })
    expect(score).toBe(5 + 10) // unknown + <180d
  })

  it('should add 0 for last seen over 180 days ago', () => {
    const veryOld = new Date()
    veryOld.setDate(veryOld.getDate() - 200)
    const score = computeDeliverabilityScore({
      validationStatus: null,
      lastSeenDate: veryOld.toISOString(),
      skiptraceMatchBy: null,
      hasBusinessEmail: false,
      hasPhone: false,
    })
    expect(score).toBe(5) // unknown only
  })

  it('should add skiptrace bonus without phone', () => {
    const score = computeDeliverabilityScore({
      validationStatus: null,
      lastSeenDate: null,
      skiptraceMatchBy: 'address',
      hasBusinessEmail: false,
      hasPhone: false,
    })
    expect(score).toBe(5 + 15) // unknown + skiptrace (no phone bonus)
  })

  it('should add skiptrace + phone bonus together', () => {
    const score = computeDeliverabilityScore({
      validationStatus: null,
      lastSeenDate: null,
      skiptraceMatchBy: 'phone',
      hasBusinessEmail: false,
      hasPhone: true,
    })
    expect(score).toBe(5 + 15 + 10) // unknown + skiptrace + phone
  })

  it('should cap score at 100', () => {
    const score = computeDeliverabilityScore({
      validationStatus: 'Valid (Esp)',
      lastSeenDate: new Date().toISOString(),
      skiptraceMatchBy: 'phone',
      hasBusinessEmail: true,
      hasPhone: true,
    })
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ==========================================================================
// LEAD-WORTHINESS POLICY
// ==========================================================================
describe('isLeadWorthy', () => {
  it('should be true for verified email + proper name + good score', () => {
    expect(isLeadWorthy({
      eventType: 'page_view',
      deliverabilityScore: 70,
      hasVerifiedEmail: true,
      hasBusinessEmail: true,
      hasPhone: false,
      hasName: true,
    })).toBe(true)
  })

  it('should be false for auth event without verified email (no more bypass)', () => {
    expect(isLeadWorthy({
      eventType: 'authentication',
      deliverabilityScore: 0,
      hasVerifiedEmail: false,
      hasBusinessEmail: false,
      hasPhone: false,
      hasName: false,
    })).toBe(false)
  })

  it('should be false when email not verified even with high score', () => {
    expect(isLeadWorthy({
      eventType: 'page_view',
      deliverabilityScore: 95,
      hasVerifiedEmail: false,
      hasBusinessEmail: true,
      hasPhone: true,
      hasName: true,
    })).toBe(false)
  })

  it('should be false when name is missing even with verified email + high score', () => {
    expect(isLeadWorthy({
      eventType: 'page_view',
      deliverabilityScore: 80,
      hasVerifiedEmail: true,
      hasBusinessEmail: true,
      hasPhone: false,
      hasName: false,
    })).toBe(false)
  })

  it('should be false for score below threshold', () => {
    expect(isLeadWorthy({
      eventType: 'page_view',
      deliverabilityScore: 59,
      hasVerifiedEmail: true,
      hasBusinessEmail: true,
      hasPhone: true,
      hasName: true,
    })).toBe(false)
  })

  it('should use threshold of 60', () => {
    expect(LEAD_CREATION_SCORE_THRESHOLD).toBe(60)
  })
})

// ==========================================================================
// EMAIL VERIFICATION & NAME SANITIZATION
// ==========================================================================
describe('isVerifiedEmail', () => {
  it('should return true for valid(esp)', () => {
    expect(isVerifiedEmail('valid (esp)')).toBe(true)
    expect(isVerifiedEmail('valid(esp)')).toBe(true)
    expect(isVerifiedEmail('VALID (ESP)')).toBe(true)
  })

  it('should return true for valid', () => {
    expect(isVerifiedEmail('valid')).toBe(true)
  })

  it('should return false for catch-all', () => {
    expect(isVerifiedEmail('catch-all')).toBe(false)
  })

  it('should return false for unknown or null', () => {
    expect(isVerifiedEmail('unknown')).toBe(false)
    expect(isVerifiedEmail(null)).toBe(false)
    expect(isVerifiedEmail(undefined)).toBe(false)
  })
})

describe('sanitizeName', () => {
  it('should return null for single letters', () => {
    expect(sanitizeName('d')).toBe(null)
    expect(sanitizeName('m')).toBe(null)
    expect(sanitizeName('j')).toBe(null)
  })

  it('should return null for known junk values', () => {
    expect(sanitizeName('test')).toBe(null)
    expect(sanitizeName('admin')).toBe(null)
    expect(sanitizeName('unknown')).toBe(null)
    expect(sanitizeName('n/a')).toBe(null)
  })

  it('should return the name for real names', () => {
    expect(sanitizeName('John')).toBe('John')
    expect(sanitizeName('Smith')).toBe('Smith')
    expect(sanitizeName('  Jane  ')).toBe('Jane')
  })

  it('should return null for null/undefined/empty', () => {
    expect(sanitizeName(null)).toBe(null)
    expect(sanitizeName(undefined)).toBe(null)
    expect(sanitizeName('')).toBe(null)
  })
})

// ==========================================================================
// PAYLOAD NORMALIZATION
// ==========================================================================
describe('normalizeALPayload', () => {
  it('should extract UPPER_CASE fields from enriched event', () => {
    const result = normalizeALPayload({
      profile_id: 'prof-001',
      uid: 'uid-001',
      hem_sha256: 'abc123',
      FIRST_NAME: 'John',
      LAST_NAME: 'Doe',
      PERSONAL_EMAILS: 'john@gmail.com',
      BUSINESS_EMAILS: 'john@acme.com',
      PERSONAL_PHONE: '+15551234567',
      COMPANY_NAME: 'Acme Corp',
      COMPANY_DOMAIN: 'acme.com',
      JOB_TITLE: 'VP Marketing',
      PERSONAL_CITY: 'Austin',
      STATE: 'TX',
      ZIP: '78701',
    })

    expect(result.profile_id).toBe('prof-001')
    expect(result.uid).toBe('uid-001')
    expect(result.hem_sha256).toBe('abc123')
    expect(result.first_name).toBe('John')
    expect(result.last_name).toBe('Doe')
    expect(result.personal_emails).toContain('john@gmail.com')
    expect(result.business_emails).toContain('john@acme.com')
    expect(result.phones.length).toBeGreaterThan(0)
    expect(result.company_name).toBe('Acme Corp')
    expect(result.company_domain).toBe('acme.com')
    expect(result.job_title).toBe('VP Marketing')
    expect(result.city).toBe('Austin')
    expect(result.state).toBe('TX')
    expect(result.zip).toBe('78701')
  })

  it('should extract lowercase fields from audiencesync event', () => {
    const result = normalizeALPayload({
      email: 'sync@company.com',
      first_name: 'Sync',
      last_name: 'User',
      company: 'SyncCorp',
      phone: '+15559876543',
    })

    expect(result.primary_email).toBe('sync@company.com')
    expect(result.first_name).toBe('Sync')
    expect(result.last_name).toBe('User')
    expect(result.company_name).toBe('SyncCorp')
    // normalizePhone strips + prefix — check normalized form
    expect(result.phones.length).toBeGreaterThan(0)
    expect(result.phones[0]).toContain('5559876543')
  })

  it('should handle auth event with email_raw', () => {
    const result = normalizeALPayload({
      event: 'authentication',
      email_raw: 'User@Example.com',
      cookie_id: 'abc',
    })

    expect(result.primary_email).toBe('user@example.com')
    expect(result.personal_emails).toContain('user@example.com')
  })

  it('should parse comma-separated emails', () => {
    const result = normalizeALPayload({
      PERSONAL_EMAILS: 'alice@gmail.com, bob@gmail.com, charlie@gmail.com',
    })

    expect(result.personal_emails).toHaveLength(3)
    expect(result.personal_emails).toContain('alice@gmail.com')
    expect(result.personal_emails).toContain('bob@gmail.com')
    expect(result.personal_emails).toContain('charlie@gmail.com')
  })

  it('should parse comma-separated business emails', () => {
    const result = normalizeALPayload({
      BUSINESS_EMAILS: 'alice@acme.com, bob@acme.com',
    })

    expect(result.business_emails).toHaveLength(2)
  })

  it('should select primary email by validation priority', () => {
    const result = normalizeALPayload({
      PERSONAL_EMAILS: 'personal@gmail.com',
      BUSINESS_EMAILS: 'biz@acme.com',
      PERSONAL_EMAIL_VALIDATION_STATUS: 'unknown',
      BUSINESS_EMAIL_VALIDATION_STATUS: 'Valid (Esp)',
    })

    // Business email has higher validation score, should be primary
    expect(result.primary_email).toBe('biz@acme.com')
  })

  it('should return null primary_email when no emails present', () => {
    const result = normalizeALPayload({
      profile_id: 'prof-no-email',
      FIRST_NAME: 'NoEmail',
    })

    expect(result.primary_email).toBeNull()
    expect(result.personal_emails).toHaveLength(0)
    expect(result.business_emails).toHaveLength(0)
  })

  it('should extract fields from nested resolution object', () => {
    const result = normalizeALPayload({
      profile_id: 'prof-nested',
      resolution: {
        FIRST_NAME: 'Nested',
        LAST_NAME: 'User',
        PERSONAL_EMAILS: 'nested@example.com',
        COMPANY_NAME: 'Nested Corp',
      },
    })

    expect(result.first_name).toBe('Nested')
    expect(result.last_name).toBe('User')
    expect(result.personal_emails).toContain('nested@example.com')
    expect(result.company_name).toBe('Nested Corp')
  })

  it('should extract fields from nested event_data object', () => {
    const result = normalizeALPayload({
      event_data: {
        FIRST_NAME: 'EventData',
        PERSONAL_EMAILS: 'evdata@example.com',
      },
    })

    expect(result.first_name).toBe('EventData')
    expect(result.personal_emails).toContain('evdata@example.com')
  })

  it('should extract fields from nested event.data object', () => {
    const result = normalizeALPayload({
      event: {
        data: {
          FIRST_NAME: 'DeepNested',
          PERSONAL_EMAILS: 'deep@example.com',
        },
      },
    })

    expect(result.first_name).toBe('DeepNested')
    expect(result.personal_emails).toContain('deep@example.com')
  })

  it('should prefer top-level fields over nested ones', () => {
    const result = normalizeALPayload({
      FIRST_NAME: 'TopLevel',
      resolution: {
        FIRST_NAME: 'Nested',
      },
    })

    expect(result.first_name).toBe('TopLevel')
  })

  it('should compute deliverability score', () => {
    const result = normalizeALPayload({
      PERSONAL_EMAILS: 'test@gmail.com',
      PERSONAL_EMAIL_VALIDATION_STATUS: 'Valid',
    })

    expect(result.deliverability_score).toBe(30) // Valid = 30
  })

  it('should handle hem field as fallback for hem_sha256', () => {
    const result = normalizeALPayload({
      hem: 'hemhash123',
    })

    expect(result.hem_sha256).toBe('hemhash123')
  })

  it('should deduplicate phones', () => {
    const result = normalizeALPayload({
      PERSONAL_PHONE: '+15551234567',
      MOBILE_PHONE_DNC: '+15551234567',
    })

    expect(result.phones).toHaveLength(1)
  })

  it('should filter out invalid email strings', () => {
    const result = normalizeALPayload({
      PERSONAL_EMAILS: 'valid@example.com, notanemail, also@valid.com',
    })

    expect(result.personal_emails).toHaveLength(2)
    expect(result.personal_emails).toContain('valid@example.com')
    expect(result.personal_emails).toContain('also@valid.com')
  })

  it('should handle landing_url and referrer', () => {
    const result = normalizeALPayload({
      landing_url: 'https://meetcursive.com/pricing',
      referrer: 'https://google.com',
    })

    expect(result.landing_url).toBe('https://meetcursive.com/pricing')
    expect(result.referrer).toBe('https://google.com')
  })
})

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================
describe('extractEventType', () => {
  it('should extract from event key', () => {
    expect(extractEventType({ event: 'authentication' })).toBe('authentication')
  })

  it('should extract from event_type key', () => {
    expect(extractEventType({ event_type: 'page_view' })).toBe('page_view')
  })

  it('should extract from type key', () => {
    expect(extractEventType({ type: 'deep_scroll' })).toBe('deep_scroll')
  })

  it('should prefer event over event_type over type', () => {
    expect(extractEventType({
      event: 'authentication',
      event_type: 'page_view',
      type: 'deep_scroll',
    })).toBe('authentication')
  })

  it('should return unknown for empty payload', () => {
    expect(extractEventType({})).toBe('unknown')
  })
})

describe('extractIpAddress', () => {
  it('should extract from ip_address key', () => {
    expect(extractIpAddress({ ip_address: '1.2.3.4' })).toBe('1.2.3.4')
  })

  it('should extract from ip key', () => {
    expect(extractIpAddress({ ip: '5.6.7.8' })).toBe('5.6.7.8')
  })

  it('should return null when no IP present', () => {
    expect(extractIpAddress({})).toBeNull()
  })
})

describe('unwrapWebhookPayload', () => {
  it('should return array as-is', () => {
    const events = [{ event: 'a' }, { event: 'b' }]
    expect(unwrapWebhookPayload(events)).toEqual(events)
  })

  it('should unwrap result array', () => {
    const payload = { result: [{ event: 'a' }, { event: 'b' }] }
    expect(unwrapWebhookPayload(payload)).toEqual([{ event: 'a' }, { event: 'b' }])
  })

  it('should wrap single object in array', () => {
    const payload = { event: 'a' }
    expect(unwrapWebhookPayload(payload)).toEqual([{ event: 'a' }])
  })
})
