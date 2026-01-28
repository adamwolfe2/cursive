/**
 * Scoring Algorithm Unit Tests
 *
 * Tests intent score and freshness score calculations.
 * Verifies:
 * - Intent score components (seniority, company size, email quality, phone, completeness)
 * - Freshness sigmoid decay with floor of 15
 * - Score tier classifications
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  calculateIntentScore,
  calculateFreshnessScore,
  getIntentTier,
  getFreshnessLabel,
} from '@/lib/services/lead-scoring.service'

describe('Intent Score Calculation', () => {
  // ==========================================================================
  // SENIORITY SCORING (Max 25 points)
  // ==========================================================================
  describe('Seniority Level Scoring', () => {
    const baseLeadData = {
      email: 'john@company.com',
      company_domain: 'company.com',
      phone: '5551234567', // 20 points for phone
      company_size: '51-200', // 15 points for company size
      job_title: null,
      city: null,
      state: null,
      linkedin_url: null,
    }

    it('should score c_suite at 25 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        seniority_level: 'c_suite',
      })
      const seniorityFactor = result.factors.find(f => f.name === 'Seniority Level')
      expect(seniorityFactor?.score).toBe(25)
    })

    it('should score vp at 20 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        seniority_level: 'vp',
      })
      const seniorityFactor = result.factors.find(f => f.name === 'Seniority Level')
      expect(seniorityFactor?.score).toBe(20)
    })

    it('should score director at 15 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        seniority_level: 'director',
      })
      const seniorityFactor = result.factors.find(f => f.name === 'Seniority Level')
      expect(seniorityFactor?.score).toBe(15)
    })

    it('should score manager at 10 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        seniority_level: 'manager',
      })
      const seniorityFactor = result.factors.find(f => f.name === 'Seniority Level')
      expect(seniorityFactor?.score).toBe(10)
    })

    it('should score ic at 5 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        seniority_level: 'ic',
      })
      const seniorityFactor = result.factors.find(f => f.name === 'Seniority Level')
      expect(seniorityFactor?.score).toBe(5)
    })

    it('should infer c_suite from title containing CEO', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        seniority_level: null,
        job_title: 'CEO & Founder',
      })
      const seniorityFactor = result.factors.find(f => f.name === 'Seniority Level')
      expect(seniorityFactor?.score).toBe(25)
    })

    it('should infer vp from title containing VP', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        seniority_level: null,
        job_title: 'SVP of Sales',
      })
      const seniorityFactor = result.factors.find(f => f.name === 'Seniority Level')
      expect(seniorityFactor?.score).toBe(20)
    })

    it('should infer director from title', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        seniority_level: null,
        job_title: 'Director of Marketing',
      })
      const seniorityFactor = result.factors.find(f => f.name === 'Seniority Level')
      expect(seniorityFactor?.score).toBe(15)
    })

    it('should infer manager from title', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        seniority_level: null,
        job_title: 'Regional Sales Manager',
      })
      const seniorityFactor = result.factors.find(f => f.name === 'Seniority Level')
      expect(seniorityFactor?.score).toBe(10)
    })
  })

  // ==========================================================================
  // COMPANY SIZE SCORING (Max 25 points)
  // ==========================================================================
  describe('Company Size Scoring', () => {
    const baseLeadData = {
      email: 'john@company.com',
      company_domain: 'company.com',
      seniority_level: 'manager' as const,
    }

    it('should score 500+ employees at 25 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        company_size: '500+',
      })
      const sizeFactor = result.factors.find(f => f.name === 'Company Size')
      expect(sizeFactor?.score).toBe(25)
    })

    it('should score 201-500 employees at 20 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        company_size: '201-500',
      })
      const sizeFactor = result.factors.find(f => f.name === 'Company Size')
      expect(sizeFactor?.score).toBe(20)
    })

    it('should score 51-200 employees at 15 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        company_size: '51-200',
      })
      const sizeFactor = result.factors.find(f => f.name === 'Company Size')
      expect(sizeFactor?.score).toBe(15)
    })

    it('should score 11-50 employees at 10 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        company_size: '11-50',
      })
      const sizeFactor = result.factors.find(f => f.name === 'Company Size')
      expect(sizeFactor?.score).toBe(10)
    })

    it('should score 1-10 employees at 5 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        company_size: '1-10',
      })
      const sizeFactor = result.factors.find(f => f.name === 'Company Size')
      expect(sizeFactor?.score).toBe(5)
    })

    it('should calculate from employee count when size range not provided', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        company_employee_count: 750,
      })
      const sizeFactor = result.factors.find(f => f.name === 'Company Size')
      expect(sizeFactor?.score).toBe(25)
    })
  })

  // ==========================================================================
  // EMAIL QUALITY SCORING (Max 15 points)
  // ==========================================================================
  describe('Email Quality Scoring', () => {
    const baseLeadData = {
      seniority_level: 'manager' as const,
      company_size: '51-200',
    }

    it('should score verified work email at 15 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        email: 'john@company.com',
        company_domain: 'company.com',
      })
      const emailFactor = result.factors.find(f => f.name === 'Email Quality')
      expect(emailFactor?.score).toBe(15)
    })

    it('should score work email without domain match at 10 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        email: 'john@workemail.com',
        company_domain: 'company.com', // Different domain
      })
      const emailFactor = result.factors.find(f => f.name === 'Email Quality')
      expect(emailFactor?.score).toBe(10)
    })

    it('should score personal email (Gmail) at 0 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        email: 'john.doe@gmail.com',
        company_domain: 'company.com',
      })
      const emailFactor = result.factors.find(f => f.name === 'Email Quality')
      expect(emailFactor?.score).toBe(0)
    })

    it('should penalize generic inbox emails with -5 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        email: 'info@company.com',
        company_domain: 'company.com',
      })
      const emailFactor = result.factors.find(f => f.name === 'Email Quality')
      expect(emailFactor?.score).toBe(-5)
    })

    it('should penalize no email with -10 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        email: null,
        company_domain: 'company.com',
      })
      const emailFactor = result.factors.find(f => f.name === 'Email Quality')
      expect(emailFactor?.score).toBe(-10)
    })
  })

  // ==========================================================================
  // PHONE NUMBER SCORING (20 points)
  // ==========================================================================
  describe('Phone Number Scoring', () => {
    const baseLeadData = {
      email: 'john@company.com',
      company_domain: 'company.com',
      seniority_level: 'manager' as const,
      company_size: '51-200',
    }

    it('should score having phone at 20 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        phone: '5551234567',
      })
      const phoneFactor = result.factors.find(f => f.name === 'Phone Number')
      expect(phoneFactor?.score).toBe(20)
    })

    it('should score no phone at 0 points', () => {
      const result = calculateIntentScore({
        ...baseLeadData,
        phone: null,
      })
      const phoneFactor = result.factors.find(f => f.name === 'Phone Number')
      expect(phoneFactor?.score).toBe(0)
    })
  })

  // ==========================================================================
  // DATA COMPLETENESS SCORING (Max 15 points)
  // ==========================================================================
  describe('Data Completeness Scoring', () => {
    it('should score full completeness at 15 points', () => {
      const result = calculateIntentScore({
        email: 'john@company.com',
        company_domain: 'company.com',
        seniority_level: 'manager',
        company_size: '51-200',
        job_title: 'Sales Manager',
        city: 'San Francisco',
        state: 'CA',
        linkedin_url: 'https://linkedin.com/in/johndoe',
      })
      const completenessFactor = result.factors.find(f => f.name === 'Data Completeness')
      // 5/5 optional fields = 15 points
      expect(completenessFactor?.score).toBe(15)
    })

    it('should score partial completeness proportionally', () => {
      const result = calculateIntentScore({
        email: 'john@company.com',
        company_domain: 'company.com',
        seniority_level: 'manager',
        company_size: '51-200',
        job_title: 'Sales Manager',
        // Missing: city, state, linkedin_url
      })
      const completenessFactor = result.factors.find(f => f.name === 'Data Completeness')
      // 2/5 optional fields = 6 points (rounded)
      expect(completenessFactor?.score).toBe(6)
    })

    it('should score no optional fields at 0 points', () => {
      const result = calculateIntentScore({
        email: 'john@company.com',
        seniority_level: 'manager',
        company_size: '51-200',
        // No optional fields
      })
      const completenessFactor = result.factors.find(f => f.name === 'Data Completeness')
      expect(completenessFactor?.score).toBe(0)
    })
  })

  // ==========================================================================
  // TOTAL SCORE BOUNDS
  // ==========================================================================
  describe('Total Score Bounds', () => {
    it('should never exceed 100', () => {
      const result = calculateIntentScore({
        email: 'john@company.com',
        company_domain: 'company.com',
        phone: '5551234567',
        seniority_level: 'c_suite',
        company_size: '500+',
        job_title: 'CEO',
        city: 'San Francisco',
        state: 'CA',
        linkedin_url: 'https://linkedin.com/in/johndoe',
      })
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('should never be below 1', () => {
      const result = calculateIntentScore({
        email: null, // -10 penalty
        seniority_level: 'unknown',
        company_size: '1-10',
        // Minimal data
      })
      expect(result.score).toBeGreaterThanOrEqual(1)
    })
  })
})

// ==========================================================================
// FRESHNESS SCORE CALCULATION
// ==========================================================================
describe('Freshness Score Calculation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-28T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Sigmoid Decay', () => {
    it('should return ~99-100 for brand new leads (0 days old)', () => {
      const now = new Date()
      const score = calculateFreshnessScore(now)
      // Sigmoid at day 0 gives ~99 (not exactly 100 due to math)
      expect(score).toBeGreaterThanOrEqual(99)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should return ~50 at midpoint (30 days by default)', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const score = calculateFreshnessScore(thirtyDaysAgo)
      // At midpoint, sigmoid should be ~50
      expect(score).toBeGreaterThanOrEqual(48)
      expect(score).toBeLessThanOrEqual(52)
    })

    it('should decay gradually before midpoint', () => {
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      const score = calculateFreshnessScore(fifteenDaysAgo)
      // Should be between 50 and 100
      expect(score).toBeGreaterThan(50)
      expect(score).toBeLessThan(100)
    })

    it('should decay more rapidly after midpoint', () => {
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      const score = calculateFreshnessScore(sixtyDaysAgo)
      // Should be below 50 but above floor
      expect(score).toBeLessThan(50)
      expect(score).toBeGreaterThanOrEqual(15)
    })
  })

  describe('Floor Enforcement (15 per spec)', () => {
    it('should never go below floor of 15', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      const score = calculateFreshnessScore(oneYearAgo)
      expect(score).toBe(15)
    })

    it('should approach floor asymptotically', () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      const score = calculateFreshnessScore(ninetyDaysAgo)
      // Should be close to floor but not exactly floor
      expect(score).toBeLessThan(25)
      expect(score).toBeGreaterThanOrEqual(15)
    })

    it('should respect custom floor option', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      const score = calculateFreshnessScore(oneYearAgo, { floor: 20 })
      expect(score).toBe(20)
    })
  })

  describe('Custom Parameters', () => {
    it('should respect custom maxScore', () => {
      const now = new Date()
      const score = calculateFreshnessScore(now, { maxScore: 80 })
      // At day 0 with sigmoid, score ≈ maxScore / (1 + e^(-steepness*midpoint))
      // With defaults: 80 / (1 + e^(-0.15*30)) ≈ 79
      expect(score).toBeGreaterThanOrEqual(78)
      expect(score).toBeLessThanOrEqual(80)
    })

    it('should respect custom midpoint', () => {
      // 15 days with midpoint of 15 should give ~50
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      const score = calculateFreshnessScore(fifteenDaysAgo, { midpointDays: 15 })
      expect(score).toBeGreaterThanOrEqual(48)
      expect(score).toBeLessThanOrEqual(52)
    })

    it('should respect custom steepness', () => {
      // Test at 45 days (past midpoint) where steepness differences are visible
      const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      const gentleScore = calculateFreshnessScore(fortyFiveDaysAgo, { steepness: 0.05 })
      const steepScore = calculateFreshnessScore(fortyFiveDaysAgo, { steepness: 0.30 })
      // Gentler decay = higher score past midpoint
      expect(gentleScore).toBeGreaterThan(steepScore)
    })
  })

  describe('Score Progression', () => {
    it('should monotonically decrease over time', () => {
      const scores: number[] = []
      for (let days = 0; days <= 90; days += 10) {
        const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        scores.push(calculateFreshnessScore(date))
      }
      // Each score should be <= previous score
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1])
      }
    })
  })
})

// ==========================================================================
// TIER CLASSIFICATIONS
// ==========================================================================
describe('Score Tier Classifications', () => {
  describe('Intent Tiers', () => {
    it('should classify 0-33 as cold', () => {
      expect(getIntentTier(0)).toBe('cold')
      expect(getIntentTier(33)).toBe('cold')
    })

    it('should classify 34-66 as warm', () => {
      expect(getIntentTier(34)).toBe('warm')
      expect(getIntentTier(50)).toBe('warm')
      expect(getIntentTier(66)).toBe('warm')
    })

    it('should classify 67+ as hot', () => {
      expect(getIntentTier(67)).toBe('hot')
      expect(getIntentTier(100)).toBe('hot')
    })
  })

  describe('Freshness Labels', () => {
    it('should classify 70+ as fresh', () => {
      expect(getFreshnessLabel(70)).toBe('fresh')
      expect(getFreshnessLabel(100)).toBe('fresh')
    })

    it('should classify 30-69 as recent', () => {
      expect(getFreshnessLabel(30)).toBe('recent')
      expect(getFreshnessLabel(50)).toBe('recent')
      expect(getFreshnessLabel(69)).toBe('recent')
    })

    it('should classify <30 as stale', () => {
      expect(getFreshnessLabel(0)).toBe('stale')
      expect(getFreshnessLabel(15)).toBe('stale')
      expect(getFreshnessLabel(29)).toBe('stale')
    })
  })
})
