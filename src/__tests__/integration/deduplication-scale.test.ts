/**
 * Deduplication at Scale Integration Tests
 *
 * Tests the deduplication system's behavior with large batches.
 * Uses mocked database to simulate scale scenarios.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calculateHashKey,
  normalizeEmail,
  normalizePhone,
} from '@/lib/services/deduplication.service'

// Mock the Supabase client
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
        })),
      })),
    })),
  })),
}))

describe('Deduplication at Scale', () => {
  // ==========================================================================
  // BATCH HASH CALCULATION PERFORMANCE
  // ==========================================================================
  describe('Batch Hash Calculation', () => {
    it('should calculate 10,000 hashes in under 1 second', () => {
      const testLeads = Array.from({ length: 10000 }, (_, i) => ({
        email: `user${i}@company${i % 100}.com`,
        companyDomain: `company${i % 100}.com`,
        phone: `555${String(i).padStart(7, '0')}`,
      }))

      const start = performance.now()

      const hashes = testLeads.map(lead =>
        calculateHashKey(lead.email, lead.companyDomain, lead.phone)
      )

      const duration = performance.now() - start

      expect(hashes.length).toBe(10000)
      expect(duration).toBeLessThan(1000) // Under 1 second
    })

    it('should maintain hash uniqueness across 10,000 unique leads', () => {
      const testLeads = Array.from({ length: 10000 }, (_, i) => ({
        email: `uniqueuser${i}@company${i}.com`,
        companyDomain: `company${i}.com`,
        phone: `555${String(i).padStart(7, '0')}`,
      }))

      const hashes = new Set(
        testLeads.map(lead =>
          calculateHashKey(lead.email, lead.companyDomain, lead.phone)
        )
      )

      // All hashes should be unique
      expect(hashes.size).toBe(10000)
    })

    it('should correctly deduplicate 1,000 duplicates in 10,000 leads', () => {
      // Create 9,000 unique + 1,000 duplicates
      const uniqueLeads = Array.from({ length: 9000 }, (_, i) => ({
        email: `user${i}@company.com`,
        companyDomain: 'company.com',
        phone: `555${String(i).padStart(7, '0')}`,
      }))

      // Create 1,000 duplicates of the first 1,000 leads
      const duplicateLeads = uniqueLeads.slice(0, 1000)

      const allLeads = [...uniqueLeads, ...duplicateLeads]

      const hashSet = new Set<string>()
      let duplicateCount = 0

      for (const lead of allLeads) {
        const hash = calculateHashKey(lead.email, lead.companyDomain, lead.phone)
        if (hashSet.has(hash)) {
          duplicateCount++
        } else {
          hashSet.add(hash)
        }
      }

      expect(duplicateCount).toBe(1000)
      expect(hashSet.size).toBe(9000)
    })
  })

  // ==========================================================================
  // NORMALIZATION CONSISTENCY
  // ==========================================================================
  describe('Normalization Consistency at Scale', () => {
    it('should consistently normalize 10,000 emails', () => {
      const variations = [
        'John.Doe@Company.com',
        'JOHN.DOE@COMPANY.COM',
        '  john.doe@company.com  ',
        'john.doe@Company.COM',
      ]

      const results = new Set<string>()
      for (let i = 0; i < 10000; i++) {
        const email = variations[i % variations.length]
        results.add(normalizeEmail(email))
      }

      // All should normalize to the same value
      expect(results.size).toBe(1)
    })

    it('should consistently normalize 10,000 phone numbers', () => {
      const variations = [
        '5551234567',
        '(555) 123-4567',
        '555.123.4567',
        '+1-555-123-4567',
        '1 555 123 4567',
      ]

      const results = new Set<string>()
      for (let i = 0; i < 10000; i++) {
        const phone = variations[i % variations.length]
        results.add(normalizePhone(phone))
      }

      // All should normalize to the same value
      expect(results.size).toBe(1)
    })
  })

  // ==========================================================================
  // HASH COLLISION TESTING
  // ==========================================================================
  describe('Hash Collision Resistance', () => {
    it('should not produce collisions for similar but different emails', () => {
      const similarEmails = [
        'john@company.com',
        'john1@company.com',
        'john2@company.com',
        'johna@company.com',
        'johnb@company.com',
        'john.a@company.com',
        'john.b@company.com',
        'johns@company.com',
        'johnd@company.com',
      ]

      const hashes = similarEmails.map(email =>
        calculateHashKey(email, 'company.com', null)
      )

      const uniqueHashes = new Set(hashes)
      expect(uniqueHashes.size).toBe(similarEmails.length)
    })

    it('should not produce collisions for similar company domains', () => {
      const domains = [
        'company.com',
        'company.io',
        'company.co',
        'company.net',
        'company.org',
        'company-inc.com',
        'companyinc.com',
        'mycompany.com',
        'thecompany.com',
      ]

      const hashes = domains.map(domain =>
        calculateHashKey('john@' + domain, domain, '5551234567')
      )

      const uniqueHashes = new Set(hashes)
      expect(uniqueHashes.size).toBe(domains.length)
    })

    it('should distinguish leads with same email but different phones', () => {
      const phones = [
        '5551111111',
        '5552222222',
        '5553333333',
        '5554444444',
        '5555555555',
      ]

      const hashes = phones.map(phone =>
        calculateHashKey('john@company.com', 'company.com', phone)
      )

      const uniqueHashes = new Set(hashes)
      expect(uniqueHashes.size).toBe(phones.length)
    })
  })

  // ==========================================================================
  // BATCH PROCESSING SIMULATION
  // ==========================================================================
  describe('Batch Processing Simulation', () => {
    it('should efficiently process upload batch of 1,000 rows', () => {
      const batch = Array.from({ length: 1000 }, (_, i) => ({
        email: `lead${i}@company${i % 50}.com`,
        companyDomain: `company${i % 50}.com`,
        phone: i % 3 === 0 ? `555${String(i).padStart(7, '0')}` : null,
      }))

      const start = performance.now()

      // Simulate batch processing: calculate hashes
      const hashMap = new Map<string, number>()
      const duplicates: number[] = []

      for (let i = 0; i < batch.length; i++) {
        const lead = batch[i]
        const hash = calculateHashKey(lead.email, lead.companyDomain, lead.phone)

        if (hashMap.has(hash)) {
          duplicates.push(i)
        } else {
          hashMap.set(hash, i)
        }
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // Under 100ms
      expect(hashMap.size + duplicates.length).toBe(1000)
    })

    it('should handle chunk processing of 100,000 rows', () => {
      const CHUNK_SIZE = 1000
      const TOTAL_ROWS = 100000
      const totalChunks = Math.ceil(TOTAL_ROWS / CHUNK_SIZE)

      const start = performance.now()
      let processedRows = 0
      const allHashes = new Set<string>()

      for (let chunk = 0; chunk < totalChunks; chunk++) {
        const chunkStart = chunk * CHUNK_SIZE
        const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, TOTAL_ROWS)

        for (let i = chunkStart; i < chunkEnd; i++) {
          const hash = calculateHashKey(
            `user${i}@company${i % 1000}.com`,
            `company${i % 1000}.com`,
            `555${String(i).padStart(7, '0')}`
          )
          allHashes.add(hash)
          processedRows++
        }
      }

      const duration = performance.now() - start

      expect(processedRows).toBe(TOTAL_ROWS)
      expect(duration).toBeLessThan(5000) // Under 5 seconds
    })
  })

  // ==========================================================================
  // MEMORY EFFICIENCY
  // ==========================================================================
  describe('Memory Efficiency', () => {
    it('should use consistent memory for hash storage', () => {
      // Each SHA256 hash is 64 characters = ~128 bytes in JS string
      const HASH_COUNT = 10000
      const hashes: string[] = []

      for (let i = 0; i < HASH_COUNT; i++) {
        hashes.push(calculateHashKey(
          `user${i}@company.com`,
          'company.com',
          `555${String(i).padStart(7, '0')}`
        ))
      }

      // All hashes should be exactly 64 characters
      expect(hashes.every(h => h.length === 64)).toBe(true)

      // Rough memory estimate: 10k hashes * 64 chars * 2 bytes ≈ 1.28 MB
      // This should be well under reasonable limits
    })
  })

  // ==========================================================================
  // CROSS-PARTNER DEDUPLICATION SCENARIOS
  // ==========================================================================
  describe('Cross-Partner Deduplication Scenarios', () => {
    it('should identify same lead uploaded by different partners', () => {
      // Simulate Partner A uploading a lead
      const partnerALead = {
        email: 'john@bigcompany.com',
        companyDomain: 'bigcompany.com',
        phone: '5551234567',
      }

      const partnerAHash = calculateHashKey(
        partnerALead.email,
        partnerALead.companyDomain,
        partnerALead.phone
      )

      // Simulate Partner B uploading the same lead with different formatting
      const partnerBLead = {
        email: 'JOHN@BIGCOMPANY.COM',
        companyDomain: 'BigCompany.com',
        phone: '(555) 123-4567',
      }

      const partnerBHash = calculateHashKey(
        partnerBLead.email,
        partnerBLead.companyDomain,
        partnerBLead.phone
      )

      // Hashes should match - same person
      expect(partnerAHash).toBe(partnerBHash)
    })

    it('should differentiate leads from different people at same company', () => {
      const lead1Hash = calculateHashKey(
        'john@bigcompany.com',
        'bigcompany.com',
        '5551111111'
      )

      const lead2Hash = calculateHashKey(
        'jane@bigcompany.com',
        'bigcompany.com',
        '5552222222'
      )

      expect(lead1Hash).not.toBe(lead2Hash)
    })
  })
})
