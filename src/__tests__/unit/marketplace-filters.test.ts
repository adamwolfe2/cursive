/**
 * Marketplace Filter Schema Validation Tests
 *
 * Tests the Zod validation schema from GET /api/marketplace/leads.
 * Schema is recreated identically here since it is not exported from the route.
 *
 * Validates:
 * - industries array: max 20 items
 * - states array: max 50 items
 * - companySizes array: max 20 items
 * - seniorityLevels array: max 20 items
 * - limit: 1–100, integer, default 20
 * - offset: integer, min 0, default 0
 * - intentScoreMin / intentScoreMax: 0–100
 * - freshnessMin: 0–100
 * - orderBy / orderDirection: enum values
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// ─── Schema (copied verbatim from src/app/api/marketplace/leads/route.ts) ────

const filtersSchema = z.object({
  industries: z.array(z.string()).max(20, 'Too many industries (max 20)').optional(),
  states: z.array(z.string()).max(50, 'Too many states (max 50)').optional(),
  companySizes: z.array(z.string()).max(20, 'Too many company sizes (max 20)').optional(),
  seniorityLevels: z.array(z.string()).max(20, 'Too many seniority levels (max 20)').optional(),
  intentScoreMin: z.number().min(0).max(100).optional(),
  intentScoreMax: z.number().min(0).max(100).optional(),
  freshnessMin: z.number().min(0).max(100).optional(),
  hasPhone: z.boolean().optional(),
  hasVerifiedEmail: z.boolean().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  limit: z.number().int('Limit must be an integer').min(1).max(100).default(20),
  offset: z.number().int('Offset must be an integer').min(0).default(0),
  orderBy: z.enum(['price', 'intent_score', 'freshness_score', 'created_at']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
})

// ─── Helper ──────────────────────────────────────────────────────────────────

function valid(input: Record<string, unknown>) {
  return filtersSchema.safeParse(input)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Marketplace Filters Schema', () => {
  describe('Defaults', () => {
    it('applies default limit of 20', () => {
      const r = valid({})
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.limit).toBe(20)
    })

    it('applies default offset of 0', () => {
      const r = valid({})
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.offset).toBe(0)
    })

    it('accepts empty object (all fields optional)', () => {
      expect(valid({}).success).toBe(true)
    })
  })

  describe('industries — max 20 items', () => {
    it('accepts 1 industry', () => {
      expect(valid({ industries: ['Technology'] }).success).toBe(true)
    })

    it('accepts exactly 20 industries', () => {
      const industries = Array.from({ length: 20 }, (_, i) => `Industry${i}`)
      expect(valid({ industries }).success).toBe(true)
    })

    it('rejects 21 industries', () => {
      const industries = Array.from({ length: 21 }, (_, i) => `Industry${i}`)
      const r = valid({ industries })
      expect(r.success).toBe(false)
      if (!r.success) {
        expect(r.error.flatten().fieldErrors.industries).toBeDefined()
      }
    })

    it('accepts empty industries array', () => {
      expect(valid({ industries: [] }).success).toBe(true)
    })

    it('accepts undefined (optional)', () => {
      const r = valid({})
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.industries).toBeUndefined()
    })
  })

  describe('states — max 50 items', () => {
    it('accepts exactly 50 states', () => {
      const states = Array.from({ length: 50 }, (_, i) => `State${i}`)
      expect(valid({ states }).success).toBe(true)
    })

    it('rejects 51 states', () => {
      const states = Array.from({ length: 51 }, (_, i) => `State${i}`)
      const r = valid({ states })
      expect(r.success).toBe(false)
      if (!r.success) {
        expect(r.error.flatten().fieldErrors.states).toBeDefined()
      }
    })

    it('accepts the 50 real US state codes', () => {
      const US_STATES = [
        'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
        'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
        'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
        'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
        'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
      ]
      expect(valid({ states: US_STATES }).success).toBe(true)
    })
  })

  describe('companySizes — max 20 items', () => {
    it('accepts exactly 20 company sizes', () => {
      const companySizes = Array.from({ length: 20 }, (_, i) => `Size${i}`)
      expect(valid({ companySizes }).success).toBe(true)
    })

    it('rejects 21 company sizes', () => {
      const companySizes = Array.from({ length: 21 }, (_, i) => `Size${i}`)
      expect(valid({ companySizes }).success).toBe(false)
    })
  })

  describe('seniorityLevels — max 20 items', () => {
    it('accepts known seniority values', () => {
      const r = valid({ seniorityLevels: ['C-Suite', 'VP', 'Director', 'Manager'] })
      expect(r.success).toBe(true)
    })

    it('rejects 21 seniority levels', () => {
      const seniorityLevels = Array.from({ length: 21 }, (_, i) => `Level${i}`)
      expect(valid({ seniorityLevels }).success).toBe(false)
    })
  })

  describe('pagination — limit', () => {
    it('accepts limit 1', () => {
      expect(valid({ limit: 1 }).success).toBe(true)
    })

    it('accepts limit 100', () => {
      expect(valid({ limit: 100 }).success).toBe(true)
    })

    it('rejects limit 0', () => {
      expect(valid({ limit: 0 }).success).toBe(false)
    })

    it('rejects limit 101', () => {
      expect(valid({ limit: 101 }).success).toBe(false)
    })

    it('rejects non-integer limit', () => {
      const r = valid({ limit: 10.5 })
      expect(r.success).toBe(false)
      if (!r.success) {
        expect(r.error.flatten().fieldErrors.limit).toBeDefined()
      }
    })

    it('accepts limit 50', () => {
      const r = valid({ limit: 50 })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.limit).toBe(50)
    })
  })

  describe('pagination — offset', () => {
    it('accepts offset 0', () => {
      expect(valid({ offset: 0 }).success).toBe(true)
    })

    it('accepts large offset', () => {
      expect(valid({ offset: 10000 }).success).toBe(true)
    })

    it('rejects negative offset', () => {
      expect(valid({ offset: -1 }).success).toBe(false)
    })

    it('rejects non-integer offset', () => {
      expect(valid({ offset: 1.5 }).success).toBe(false)
    })
  })

  describe('intentScoreMin — 0–100', () => {
    it('accepts 0', () => {
      expect(valid({ intentScoreMin: 0 }).success).toBe(true)
    })

    it('accepts 100', () => {
      expect(valid({ intentScoreMin: 100 }).success).toBe(true)
    })

    it('accepts 50', () => {
      const r = valid({ intentScoreMin: 50 })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.intentScoreMin).toBe(50)
    })

    it('rejects -1', () => {
      expect(valid({ intentScoreMin: -1 }).success).toBe(false)
    })

    it('rejects 101', () => {
      expect(valid({ intentScoreMin: 101 }).success).toBe(false)
    })

    it('accepts undefined (optional)', () => {
      const r = valid({})
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.intentScoreMin).toBeUndefined()
    })
  })

  describe('intentScoreMax — 0–100', () => {
    it('accepts 0', () => {
      expect(valid({ intentScoreMax: 0 }).success).toBe(true)
    })

    it('accepts 100', () => {
      expect(valid({ intentScoreMax: 100 }).success).toBe(true)
    })

    it('rejects -1', () => {
      expect(valid({ intentScoreMax: -1 }).success).toBe(false)
    })

    it('rejects 101', () => {
      expect(valid({ intentScoreMax: 101 }).success).toBe(false)
    })
  })

  describe('freshnessMin — 0–100', () => {
    it('accepts 0', () => {
      expect(valid({ freshnessMin: 0 }).success).toBe(true)
    })

    it('accepts 100', () => {
      expect(valid({ freshnessMin: 100 }).success).toBe(true)
    })

    it('accepts 70', () => {
      const r = valid({ freshnessMin: 70 })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.freshnessMin).toBe(70)
    })

    it('rejects -1', () => {
      expect(valid({ freshnessMin: -1 }).success).toBe(false)
    })

    it('rejects 101', () => {
      expect(valid({ freshnessMin: 101 }).success).toBe(false)
    })
  })

  describe('orderBy — enum validation', () => {
    const validValues = ['price', 'intent_score', 'freshness_score', 'created_at'] as const

    for (const v of validValues) {
      it(`accepts orderBy "${v}"`, () => {
        expect(valid({ orderBy: v }).success).toBe(true)
      })
    }

    it('rejects invalid orderBy value', () => {
      expect(valid({ orderBy: 'invalid_field' }).success).toBe(false)
    })

    it('accepts undefined orderBy (optional)', () => {
      const r = valid({})
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.orderBy).toBeUndefined()
    })
  })

  describe('orderDirection — enum validation', () => {
    it('accepts "asc"', () => {
      expect(valid({ orderDirection: 'asc' }).success).toBe(true)
    })

    it('accepts "desc"', () => {
      expect(valid({ orderDirection: 'desc' }).success).toBe(true)
    })

    it('rejects invalid orderDirection', () => {
      expect(valid({ orderDirection: 'ascending' }).success).toBe(false)
    })
  })

  describe('boolean filters', () => {
    it('accepts hasPhone: true', () => {
      expect(valid({ hasPhone: true }).success).toBe(true)
    })

    it('accepts hasPhone: false', () => {
      expect(valid({ hasPhone: false }).success).toBe(true)
    })

    it('accepts hasVerifiedEmail: true', () => {
      expect(valid({ hasVerifiedEmail: true }).success).toBe(true)
    })

    it('rejects hasPhone as string', () => {
      expect(valid({ hasPhone: 'true' }).success).toBe(false)
    })
  })

  describe('price filters', () => {
    it('accepts priceMin 0', () => {
      expect(valid({ priceMin: 0 }).success).toBe(true)
    })

    it('accepts priceMax 10', () => {
      expect(valid({ priceMax: 10 }).success).toBe(true)
    })

    it('rejects negative priceMin', () => {
      expect(valid({ priceMin: -0.01 }).success).toBe(false)
    })

    it('rejects negative priceMax', () => {
      expect(valid({ priceMax: -1 }).success).toBe(false)
    })
  })

  describe('combined valid filter', () => {
    it('validates a realistic full filter set', () => {
      const r = valid({
        industries: ['Technology', 'Finance'],
        states: ['CA', 'TX', 'NY'],
        companySizes: ['1-50', '51-200'],
        seniorityLevels: ['VP', 'Director'],
        intentScoreMin: 70,
        intentScoreMax: 100,
        freshnessMin: 50,
        hasPhone: true,
        hasVerifiedEmail: true,
        priceMin: 0.05,
        priceMax: 0.25,
        limit: 50,
        offset: 0,
        orderBy: 'intent_score',
        orderDirection: 'desc',
      })
      expect(r.success).toBe(true)
    })
  })
})
