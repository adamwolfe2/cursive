import { describe, expect, it } from 'vitest'
import type { Icp } from '@/lib/free-leads/contract'
import { approveBlocker, matchOption, sizeLabel, valuesFor, widenings, withAdded, withRemoved } from '../icp-edit'

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
