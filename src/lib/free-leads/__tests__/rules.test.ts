import { describe, expect, it } from 'vitest'
import type { GetLeadsContact } from '@/lib/getleads/client'
import {
  MAX_PAID_PULLS,
  STALE_PROCESSING_MS,
  type ClaimStatus,
  claimDecisionFor,
  emailDomain,
  isPersonalEmail,
  leadsActionFor,
  maskEmail,
  toFullLead,
  toLeadInsert,
  toMaskedLead,
  usableContacts,
} from '../rules'

const contact: GetLeadsContact = {
  first_name: 'Risa',
  last_name: 'fielder',
  email_address: 'Risa@Jones-Dilworth.com',
  email_status: 'VALID',
  job_title: 'Chief of Staff',
  job_level: 'C-Team',
  org_company_name: 'Jdi Jones-Dilworth, Inc',
  org_domain: 'jones-dilworth.com',
  org_industry_linkedin: 'Marketing Services',
  employee_count_range: '11 to 50',
  person_city: 'Austin',
  state_name: 'Texas',
  person_country_name: 'United States',
  person_linkedin_url: 'https://www.linkedin.com/in/risafielder',
  cellphone: '',
}

describe('personal email rejection', () => {
  it.each(['a@gmail.com', 'A@GMAIL.COM', 'x@yahoo.co.uk', 'x@hotmail.fr', 'x@proton.me', 'x@mailinator.com'])(
    'rejects %s',
    (e) => expect(isPersonalEmail(e)).toBe(true)
  )
  it.each(['adam@meetcursive.com', 'ceo@acme.io', 'x@gmail-partners.com'])('accepts %s', (e) =>
    expect(isPersonalEmail(e)).toBe(false)
  )
  it('extracts the lowercased domain', () => expect(emailDomain(' A@Acme.COM ')).toBe('acme.com'))
})

describe('masking', () => {
  it('masks the local part and keeps the domain', () => {
    expect(maskEmail('risa@jones-dilworth.com')).toBe('r•••@jones-dilworth.com')
  })
  it('handles garbage', () => expect(maskEmail('nope')).toBe('•••'))

  it('never exposes last name, full email, linkedin url or phone', () => {
    const m = toMaskedLead({ ...contact, cellphone: '+15125550100' })
    expect(m).toEqual({
      first_name: 'Risa',
      last_initial: 'F',
      job_title: 'Chief of Staff',
      company: 'Jdi Jones-Dilworth, Inc',
      company_domain: 'jones-dilworth.com',
      location: 'Austin, Texas',
      email_masked: 'r•••@jones-dilworth.com',
      has_linkedin: true,
      has_phone: true,
      why: null,
    })
    const json = JSON.stringify(m)
    expect(json).not.toContain('fielder')
    expect(json).not.toContain('linkedin.com')
    expect(json).not.toContain('5550100')
  })
})

describe('lead rows', () => {
  it('scopes inserts to the workspace, tags the source and lowercases email', () => {
    const row = toLeadInsert(contact, 'ws-1', 'claim-1', '2026-09-30T00:00:00.000Z')
    expect(row.workspace_id).toBe('ws-1')
    expect(row.source).toBe('free_leads')
    expect(row.tags).toEqual(['free_leads'])
    expect(JSON.stringify(row)).not.toMatch(/getleads/i)
    expect(row.email).toBe('risa@jones-dilworth.com')
    expect(row.phone).toBeNull()
    expect(row.metadata).toEqual({ free_lead_claim_id: 'claim-1' })
  })

  it('round-trips into a FullLead', () => {
    const lead = toFullLead({
      id: 'l1', first_name: 'Risa', last_name: 'Fielder', job_title: 'CoS', seniority_level: 'C-Team',
      company_name: 'JDI', company_domain: 'jdi.com', company_industry: null, company_size: '11 to 50',
      city: 'Austin', state: null, country: 'United States', email: 'r@jdi.com', linkedin_url: null, phone: null,
    })
    expect(lead.location).toBe('Austin, United States')
    expect(lead.seniority).toBe('C-Team')
  })

  it('drops rows without email, dedupes, and caps', () => {
    const rows = usableContacts(
      [contact, { ...contact, email_address: 'risa@jones-dilworth.com' }, { ...contact, email_address: '' }, { ...contact, email_address: 'b@x.com' }],
      25
    )
    expect(rows.map((r) => r.email_address)).toEqual(['Risa@Jones-Dilworth.com', 'b@x.com'])
    expect(usableContacts([contact, { ...contact, email_address: 'b@x.com' }], 1)).toHaveLength(1)
  })
})

describe('claim state transitions', () => {
  const NOW = Date.parse('2026-09-30T12:00:00.000Z')
  const state = (status: ClaimStatus, attempts = 0, startedMsAgo: number | null = null) => ({
    status,
    attempts,
    processing_started_at: startedMsAgo === null ? null : new Date(NOW - startedMsAgo).toISOString(),
  })

  it('maps claim state to the /leads action', () => {
    expect(leadsActionFor(null, NOW)).toBe('no_claim')
    expect(leadsActionFor(state('pending'), NOW)).toBe('fulfill')
    expect(leadsActionFor(state('processing', 1, 30_000), NOW)).toBe('wait')
    expect(leadsActionFor(state('fulfilled', 1, 60_000), NOW)).toBe('return_stored')
    expect(leadsActionFor(state('failed', 1), NOW)).toBe('failed')
  })

  it('never fulfills again once a paid pull was attempted', () => {
    expect(MAX_PAID_PULLS).toBe(1)
    expect(leadsActionFor(state('pending', 1), NOW)).toBe('failed')
  })

  it('treats processing older than 5 minutes (or with no start time) as failed, not pending', () => {
    expect(leadsActionFor(state('processing', 1, STALE_PROCESSING_MS - 1), NOW)).toBe('wait')
    expect(leadsActionFor(state('processing', 1, STALE_PROCESSING_MS), NOW)).toBe('failed')
    expect(leadsActionFor(state('processing', 0, null), NOW)).toBe('failed')
  })

  it('decides claim-time outcomes without revealing who claimed', () => {
    expect(claimDecisionFor(null, false)).toBe('new')
    expect(claimDecisionFor('pending', false)).toBe('resend')
    expect(claimDecisionFor('fulfilled', false)).toBe('relink')
    expect(claimDecisionFor('fulfilled', true)).toBe('relink')
    expect(claimDecisionFor('processing', false)).toBe('silent')
    expect(claimDecisionFor('failed', false)).toBe('silent')
    expect(claimDecisionFor(null, true)).toBe('silent')
    expect(claimDecisionFor('pending', true)).toBe('silent')
  })
})
