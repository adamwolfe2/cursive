import { describe, expect, it } from 'vitest'
import type { Icp } from '@/lib/free-leads/contract'
import { valuesFor, widenings, withAdded, withRemoved } from '../icp-edit'

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
