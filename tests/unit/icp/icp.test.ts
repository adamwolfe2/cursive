import { describe, expect, it } from 'vitest'
import { icpProfileSchema, parseWorkspaceIcp } from '@/lib/icp/profile'
import { scoreIcpFit, icpInputFromALRecord } from '@/lib/icp/score'
import { resolveLeadContact } from '@/lib/icp/contact'
import { buildIcpAudienceRequest } from '@/lib/icp/audience'
import { extractEmail } from '@/lib/audiencelab/lead-inserter'

const icp = icpProfileSchema.parse({
  industries: ['wholesale', 'plastics manufacturing'],
  seniority: ['cxo', 'vp', 'director', 'owner', 'president'],
  titleKeywords: ['ecommerce', 'operations', 'it', 'president'],
  excludeTitleKeywords: ['intern'],
  excludeDomains: ['acrocommerce.com'],
  employeeMin: 20,
  employeeMax: 5000,
  requireIndustry: true,
  minScore: 65,
  audience: { enabled: true, intentSegments: ['b2b_15263', 'b2b_486'] },
})

// Real shape of an AudienceLab audience row (Northeastern Supply, 2026-09-18).
const wholesalerPresident = {
  BUSINESS_EMAIL: 'sallen@morsco.com, stan.allen@northeastern.com',
  BUSINESS_VERIFIED_EMAILS: 'sall@northeastern.com, stan.allen@northeastern.com',
  PERSONAL_EMAILS: '',
  COMPANY_DOMAIN: 'northeastern.com',
  COMPANY_INDUSTRY: 'Wholesale',
  COMPANY_EMPLOYEE_COUNT: '101 to 250',
  SENIORITY_LEVEL: 'director',
  JOB_TITLE: 'President',
  LINKEDIN_URL: 'https://linkedin.com/in/stan',
}

describe('scoreIcpFit', () => {
  it('scores a verified-email wholesaler president as a strong match', () => {
    const fit = scoreIcpFit(icpInputFromALRecord(wholesalerPresident), icp)
    expect(fit.score).toBe(100)
    expect(fit.isMatch).toBe(true)
    expect(fit.reasons).toContain('industry: wholesale')
  })

  it('never matches a senior buyer outside the ICP industries when industry is required', () => {
    const fit = scoreIcpFit(
      icpInputFromALRecord({ ...wholesalerPresident, COMPANY_INDUSTRY: 'Financial Services', JOB_TITLE: 'IT Director' }),
      icp
    )
    expect(fit.isMatch).toBe(false)
    expect(fit.score).toBeLessThan(65)
  })

  it('matches industry names exactly, not by substring', () => {
    const fit = scoreIcpFit(icpInputFromALRecord({ ...wholesalerPresident, COMPANY_INDUSTRY: 'Wholesale Building Materials' }), icp)
    expect(fit.reasons.some(r => r.startsWith('industry'))).toBe(false)
  })

  it('matches title keywords on whole words only', () => {
    const fit = scoreIcpFit(icpInputFromALRecord({ ...wholesalerPresident, JOB_TITLE: 'Kitchen Designer', SENIORITY_LEVEL: '' }), icp)
    expect(fit.reasons.some(r => r.startsWith('title'))).toBe(false)
  })

  it('zeroes excluded domains and titles', () => {
    expect(scoreIcpFit(icpInputFromALRecord({ ...wholesalerPresident, COMPANY_DOMAIN: 'acrocommerce.com' }), icp).score).toBe(0)
    expect(scoreIcpFit(icpInputFromALRecord({ ...wholesalerPresident, JOB_TITLE: 'Operations Intern' }), icp).excluded).toMatch(/intern/)
  })

  it('reads pixel resolution fields (singular BUSINESS_EMAIL, title-case seniority)', () => {
    const input = icpInputFromALRecord({ BUSINESS_EMAIL: 'dana@acme.com', SENIORITY_LEVEL: 'Cxo', COMPANY_INDUSTRY: 'Plastics Manufacturing' })
    expect(input.workEmail).toBe('dana@acme.com')
    expect(input.workEmailVerified).toBe(false)
    expect(scoreIcpFit(input, icp).reasons).toEqual(['work email', 'industry: plastics manufacturing', 'seniority: cxo'])
  })
})

describe('resolveLeadContact', () => {
  const person = { primary_email: 'dana@gmail.com', first_name: 'Dana', last_name: 'Lee', company_name: 'Acme' }
  const input = icpInputFromALRecord({ BUSINESS_EMAIL: 'Dana@Acme.com' })

  it('makes the work email primary and keeps the personal email for B2B workspaces', () => {
    expect(resolveLeadContact(person, icp, input)).toEqual({
      email: 'dana@acme.com', secondaryEmail: 'dana@gmail.com', b2bQualified: true,
    })
  })

  it('leaves workspaces without an ICP unchanged', () => {
    expect(resolveLeadContact(person, null, null)).toEqual({ email: 'dana@gmail.com', secondaryEmail: null, b2bQualified: false })
  })

  it('does not qualify a work email without a company and full name', () => {
    expect(resolveLeadContact({ ...person, company_name: null }, icp, input).b2bQualified).toBe(false)
  })
})

describe('buildIcpAudienceRequest', () => {
  it('uses the businessProfile shape AudienceLab honors', () => {
    expect(buildIcpAudienceRequest(icp)).toEqual({
      segment: ['b2b_15263', 'b2b_486'],
      days_back: 7,
      filters: {
        businessProfile: {
          industry: ['wholesale', 'plastics manufacturing'],
          seniority: ['cxo', 'vp', 'director', 'owner', 'president'],
        },
      },
    })
  })

  it('returns null when the audience is off', () => {
    expect(buildIcpAudienceRequest({ ...icp, audience: { ...icp.audience, enabled: false } })).toBeNull()
  })
})

describe('parseWorkspaceIcp', () => {
  it('returns null for missing or malformed ICPs', () => {
    expect(parseWorkspaceIcp({})).toBeNull()
    expect(parseWorkspaceIcp({ icp: { minScore: 500 } })).toBeNull()
    expect(parseWorkspaceIcp({ icp: { audience: { intentSegments: ['123'] } } })).toBeNull()
  })
})

describe('extractEmail', () => {
  it('takes the first address from comma-separated AL fields', () => {
    expect(extractEmail(wholesalerPresident as any)).toBe('sall@northeastern.com')
  })
})
