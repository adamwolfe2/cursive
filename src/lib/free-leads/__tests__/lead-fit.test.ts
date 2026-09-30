import { describe, expect, it } from 'vitest'
import { icpBrief, parseFits, selectFitLeads, type LeadFit } from '../lead-fit'
import type { Icp } from '../contract'

const fit = (score: LeadFit['score'], why = 'w'): LeadFit => ({ score, why })

describe('parseFits', () => {
  it('maps 1-based rows back to contacts and strips em dashes', () => {
    const text = JSON.stringify({ leads: [{ i: 2, score: 1, why: 'b' }, { i: 1, score: 3, why: 'Runs ops — owns HVAC' }] })
    expect(parseFits(text, 2)).toEqual([fit(3, 'Runs ops, owns HVAC'), fit(1, 'b')])
  })

  it('returns null when a row is missing, malformed, or the JSON is broken', () => {
    expect(parseFits(JSON.stringify({ leads: [{ i: 1, score: 3, why: 'a' }] }), 2)).toBeNull()
    expect(parseFits(JSON.stringify({ leads: [{ i: 1, score: 7, why: 'a' }] }), 1)).toBeNull()
    expect(parseFits('{"leads": [', 1)).toBeNull()
  })
})

describe('selectFitLeads', () => {
  const items = ['a', 'b', 'c', 'd', 'e']

  it('never keeps a 0, ranks by score, keeps upstream order on ties, caps the count', () => {
    const picked = selectFitLeads(items, [fit(2), fit(0), fit(3), fit(2), fit(1)], 3)
    expect(picked.map((p) => p.item)).toEqual(['c', 'a', 'd'])
  })

  it('fills with weaker leads only when there are not enough strong ones', () => {
    expect(selectFitLeads(items, [fit(1), fit(0), fit(3), fit(0), fit(1)], 5).map((p) => p.item)).toEqual(['c', 'a', 'e'])
  })

  it('keeps upstream order, unscored, when the judge was unavailable', () => {
    expect(selectFitLeads(items, null, 2)).toEqual([
      { item: 'a', fit: null },
      { item: 'b', fit: null },
    ])
  })
})

describe('icpBrief', () => {
  it('includes the place fields local sellers depend on', () => {
    const icp: Icp = {
      summary: 'You sell HVAC service.',
      industries: [],
      job_titles: ['Facilities Manager'],
      seniority: [],
      company_size: [],
      countries: ['United States'],
      states: ['Texas'],
      cities: ['Dallas'],
    }
    expect(icpBrief(icp, 'acme.com')).toContain('Where: Dallas, Texas, United States')
    expect(icpBrief(icp, 'acme.com')).not.toContain('Buyer industries')
  })
})
