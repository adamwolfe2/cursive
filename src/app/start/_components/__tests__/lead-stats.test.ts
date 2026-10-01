import { describe, expect, it } from 'vitest'
import type { FullLead } from '@/lib/free-leads/contract'
import { leadStats, matchesFilter } from '../lead-stats'

const base: FullLead = {
  id: 'x',
  first_name: 'A',
  last_name: 'B',
  job_title: 'CTO',
  seniority: null,
  company: 'Acme',
  company_domain: 'acme.com',
  industry: null,
  company_size: null,
  location: null,
  email: 'a@acme.com',
  linkedin_url: null,
  phone: null,
  why: null,
}
const lead = (over: Partial<FullLead>): FullLead => ({ ...base, ...over })

describe('leadStats', () => {
  it('derives every figure from the list itself', () => {
    const s = leadStats(
      [
        lead({ seniority: 'Director', company_size: '51 to 200', location: 'Austin, TX', linkedin_url: 'l', phone: 'p' }),
        lead({ seniority: 'C-Team', company_size: '11 to 50', location: 'Austin, TX', company_domain: 'b.com' }),
        lead({ seniority: 'Manager', company_size: '51 to 200', location: 'Denver, CO', company_domain: 'c.com', linkedin_url: 'l' }),
        lead({ seniority: 'Mystery', location: 'Boston, MA', company_domain: 'c.com' }),
      ],
      2
    )
    expect(s).toMatchObject({ total: 4, linkedin: 2, phone: 1, companies: 3, locations: 3, deciders: 2, otherPlaces: 1 })
    expect(s.seniority.map((b) => b.label)).toEqual(['C-suite', 'Director', 'Manager', 'Mystery'])
    expect(s.sizes).toEqual([
      { key: '11 to 50', label: '11-50 people', count: 1 },
      { key: '51 to 200', label: '51-200 people', count: 2 },
    ])
    expect(s.places).toEqual([
      { key: 'Austin, TX', label: 'Austin, TX', count: 2 },
      { key: 'Boston, MA', label: 'Boston, MA', count: 1 },
    ])
  })

  it('reports no seniority figure rather than zero when the field is missing', () => {
    const s = leadStats([lead({}), lead({ company_domain: null, company: 'ACME' })])
    expect(s.deciders).toBeNull()
    expect(s.seniority).toEqual([])
    expect(s.companies).toBe(2)
  })

  it('filters by the raw value behind a bar', () => {
    const austin = lead({ location: ' Austin, TX ', seniority: 'VP' })
    expect(matchesFilter(austin, null)).toBe(true)
    expect(matchesFilter(austin, { facet: 'place', key: 'Austin, TX', label: 'Austin, TX' })).toBe(true)
    expect(matchesFilter(austin, { facet: 'seniority', key: 'Director', label: 'Director' })).toBe(false)
  })
})
