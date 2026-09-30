import { describe, expect, it } from 'vitest'
import { filtersHash, icpToFilters } from '../icp-to-filters'
import type { Icp } from '../contract'

const base: Icp = {
  summary: 'You sell SOC 2 audits to Series A SaaS teams.',
  industries: ['Software Development', 'Not A Real Industry'],
  job_titles: ['CTO', ' CTO ', 'VP Engineering'],
  seniority: ['C-Team', 'VP'],
  company_size: ['11 to 50'],
  countries: ['United States'],
  states: ['Texas'],
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
