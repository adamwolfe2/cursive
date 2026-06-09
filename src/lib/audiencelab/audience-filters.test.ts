import { describe, it, expect } from 'vitest'
import { buildWorkspaceAudienceFilters, parseEmployeeRange } from './api-client'

describe('buildWorkspaceAudienceFilters', () => {
  it('maps industries + states (baseline)', () => {
    const f = buildWorkspaceAudienceFilters({ industries: ['SaaS'], states: ['CA'] })
    expect(f.business?.industry).toEqual(['SaaS'])
    expect(f.location?.state).toEqual(['CA'])
  })

  it('maps the buyer titles into business.jobTitle (the fix)', () => {
    const f = buildWorkspaceAudienceFilters({ industries: ['SaaS'], titles: ['VP Sales', 'CRO'] })
    expect(f.business?.jobTitle).toEqual(['VP Sales', 'CRO'])
    expect(f.business?.industry).toEqual(['SaaS'])
  })

  it('maps an employee range into business.employeeCount', () => {
    const f = buildWorkspaceAudienceFilters({ titles: ['CEO'], employeeRange: '51-200' })
    expect(f.business?.employeeCount).toEqual({ min: 51, max: 200 })
  })

  it('titles-only still produces a business filter', () => {
    const f = buildWorkspaceAudienceFilters({ titles: ['Founder'] })
    expect(f.business).toEqual({ jobTitle: ['Founder'] })
    expect(f.location).toBeUndefined()
  })

  it('empty input yields an empty filter', () => {
    expect(buildWorkspaceAudienceFilters({})).toEqual({})
  })
})

describe('parseEmployeeRange', () => {
  it('parses a span "51-200"', () => {
    expect(parseEmployeeRange('51-200')).toEqual({ min: 51, max: 200 })
  })
  it('parses "1,000-5,000" with commas', () => {
    expect(parseEmployeeRange('1,000-5,000')).toEqual({ min: 1000, max: 5000 })
  })
  it('parses "51 to 200"', () => {
    expect(parseEmployeeRange('51 to 200')).toEqual({ min: 51, max: 200 })
  })
  it('parses a plus band "1000+"', () => {
    expect(parseEmployeeRange('1000+')).toEqual({ min: 1000 })
  })
  it('parses "1000 plus"', () => {
    expect(parseEmployeeRange('1000 plus')).toEqual({ min: 1000 })
  })
  it('strips an "employees" suffix', () => {
    expect(parseEmployeeRange('51-200 employees')).toEqual({ min: 51, max: 200 })
  })
  it('returns null for empty / unparseable / inverted', () => {
    expect(parseEmployeeRange('')).toBeNull()
    expect(parseEmployeeRange(undefined)).toBeNull()
    expect(parseEmployeeRange('lots')).toBeNull()
    expect(parseEmployeeRange('200-51')).toBeNull()
  })
})
