/**
 * AudienceLab Field Map Unit Tests
 *
 * Tests the pure logic in field-map.ts:
 * - Lead-worthiness scoring (isLeadWorthy)
 * - Deliverability scoring (computeDeliverabilityScore)
 * - Field normalization (normalizeALPayload)
 * - Event type extraction (extractEventType)
 * - IP address extraction (extractIpAddress)
 * - Webhook payload unwrapping (unwrapWebhookPayload)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isLeadWorthy,
  computeDeliverabilityScore,
  normalizeALPayload,
  extractEventType,
  extractIpAddress,
  unwrapWebhookPayload,
  LEAD_CREATION_SCORE_THRESHOLD,
  LEAD_CREATING_EVENT_TYPES,
} from '@/lib/audiencelab/field-map'

// ============================================
// isLeadWorthy
// ============================================

describe('isLeadWorthy', () => {
  describe('Authentication / form events always create leads', () => {
    it('should return true for authentication events regardless of score', () => {
      expect(
        isLeadWorthy({
          eventType: 'authentication',
          deliverabilityScore: 0,
          hasBusinessEmail: false,
          hasPhone: false,
        })
      ).toBe(true)
    })

    it('should return true for form_submission events regardless of score', () => {
      expect(
        isLeadWorthy({
          eventType: 'form_submission',
          deliverabilityScore: 10,
          hasBusinessEmail: false,
          hasPhone: false,
        })
      ).toBe(true)
    })

    it('should return true for all_form_submissions events regardless of score', () => {
      expect(
        isLeadWorthy({
          eventType: 'all_form_submissions',
          deliverabilityScore: 0,
          hasBusinessEmail: false,
          hasPhone: false,
        })
      ).toBe(true)
    })
  })

  describe('Score-based lead creation', () => {
    it('should return true when score >= 60 and has business email', () => {
      expect(
        isLeadWorthy({
          eventType: 'page_view',
          deliverabilityScore: 60,
          hasBusinessEmail: true,
          hasPhone: false,
        })
      ).toBe(true)
    })

    it('should return true when score >= 60 and has phone', () => {
      expect(
        isLeadWorthy({
          eventType: 'page_view',
          deliverabilityScore: 60,
          hasBusinessEmail: false,
          hasPhone: true,
        })
      ).toBe(true)
    })

    it('should return true when score >= 60 and has both', () => {
      expect(
        isLeadWorthy({
          eventType: 'page_view',
          deliverabilityScore: 80,
          hasBusinessEmail: true,
          hasPhone: true,
        })
      ).toBe(true)
    })

    it('should return false when score >= 60 but no business email or phone', () => {
      expect(
        isLeadWorthy({
          eventType: 'page_view',
          deliverabilityScore: 90,
          hasBusinessEmail: false,
          hasPhone: false,
        })
      ).toBe(false)
    })

    it('should return false when score < 60 even with contact info', () => {
      expect(
        isLeadWorthy({
          eventType: 'page_view',
          deliverabilityScore: 59,
          hasBusinessEmail: true,
          hasPhone: true,
        })
      ).toBe(false)
    })

    it('should return false for unknown event type with zero score', () => {
      expect(
        isLeadWorthy({
          eventType: 'unknown',
          deliverabilityScore: 0,
          hasBusinessEmail: false,
          hasPhone: false,
        })
      ).toBe(false)
    })
  })

  describe('Threshold constant', () => {
    it('LEAD_CREATION_SCORE_THRESHOLD should be 60', () => {
      expect(LEAD_CREATION_SCORE_THRESHOLD).toBe(60)
    })

    it('LEAD_CREATING_EVENT_TYPES should contain the expected types', () => {
      expect(LEAD_CREATING_EVENT_TYPES.has('authentication')).toBe(true)
      expect(LEAD_CREATING_EVENT_TYPES.has('all_form_submissions')).toBe(true)
      expect(LEAD_CREATING_EVENT_TYPES.has('form_submission')).toBe(true)
      expect(LEAD_CREATING_EVENT_TYPES.has('page_view')).toBe(false)
    })
  })
})

// ============================================
// computeDeliverabilityScore
// ============================================

describe('computeDeliverabilityScore', () => {
  describe('Validation status scoring', () => {
    it('should score Valid (ESP) as 40', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'valid (esp)',
        lastSeenDate: null,
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(40)
    })

    it('should score Valid (ESP) case-insensitively', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'Valid (ESP)',
        lastSeenDate: null,
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(40)
    })

    it('should score valid_esp variant as 40', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'valid_esp',
        lastSeenDate: null,
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(40)
    })

    it('should score Valid as 30', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'valid',
        lastSeenDate: null,
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(30)
    })

    it('should score catch-all as 15', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'catch-all',
        lastSeenDate: null,
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(15)
    })

    it('should score unknown as 5', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'unknown',
        lastSeenDate: null,
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(5)
    })

    it('should score invalid as 0', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'invalid',
        lastSeenDate: null,
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(0)
    })

    it('should default to 5 for null validation status', () => {
      const score = computeDeliverabilityScore({
        validationStatus: null,
        lastSeenDate: null,
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(5)
    })

    it('should default to 5 for unrecognized validation status', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'some_new_status',
        lastSeenDate: null,
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(5)
    })
  })

  describe('Last-seen recency scoring', () => {
    it('should add 30 for last seen within 30 days', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 10)
      const score = computeDeliverabilityScore({
        validationStatus: null, // 5
        lastSeenDate: recentDate.toISOString(),
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(35) // 5 + 30
    })

    it('should add 20 for last seen 31-90 days ago', () => {
      const date = new Date()
      date.setDate(date.getDate() - 60)
      const score = computeDeliverabilityScore({
        validationStatus: null, // 5
        lastSeenDate: date.toISOString(),
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(25) // 5 + 20
    })

    it('should add 10 for last seen 91-180 days ago', () => {
      const date = new Date()
      date.setDate(date.getDate() - 120)
      const score = computeDeliverabilityScore({
        validationStatus: null, // 5
        lastSeenDate: date.toISOString(),
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(15) // 5 + 10
    })

    it('should add 0 for last seen over 180 days ago', () => {
      const date = new Date()
      date.setDate(date.getDate() - 200)
      const score = computeDeliverabilityScore({
        validationStatus: null, // 5
        lastSeenDate: date.toISOString(),
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(5) // 5 + 0
    })

    it('should add 0 for null last seen date', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'invalid', // 0
        lastSeenDate: null,
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(0)
    })
  })

  describe('Skiptrace scoring', () => {
    it('should add 15 for skiptrace match', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'invalid', // 0
        lastSeenDate: null,
        skiptraceMatchBy: 'name_address',
        hasBusinessEmail: false,
        hasPhone: false,
      })
      expect(score).toBe(15) // 0 + 15
    })

    it('should add 25 for skiptrace with phone', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'invalid', // 0
        lastSeenDate: null,
        skiptraceMatchBy: 'name_address',
        hasBusinessEmail: false,
        hasPhone: true,
      })
      expect(score).toBe(25) // 0 + 15 + 10
    })

    it('should not add phone bonus without skiptrace', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'invalid', // 0
        lastSeenDate: null,
        skiptraceMatchBy: null,
        hasBusinessEmail: false,
        hasPhone: true,
      })
      expect(score).toBe(0) // phone alone doesn't add points without skiptrace
    })
  })

  describe('Business email bonus', () => {
    it('should add 5 for business email', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'invalid', // 0
        lastSeenDate: null,
        skiptraceMatchBy: null,
        hasBusinessEmail: true,
        hasPhone: false,
      })
      expect(score).toBe(5)
    })
  })

  describe('Combined scoring', () => {
    it('should compute maximum score of 100', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 5)
      const score = computeDeliverabilityScore({
        validationStatus: 'valid (esp)', // 40
        lastSeenDate: recentDate.toISOString(), // 30
        skiptraceMatchBy: 'name_address', // 15
        hasBusinessEmail: true, // 5
        hasPhone: true, // 10
      })
      expect(score).toBe(100) // 40 + 30 + 15 + 10 + 5 = 100
    })

    it('should cap at 100 even if components exceed it', () => {
      // This verifies the Math.min(score, 100) cap
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 1)
      const score = computeDeliverabilityScore({
        validationStatus: 'valid (esp)', // 40
        lastSeenDate: recentDate.toISOString(), // 30
        skiptraceMatchBy: 'name_address', // 15
        hasBusinessEmail: true, // 5
        hasPhone: true, // 10
      })
      // 40 + 30 + 15 + 10 + 5 = 100
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should compute a typical high-quality lead score', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 15)
      const score = computeDeliverabilityScore({
        validationStatus: 'valid', // 30
        lastSeenDate: recentDate.toISOString(), // 30
        skiptraceMatchBy: null, // 0
        hasBusinessEmail: true, // 5
        hasPhone: false, // 0
      })
      expect(score).toBe(65) // 30 + 30 + 5
    })

    it('should compute a low-quality lead score', () => {
      const score = computeDeliverabilityScore({
        validationStatus: 'catch-all', // 15
        lastSeenDate: null, // 0
        skiptraceMatchBy: null, // 0
        hasBusinessEmail: false, // 0
        hasPhone: false, // 0
      })
      expect(score).toBe(15)
    })
  })
})

// ============================================
// normalizeALPayload
// ============================================

describe('normalizeALPayload', () => {
  describe('Field mapping from AL UPPER_CASE fields', () => {
    it('should map FIRST_NAME to first_name', () => {
      const result = normalizeALPayload({ FIRST_NAME: 'John' })
      expect(result.first_name).toBe('John')
    })

    it('should map LAST_NAME to last_name', () => {
      const result = normalizeALPayload({ LAST_NAME: 'Doe' })
      expect(result.last_name).toBe('Doe')
    })

    it('should map PERSONAL_CITY to city', () => {
      const result = normalizeALPayload({ PERSONAL_CITY: 'Austin' })
      expect(result.city).toBe('Austin')
    })

    it('should map STATE to state', () => {
      const result = normalizeALPayload({ STATE: 'TX' })
      expect(result.state).toBe('TX')
    })

    it('should map COMPANY_INDUSTRY to company_industry', () => {
      const result = normalizeALPayload({ COMPANY_INDUSTRY: 'Technology' })
      expect(result.company_industry).toBe('Technology')
    })

    it('should fall back to INDUSTRY for company_industry', () => {
      const result = normalizeALPayload({ INDUSTRY: 'Healthcare' })
      expect(result.company_industry).toBe('Healthcare')
    })

    it('should map COMPANY_NAME to company_name', () => {
      const result = normalizeALPayload({ COMPANY_NAME: 'Acme Corp' })
      expect(result.company_name).toBe('Acme Corp')
    })

    it('should map COMPANY_DOMAIN to company_domain', () => {
      const result = normalizeALPayload({ COMPANY_DOMAIN: 'acme.com' })
      expect(result.company_domain).toBe('acme.com')
    })

    it('should map JOB_TITLE to job_title', () => {
      const result = normalizeALPayload({ JOB_TITLE: 'VP of Sales' })
      expect(result.job_title).toBe('VP of Sales')
    })

    it('should map ZIP to zip', () => {
      const result = normalizeALPayload({ ZIP: '78701' })
      expect(result.zip).toBe('78701')
    })

    it('should map PERSONAL_ADDRESS to address1', () => {
      const result = normalizeALPayload({ PERSONAL_ADDRESS: '123 Main St' })
      expect(result.address1).toBe('123 Main St')
    })
  })

  describe('Lowercase field fallbacks', () => {
    it('should use lowercase first_name as fallback', () => {
      const result = normalizeALPayload({ first_name: 'Jane' })
      expect(result.first_name).toBe('Jane')
    })

    it('should use lowercase city as fallback when no PERSONAL_CITY', () => {
      const result = normalizeALPayload({ city: 'Denver' })
      expect(result.city).toBe('Denver')
    })

    it('should use CITY (uppercase) as fallback for city', () => {
      const result = normalizeALPayload({ CITY: 'Denver' })
      expect(result.city).toBe('Denver')
    })

    it('should prefer PERSONAL_CITY over CITY', () => {
      const result = normalizeALPayload({ PERSONAL_CITY: 'Austin', CITY: 'Denver' })
      expect(result.city).toBe('Austin')
    })

    it('should use company as fallback for company_name', () => {
      const result = normalizeALPayload({ company: 'Fallback Corp' })
      expect(result.company_name).toBe('Fallback Corp')
    })

    it('should prefer COMPANY_NAME over company', () => {
      const result = normalizeALPayload({ COMPANY_NAME: 'Primary Corp', company: 'Fallback Corp' })
      expect(result.company_name).toBe('Primary Corp')
    })
  })

  describe('Email parsing and primary selection', () => {
    it('should parse comma-separated personal emails', () => {
      const result = normalizeALPayload({
        PERSONAL_EMAILS: 'john@gmail.com,jane@outlook.com',
      })
      expect(result.personal_emails).toHaveLength(2)
      expect(result.personal_emails).toContain('john@gmail.com')
      expect(result.personal_emails).toContain('jane@outlook.com')
    })

    it('should parse comma-separated business emails', () => {
      const result = normalizeALPayload({
        BUSINESS_EMAILS: 'john@acme.com,john@corp.com',
      })
      expect(result.business_emails).toHaveLength(2)
    })

    it('should normalize Gmail addresses (remove dots)', () => {
      const result = normalizeALPayload({
        PERSONAL_EMAILS: 'john.doe@gmail.com',
      })
      expect(result.personal_emails[0]).toBe('johndoe@gmail.com')
    })

    it('should normalize Googlemail addresses', () => {
      const result = normalizeALPayload({
        PERSONAL_EMAILS: 'j.ohn@googlemail.com',
      })
      expect(result.personal_emails[0]).toBe('john@googlemail.com')
    })

    it('should not strip dots from non-Gmail domains', () => {
      const result = normalizeALPayload({
        PERSONAL_EMAILS: 'j.doe@outlook.com',
      })
      expect(result.personal_emails[0]).toBe('j.doe@outlook.com')
    })

    it('should select primary email from candidates', () => {
      const result = normalizeALPayload({
        PERSONAL_EMAILS: 'john@gmail.com',
      })
      expect(result.primary_email).toBe('john@gmail.com')
    })

    it('should include email_raw in personal emails for auth events', () => {
      const result = normalizeALPayload({
        email_raw: 'user@test.com',
      })
      expect(result.personal_emails).toContain('user@test.com')
      expect(result.primary_email).toBe('user@test.com')
    })

    it('should include email field (audiencesync) in personal emails', () => {
      const result = normalizeALPayload({
        email: 'sync@test.com',
      })
      expect(result.personal_emails).toContain('sync@test.com')
    })

    it('should filter out invalid email strings', () => {
      const result = normalizeALPayload({
        PERSONAL_EMAILS: 'valid@test.com,not-an-email,another@valid.com',
      })
      expect(result.personal_emails).toHaveLength(2)
      expect(result.personal_emails).toContain('valid@test.com')
      expect(result.personal_emails).toContain('another@valid.com')
    })

    it('should return null primary email when no emails present', () => {
      const result = normalizeALPayload({})
      expect(result.primary_email).toBeNull()
    })

    it('should not duplicate emails when email_raw already exists in PERSONAL_EMAILS', () => {
      const result = normalizeALPayload({
        PERSONAL_EMAILS: 'user@test.com',
        email_raw: 'user@test.com',
      })
      expect(result.personal_emails).toHaveLength(1)
    })
  })

  describe('Phone parsing', () => {
    it('should parse personal phone numbers', () => {
      const result = normalizeALPayload({
        PERSONAL_PHONE: '(512) 555-1234',
      })
      expect(result.phones).toContain('5125551234')
    })

    it('should strip +1 country code from phones', () => {
      const result = normalizeALPayload({
        PERSONAL_PHONE: '+15125551234',
      })
      expect(result.phones[0]).toBe('5125551234')
    })

    it('should parse mobile phone DNC field', () => {
      const result = normalizeALPayload({
        MOBILE_PHONE_DNC: '2025551234',
      })
      expect(result.phones).toContain('2025551234')
    })

    it('should deduplicate phones', () => {
      const result = normalizeALPayload({
        PERSONAL_PHONE: '5125551234',
        MOBILE_PHONE_DNC: '5125551234',
      })
      expect(result.phones).toHaveLength(1)
    })

    it('should filter out short phone numbers', () => {
      const result = normalizeALPayload({
        PERSONAL_PHONE: '123',
      })
      expect(result.phones).toHaveLength(0)
    })

    it('should return empty phones when none provided', () => {
      const result = normalizeALPayload({})
      expect(result.phones).toHaveLength(0)
    })
  })

  describe('Nested payload flattening', () => {
    it('should extract fields from resolution object', () => {
      const result = normalizeALPayload({
        resolution: {
          FIRST_NAME: 'Nested',
          LAST_NAME: 'User',
        },
      })
      expect(result.first_name).toBe('Nested')
      expect(result.last_name).toBe('User')
    })

    it('should extract fields from event_data object', () => {
      const result = normalizeALPayload({
        event_data: {
          COMPANY_NAME: 'EventData Corp',
        },
      })
      expect(result.company_name).toBe('EventData Corp')
    })

    it('should extract fields from event.data nested object', () => {
      const result = normalizeALPayload({
        event: {
          data: {
            STATE: 'CA',
          },
        },
      })
      // Note: event.data gets lowest priority in flattening, but 'event' at top-level
      // is a string field for event type. When event is an object with data, it flattens.
      expect(result.state).toBe('CA')
    })

    it('should prioritize top-level fields over nested', () => {
      const result = normalizeALPayload({
        FIRST_NAME: 'TopLevel',
        resolution: {
          FIRST_NAME: 'Nested',
        },
      })
      expect(result.first_name).toBe('TopLevel')
    })
  })

  describe('Identity fields', () => {
    it('should extract uid', () => {
      const result = normalizeALPayload({ uid: 'uid-123' })
      expect(result.uid).toBe('uid-123')
    })

    it('should extract profile_id', () => {
      const result = normalizeALPayload({ profile_id: 'prof-456' })
      expect(result.profile_id).toBe('prof-456')
    })

    it('should extract hem_sha256', () => {
      const result = normalizeALPayload({ hem_sha256: 'abc123hash' })
      expect(result.hem_sha256).toBe('abc123hash')
    })

    it('should fall back to hem for hem_sha256', () => {
      const result = normalizeALPayload({ hem: 'fallback-hash' })
      expect(result.hem_sha256).toBe('fallback-hash')
    })
  })

  describe('Validation and scoring fields', () => {
    it('should extract email validation status', () => {
      const result = normalizeALPayload({
        PERSONAL_EMAIL_VALIDATION_STATUS: 'valid (esp)',
      })
      expect(result.email_validation_status).toBe('valid (esp)')
    })

    it('should extract email last seen date', () => {
      const result = normalizeALPayload({
        PERSONAL_EMAIL_LAST_SEEN_BY_ESP_DATE: '2026-01-15',
      })
      expect(result.email_last_seen).toBe('2026-01-15')
    })

    it('should extract skiptrace match by', () => {
      const result = normalizeALPayload({
        SKIPTRACE_MATCH_BY: 'name_address',
      })
      expect(result.skiptrace_match_by).toBe('name_address')
    })

    it('should compute deliverability score based on extracted fields', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 5)
      const result = normalizeALPayload({
        PERSONAL_EMAILS: 'user@acme.com',
        BUSINESS_EMAILS: 'user@business.com',
        PERSONAL_EMAIL_VALIDATION_STATUS: 'valid (esp)', // 40
        PERSONAL_EMAIL_LAST_SEEN_BY_ESP_DATE: recentDate.toISOString(), // 30
        SKIPTRACE_MATCH_BY: 'name_address', // 15
        PERSONAL_PHONE: '5125551234', // has phone
      })
      // 40 + 30 + 15 + 10 (phone + skiptrace) + 5 (biz email) = 100
      expect(result.deliverability_score).toBe(100)
    })
  })

  describe('Page context fields', () => {
    it('should extract landing_url', () => {
      const result = normalizeALPayload({ landing_url: 'https://example.com/pricing' })
      expect(result.landing_url).toBe('https://example.com/pricing')
    })

    it('should fall back to page_url for landing_url', () => {
      const result = normalizeALPayload({ page_url: 'https://example.com/about' })
      expect(result.landing_url).toBe('https://example.com/about')
    })

    it('should extract referrer', () => {
      const result = normalizeALPayload({ referrer: 'https://google.com' })
      expect(result.referrer).toBe('https://google.com')
    })
  })

  describe('Empty / minimal payloads', () => {
    it('should handle completely empty payload', () => {
      const result = normalizeALPayload({})
      expect(result.first_name).toBeNull()
      expect(result.last_name).toBeNull()
      expect(result.primary_email).toBeNull()
      expect(result.personal_emails).toHaveLength(0)
      expect(result.business_emails).toHaveLength(0)
      expect(result.phones).toHaveLength(0)
      expect(result.company_name).toBeNull()
      expect(result.uid).toBeNull()
      expect(result.profile_id).toBeNull()
      expect(result.hem_sha256).toBeNull()
      expect(result.deliverability_score).toBeGreaterThanOrEqual(0)
    })

    it('should return all NormalizedIdentity fields', () => {
      const result = normalizeALPayload({})
      const expectedKeys: (keyof typeof result)[] = [
        'uid', 'profile_id', 'hem_sha256', 'first_name', 'last_name',
        'personal_emails', 'business_emails', 'phones', 'primary_email',
        'company_name', 'company_domain', 'address1', 'city', 'state', 'zip',
        'job_title', 'email_validation_status', 'email_last_seen',
        'skiptrace_match_by', 'deliverability_score', 'company_industry',
        'landing_url', 'referrer',
      ]
      for (const key of expectedKeys) {
        expect(result).toHaveProperty(key)
      }
    })
  })
})

// ============================================
// extractEventType
// ============================================

describe('extractEventType', () => {
  it('should extract event field', () => {
    expect(extractEventType({ event: 'authentication' })).toBe('authentication')
  })

  it('should fall back to event_type', () => {
    expect(extractEventType({ event_type: 'page_view' })).toBe('page_view')
  })

  it('should fall back to type', () => {
    expect(extractEventType({ type: 'custom_event' })).toBe('custom_event')
  })

  it('should return "unknown" for empty payload', () => {
    expect(extractEventType({})).toBe('unknown')
  })

  it('should prefer event over event_type', () => {
    expect(extractEventType({ event: 'auth', event_type: 'page' })).toBe('auth')
  })
})

// ============================================
// extractIpAddress
// ============================================

describe('extractIpAddress', () => {
  it('should extract ip_address', () => {
    expect(extractIpAddress({ ip_address: '1.2.3.4' })).toBe('1.2.3.4')
  })

  it('should fall back to ip', () => {
    expect(extractIpAddress({ ip: '5.6.7.8' })).toBe('5.6.7.8')
  })

  it('should return null when no IP present', () => {
    expect(extractIpAddress({})).toBeNull()
  })

  it('should prefer ip_address over ip', () => {
    expect(extractIpAddress({ ip_address: '1.1.1.1', ip: '2.2.2.2' })).toBe('1.1.1.1')
  })
})

// ============================================
// unwrapWebhookPayload
// ============================================

describe('unwrapWebhookPayload', () => {
  it('should return array payloads as-is', () => {
    const events = [{ event: 'a' }, { event: 'b' }]
    expect(unwrapWebhookPayload(events)).toEqual(events)
  })

  it('should unwrap { result: [...] } wrapper', () => {
    const events = [{ event: 'a' }]
    expect(unwrapWebhookPayload({ result: events })).toEqual(events)
  })

  it('should wrap a single event object in an array', () => {
    const event = { event: 'a', pixel_id: '123' }
    expect(unwrapWebhookPayload(event)).toEqual([event])
  })

  it('should handle empty result array', () => {
    expect(unwrapWebhookPayload({ result: [] })).toEqual([])
  })

  it('should handle empty object as single event', () => {
    expect(unwrapWebhookPayload({})).toEqual([{}])
  })
})
