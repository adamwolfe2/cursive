import { describe, expect, it } from 'vitest'
import { coreTitle, coreTitles, filtersHash, icpToFilters, INDUSTRY_CHILDREN, narrowIndustries } from '../icp-to-filters'
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
  it('always requires VALID email status and excludes non-buying titles', () => {
    expect(icpToFilters(base).email_status).toEqual(['VALID'])
    expect(icpToFilters(base).exclude_job_titles).toEqual(['Assistant', 'Intern', 'Student', 'Retired', 'Former'])
  })

  it('maps states to office_states and drops unknown industries', () => {
    const f = icpToFilters(base)
    expect(f.office_states).toEqual(['Texas'])
    expect(f.industries).toEqual(['Software Development'])
    expect(f).not.toHaveProperty('states')
  })

  it('matches industries case-insensitively to the database spelling', () => {
    expect(icpToFilters({ ...base, industries: ['software development', 'SOFTWARE DEVELOPMENT'] }).industries).toEqual(['Software Development'])
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
      exclude_job_titles: ['Assistant', 'Intern', 'Student', 'Retired', 'Former'],
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

describe('coreTitle', () => {
  it('drops industry words baked into a title', () => {
    expect(coreTitle('Director of Marketing Property Management')).toBe('Director of Marketing')
    expect(coreTitle('Portfolio Manager Multifamily')).toBe('Portfolio Manager')
    expect(coreTitle('Director of Marketing Real Estate')).toBe('Director of Marketing')
    expect(coreTitle('VP Marketing Multifamily')).toBe('VP of Marketing')
    expect(coreTitle('Head of Growth (SaaS)')).toBe('Head of Growth')
  })
  it('puts "of" in VP / Director titles, but not where it would be wrong', () => {
    expect(coreTitle('Director Marketing')).toBe('Director of Marketing')
    expect(coreTitle('VP Engineering')).toBe('VP of Engineering')
    expect(coreTitle('Director of Marketing')).toBe('Director of Marketing')
    expect(coreTitle('Director Operations Manager')).toBe('Director Operations Manager')
  })
  it('never reduces a title to a stub and leaves plain titles alone', () => {
    expect(coreTitle('Director of Property Management')).toBe('Director of Property Management')
    expect(coreTitle('Real Estate')).toBe('Real Estate')
    expect(coreTitle('Regional Property Manager')).toBe('Regional Property Manager')
    expect(coreTitle('Asset Manager')).toBe('Asset Manager')
  })
  it('dedupes titles that collapse to the same core', () => {
    expect(coreTitles(['VP Marketing Multifamily', 'VP of Marketing', 'vp of marketing', 'Asset Manager'])).toEqual(['VP of Marketing', 'Asset Manager'])
  })
})

describe('Real Estate umbrella', () => {
  it('stays beside its narrower tags (property managers carry the plain tag)', () => {
    expect(narrowIndustries(['Real Estate', 'Leasing Residential Real Estate', 'Commercial Real Estate'])).toEqual([
      'Real Estate', 'Leasing Residential Real Estate', 'Commercial Real Estate',
    ])
  })
})
