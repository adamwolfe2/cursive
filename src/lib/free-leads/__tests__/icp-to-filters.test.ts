import { describe, expect, it } from 'vitest'
import { filtersHash, icpToFilters, INDUSTRY_CHILDREN, narrowIndustries } from '../icp-to-filters'
import type { Icp } from '../contract'

const base: Icp = {
  summary: 'You sell SOC 2 audits to Series A SaaS teams.',
  industries: ['Software Development', 'Not A Real Industry'],
  job_titles: ['CTO', ' CTO ', 'VP Engineering'],
  seniority: ['C-Team', 'VP'],
  company_size: ['11 to 50'],
  countries: ['United States'],
  states: ['Texas'],
  cities: [],
}

describe('icpToFilters', () => {
  it('always requires VALID email status', () => {
    expect(icpToFilters(base).email_status).toEqual(['VALID'])
  })

  it('maps states to office_states and drops unknown industries', () => {
    const f = icpToFilters(base)
    expect(f.office_states).toEqual(['Texas'])
    expect(f.industries).toEqual(['Software Development'])
    expect(f).not.toHaveProperty('states')
  })

  it('trims and dedupes values', () => {
    expect(icpToFilters(base).job_titles).toEqual(['CTO', 'VP Engineering'])
  })

  it('omits empty arrays, including industries emptied by the enum filter', () => {
    const f = icpToFilters({ ...base, industries: ['Nope'], states: [], job_titles: [] })
    expect(f).toEqual({
      seniority: ['C-Team', 'VP'],
      company_size: ['11 to 50'],
      countries: ['United States'],
      email_status: ['VALID'],
    })
  })

  it('does not mutate the input', () => {
    const copy = structuredClone(base)
    icpToFilters(base)
    expect(base).toEqual(copy)
  })
})

describe('filtersHash', () => {
  it('is order-insensitive and case-insensitive', () => {
    const a = icpToFilters(base)
    const b = icpToFilters({ ...base, seniority: ['VP', 'C-Team'], job_titles: ['vp engineering', 'cto'] })
    expect(filtersHash(a)).toBe(filtersHash(b))
  })

  it('changes when filters change', () => {
    expect(filtersHash(icpToFilters(base))).not.toBe(filtersHash(icpToFilters({ ...base, states: ['Ohio'] })))
  })
})

describe('narrowIndustries', () => {
  it('drops an umbrella when its own child is chosen', () => {
    expect(narrowIndustries(['Dentists', 'Medical Practices', 'Hospitals and Health Care'])).toEqual(['Dentists'])
    expect(narrowIndustries(['Software Development', 'Technology; Information and Internet'])).toEqual(['Software Development'])
    expect(narrowIndustries(['Retail Apparel and Fashion', 'Retail'])).toEqual(['Retail Apparel and Fashion'])
  })

  it('keeps umbrellas picked on their own (horizontal sellers)', () => {
    expect(narrowIndustries(['Software Development', 'Financial Services', 'Manufacturing'])).toEqual([
      'Software Development',
      'Financial Services',
      'Manufacturing',
    ])
  })

  it('every mapped child is a real industry value', async () => {
    const { LEAD_INDUSTRIES } = await import('@/lib/free-leads/industries')
    const all = new Set<string>(LEAD_INDUSTRIES)
    const tags = Object.entries(INDUSTRY_CHILDREN).flatMap(([parent, kids]) => [parent, ...kids])
    expect(tags.filter((t) => !all.has(t))).toEqual([])
  })
})

describe('cities', () => {
  it('maps cities to the person-city filter and defaults to none', () => {
    expect(icpToFilters({ ...base, cities: ['Austin', ' Austin', 'Round Rock'] }).cities).toEqual(['Austin', 'Round Rock'])
    expect(icpToFilters(base)).not.toHaveProperty('cities')
  })
})
