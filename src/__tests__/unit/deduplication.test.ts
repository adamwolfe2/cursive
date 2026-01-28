/**
 * Deduplication Service Unit Tests
 *
 * Tests hash calculation for lead deduplication.
 * Critical: Canonical vs slightly varied inputs must produce same/different hashes.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateHashKey,
  normalizeEmail,
  normalizePhone,
  extractDomainFromEmail,
} from '@/lib/services/deduplication.service'

describe('Deduplication Service', () => {
  // ==========================================================================
  // EMAIL NORMALIZATION
  // ==========================================================================
  describe('normalizeEmail', () => {
    it('should lowercase emails', () => {
      expect(normalizeEmail('John.Doe@Company.com')).toBe('john.doe@company.com')
    })

    it('should trim whitespace', () => {
      expect(normalizeEmail('  john@company.com  ')).toBe('john@company.com')
    })

    it('should remove dots from Gmail addresses (dot-blindness)', () => {
      expect(normalizeEmail('j.o.h.n.doe@gmail.com')).toBe('johndoe@gmail.com')
      expect(normalizeEmail('john.doe@googlemail.com')).toBe('johndoe@googlemail.com')
    })

    it('should NOT remove dots from non-Gmail addresses', () => {
      expect(normalizeEmail('john.doe@company.com')).toBe('john.doe@company.com')
    })

    it('should handle empty strings', () => {
      expect(normalizeEmail('')).toBe('')
    })

    it('should handle malformed emails gracefully', () => {
      expect(normalizeEmail('notanemail')).toBe('notanemail')
    })
  })

  // ==========================================================================
  // PHONE NORMALIZATION
  // ==========================================================================
  describe('normalizePhone', () => {
    it('should extract digits only', () => {
      expect(normalizePhone('(555) 123-4567')).toBe('5551234567')
      expect(normalizePhone('555.123.4567')).toBe('5551234567')
      expect(normalizePhone('555-123-4567')).toBe('5551234567')
    })

    it('should remove leading 1 from 11-digit US numbers', () => {
      expect(normalizePhone('1-555-123-4567')).toBe('5551234567')
      expect(normalizePhone('+1 (555) 123-4567')).toBe('5551234567')
    })

    it('should keep 10-digit numbers unchanged', () => {
      expect(normalizePhone('555-123-4567')).toBe('5551234567')
    })

    it('should handle null/undefined', () => {
      expect(normalizePhone(null)).toBe('')
      expect(normalizePhone(undefined)).toBe('')
    })

    it('should handle empty strings', () => {
      expect(normalizePhone('')).toBe('')
    })
  })

  // ==========================================================================
  // DOMAIN EXTRACTION
  // ==========================================================================
  describe('extractDomainFromEmail', () => {
    it('should extract domain from email', () => {
      expect(extractDomainFromEmail('john@company.com')).toBe('company.com')
    })

    it('should lowercase domain', () => {
      expect(extractDomainFromEmail('john@COMPANY.COM')).toBe('company.com')
    })

    it('should handle empty strings', () => {
      expect(extractDomainFromEmail('')).toBe('')
    })

    it('should handle malformed emails', () => {
      expect(extractDomainFromEmail('notanemail')).toBe('')
    })
  })

  // ==========================================================================
  // HASH KEY CALCULATION - CANONICAL TESTS
  // ==========================================================================
  describe('calculateHashKey - Canonical Matching', () => {
    it('should produce same hash for identical inputs', () => {
      const hash1 = calculateHashKey('john@company.com', 'company.com', '5551234567')
      const hash2 = calculateHashKey('john@company.com', 'company.com', '5551234567')
      expect(hash1).toBe(hash2)
    })

    it('should produce same hash for case variations in email', () => {
      const hash1 = calculateHashKey('john@company.com', 'company.com', '5551234567')
      const hash2 = calculateHashKey('JOHN@COMPANY.COM', 'company.com', '5551234567')
      expect(hash1).toBe(hash2)
    })

    it('should produce same hash for case variations in domain', () => {
      const hash1 = calculateHashKey('john@company.com', 'company.com', '5551234567')
      const hash2 = calculateHashKey('john@company.com', 'COMPANY.COM', '5551234567')
      expect(hash1).toBe(hash2)
    })

    it('should produce same hash for phone format variations', () => {
      const hash1 = calculateHashKey('john@company.com', 'company.com', '5551234567')
      const hash2 = calculateHashKey('john@company.com', 'company.com', '(555) 123-4567')
      const hash3 = calculateHashKey('john@company.com', 'company.com', '555.123.4567')
      const hash4 = calculateHashKey('john@company.com', 'company.com', '+1-555-123-4567')
      expect(hash1).toBe(hash2)
      expect(hash1).toBe(hash3)
      expect(hash1).toBe(hash4)
    })

    it('should produce same hash for whitespace variations', () => {
      const hash1 = calculateHashKey('john@company.com', 'company.com', '5551234567')
      const hash2 = calculateHashKey('  john@company.com  ', '  company.com  ', '5551234567')
      expect(hash1).toBe(hash2)
    })

    it('should produce same hash for Gmail dot variations', () => {
      const hash1 = calculateHashKey('johndoe@gmail.com', null, null)
      const hash2 = calculateHashKey('john.doe@gmail.com', null, null)
      const hash3 = calculateHashKey('j.o.h.n.d.o.e@gmail.com', null, null)
      expect(hash1).toBe(hash2)
      expect(hash1).toBe(hash3)
    })

    it('should use email domain when company domain is null', () => {
      const hash1 = calculateHashKey('john@company.com', null, '5551234567')
      const hash2 = calculateHashKey('john@company.com', 'company.com', '5551234567')
      expect(hash1).toBe(hash2)
    })
  })

  // ==========================================================================
  // HASH KEY CALCULATION - NON-MATCHING TESTS
  // ==========================================================================
  describe('calculateHashKey - Non-Matching', () => {
    it('should produce different hash for different emails', () => {
      const hash1 = calculateHashKey('john@company.com', 'company.com', '5551234567')
      const hash2 = calculateHashKey('jane@company.com', 'company.com', '5551234567')
      expect(hash1).not.toBe(hash2)
    })

    it('should produce different hash for different domains', () => {
      const hash1 = calculateHashKey('john@company.com', 'company.com', '5551234567')
      const hash2 = calculateHashKey('john@company.com', 'other.com', '5551234567')
      expect(hash1).not.toBe(hash2)
    })

    it('should produce different hash for different phones', () => {
      const hash1 = calculateHashKey('john@company.com', 'company.com', '5551234567')
      const hash2 = calculateHashKey('john@company.com', 'company.com', '5559876543')
      expect(hash1).not.toBe(hash2)
    })

    it('should differentiate similar but different emails', () => {
      const hash1 = calculateHashKey('johndoe@company.com', 'company.com', '5551234567')
      const hash2 = calculateHashKey('johndoe1@company.com', 'company.com', '5551234567')
      expect(hash1).not.toBe(hash2)
    })

    it('should NOT match Gmail dot variations for non-Gmail domains', () => {
      const hash1 = calculateHashKey('john.doe@company.com', 'company.com', null)
      const hash2 = calculateHashKey('johndoe@company.com', 'company.com', null)
      expect(hash1).not.toBe(hash2)
    })
  })

  // ==========================================================================
  // HASH KEY CALCULATION - EDGE CASES
  // ==========================================================================
  describe('calculateHashKey - Edge Cases', () => {
    it('should handle null phone', () => {
      const hash = calculateHashKey('john@company.com', 'company.com', null)
      expect(hash).toBeDefined()
      expect(hash.length).toBe(64) // SHA256 hex
    })

    it('should handle null domain and null phone', () => {
      const hash = calculateHashKey('john@company.com', null, null)
      expect(hash).toBeDefined()
      expect(hash.length).toBe(64)
    })

    it('should produce consistent hash format (64 hex chars)', () => {
      const hash = calculateHashKey('test@test.com', 'test.com', '1234567890')
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle international phone formats', () => {
      // Different formatting, same digits
      const hash1 = calculateHashKey('john@company.com', 'company.com', '+44 20 7946 0958')
      const hash2 = calculateHashKey('john@company.com', 'company.com', '442079460958')
      expect(hash1).toBe(hash2)
    })

    it('should handle empty string phone same as null', () => {
      const hash1 = calculateHashKey('john@company.com', 'company.com', '')
      const hash2 = calculateHashKey('john@company.com', 'company.com', null)
      expect(hash1).toBe(hash2)
    })
  })

  // ==========================================================================
  // DEDUPLICATION SCENARIOS
  // ==========================================================================
  describe('Real-World Deduplication Scenarios', () => {
    it('should deduplicate CRM export variations', () => {
      // Same person exported from different CRMs with different formatting
      const hash1 = calculateHashKey('John.Smith@AcmeCorp.com', 'acmecorp.com', '(555) 123-4567')
      const hash2 = calculateHashKey('john.smith@acmecorp.com', 'AcmeCorp.com', '555.123.4567')
      expect(hash1).toBe(hash2)
    })

    it('should deduplicate manual entry variations', () => {
      // Same person entered manually with typos in formatting
      const hash1 = calculateHashKey('  JANE@COMPANY.COM  ', 'company.com', '  555-999-1234  ')
      const hash2 = calculateHashKey('jane@company.com', 'company.com', '5559991234')
      expect(hash1).toBe(hash2)
    })

    it('should NOT deduplicate different people at same company', () => {
      const hashJohn = calculateHashKey('john@company.com', 'company.com', '5551111111')
      const hashJane = calculateHashKey('jane@company.com', 'company.com', '5552222222')
      expect(hashJohn).not.toBe(hashJane)
    })

    it('should NOT deduplicate same person at different companies', () => {
      const hash1 = calculateHashKey('john@company1.com', 'company1.com', '5551234567')
      const hash2 = calculateHashKey('john@company2.com', 'company2.com', '5551234567')
      expect(hash1).not.toBe(hash2)
    })
  })
})
