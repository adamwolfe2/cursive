import { describe, it, expect } from 'vitest'
import { buildOutboundPayload } from '../payload'
import type { LeadRow } from '../types'

const lead: LeadRow = {
  id: 'lead-1',
  email: 'jane@acme.com',
  first_name: 'Jane',
  last_name: 'Doe',
  full_name: 'Jane Doe',
  company_name: 'Acme Inc',
  company_domain: 'acme.com',
  job_title: 'VP Marketing',
  phone: '+15125550142',
  city: 'Austin',
  state: 'Texas',
  state_code: 'TX',
  created_at: '2026-07-01T12:00:00.000Z',
}

describe('buildOutboundPayload', () => {
  it('builds the full payload when not throttled', () => {
    const p = buildOutboundPayload({ lead, pixelId: 'idp-1', externalCustomerRef: 'cust-1', throttled: false })
    expect(p.event).toBe('lead.identified')
    expect(p.pixel_id).toBe('idp-1')
    expect(p.external_customer_ref).toBe('cust-1')
    expect(p.throttled).toBe(false)
    expect(p.lead.phone).toBe('+15125550142')
    expect(p.lead.company.title).toBe('VP Marketing')
    expect(p.lead.location).toEqual({ city: 'Austin', state: 'TX' })
    expect(p.identified_at).toBe('2026-07-01T12:00:00.000Z')
  })

  it('reduces the payload when throttled (drops phone, title, location)', () => {
    const p = buildOutboundPayload({ lead, pixelId: 'idp-1', externalCustomerRef: 'cust-1', throttled: true })
    expect(p.throttled).toBe(true)
    expect(p.lead.email).toBe('jane@acme.com')
    expect(p.lead.company.name).toBe('Acme Inc')
    expect(p.lead.company.domain).toBe('acme.com')
    expect(p.lead.phone).toBeNull()
    expect(p.lead.company.title).toBeNull()
    expect(p.lead.location).toBeNull()
  })

  it('prefers state_code over state', () => {
    const p = buildOutboundPayload({ lead: { ...lead, state_code: 'CA' }, pixelId: 'x', externalCustomerRef: 'y', throttled: false })
    expect(p.lead.location?.state).toBe('CA')
  })

  it('emits null (not empty string) for full_name when no name parts exist', () => {
    const nameless = { ...lead, full_name: null, first_name: null, last_name: null }
    const p = buildOutboundPayload({ lead: nameless, pixelId: 'x', externalCustomerRef: 'y', throttled: false })
    expect(p.lead.full_name).toBeNull()
  })

  it('derives full_name from parts when full_name is null', () => {
    const partial = { ...lead, full_name: null }
    const p = buildOutboundPayload({ lead: partial, pixelId: 'x', externalCustomerRef: 'y', throttled: false })
    expect(p.lead.full_name).toBe('Jane Doe')
  })
})
