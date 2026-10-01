import { describe, expect, it } from 'vitest'
import type { Icp } from '@/lib/free-leads/contract'
import { approveBlocker, describeChange, marketBand, matchOption, meterPct, sizeLabel, valuesFor, widenings, withAdded, withRemoved } from '../icp-edit'

const icp: Icp = {
  summary: 'You sell commercial HVAC service to facility managers in Dallas Fort Worth.',
  industries: [],
  job_titles: ['Facilities Manager'],
  seniority: [],
  company_size: [],
  countries: ['United States'],
  states: ['Texas'],
  cities: ['Dallas'],
}

describe('locations row', () => {
  it('routes typed places to states, countries or cities', () => {
    expect(withAdded(icp, 'locations', 'oklahoma').states).toEqual(['Texas', 'Oklahoma'])
    expect(withAdded(icp, 'locations', 'Canada').countries).toEqual(['United States', 'Canada'])
    expect(withAdded(icp, 'locations', 'fort worth').cities).toEqual(['Dallas', 'Fort Worth'])
  })

  it('shows and removes cities alongside states and countries', () => {
    expect(valuesFor(icp, 'locations')).toEqual(['Dallas', 'Texas', 'United States'])
    expect(withRemoved(icp, 'locations', 'Dallas').cities).toEqual([])
  })

  it('offers dropping the cities first when a local search is too narrow', () => {
    expect(widenings(icp)[0]).toEqual({ label: 'Anywhere in Texas', next: { ...icp, cities: [] } })
  })
})

describe('typed values', () => {
  it('title-cases typed countries so the database recognizes them', () => {
    expect(withAdded(icp, 'locations', 'united arab emirates').countries).toEqual(['United States', 'United Arab Emirates'])
  })

  it('matches list values case-insensitively and rejects anything else', () => {
    const list = ['Software Development', 'Dentists']
    expect(matchOption(list, '  software DEVELOPMENT ')).toBe('Software Development')
    expect(matchOption(list, 'Robots')).toBeNull()
  })

  it('labels sizes without en dashes', () => {
    expect(sizeLabel('11 to 50')).toBe('11-50 people')
  })
})

describe('approveBlocker', () => {
  it('blocks while counting, without a count, at zero, and for profiles with no title, industry or size', () => {
    expect(approveBlocker(icp, 120, false)).toBeNull()
    expect(approveBlocker(icp, 120, true)).toBe('not_ready')
    expect(approveBlocker(icp, null, false)).toBe('not_ready')
    expect(approveBlocker(icp, 0, false)).toBe('not_ready')
    expect(approveBlocker({ ...icp, job_titles: [] }, 64_000_000, false)).toBe('too_broad')
    expect(approveBlocker({ ...icp, job_titles: [], company_size: ['1 to 10'] }, 5000, false)).toBeNull()
  })
})

describe('count feedback', () => {
  const full: Icp = { ...icp, seniority: ['C-Team', 'VP', 'Director'], company_size: ['11 to 50', '51 to 200'] }

  it('names the one thing that changed', () => {
    expect(describeChange(full, withAdded(full, 'locations', 'Oklahoma'))).toBe('since you added Oklahoma')
    expect(describeChange(full, withRemoved(full, 'job_titles', 'Facilities Manager'))).toBe('since you removed Facilities Manager')
    expect(describeChange(full, withAdded(full, 'company_size', '201 to 500'))).toBe('since you added 201-500 people')
    expect(describeChange(full, { ...full, company_size: [] })).toBe('since you allowed any company size')
    expect(describeChange(full, { ...full, states: [], job_titles: [] })).toBe('since your change')
  })

  it('bands the market and places it on a log scale', () => {
    expect([0, 120, 499, 500, 100_000, 100_001].map(marketBand)).toEqual(['none', 'narrow', 'narrow', 'focused', 'focused', 'broad'])
    expect(meterPct(10)).toBe(0)
    expect(meterPct(10_000)).toBe(50)
    expect(meterPct(5_000_000)).toBe(100)
  })

  it('offers the next seniority level down when widening', () => {
    expect(widenings({ ...full, cities: [], states: [] }).map((w) => w.label)).toContain('Add Manager level')
    expect(widenings({ ...full, cities: [], states: [] }).find((w) => w.label === 'Add Manager level')?.next.seniority).toEqual([
      'C-Team',
      'VP',
      'Director',
      'Manager',
    ])
  })
})
