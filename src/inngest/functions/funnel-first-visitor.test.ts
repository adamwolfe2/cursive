import { describe, it, expect } from 'vitest'
import { visitorHeadline } from './funnel-first-visitor'
import type { FunnelVisitor } from '@/lib/funnel/order.service'

function v(partial: Partial<FunnelVisitor>): FunnelVisitor {
  return {
    id: 'e1',
    received_at: '2026-06-06T00:00:00Z',
    first_name: null,
    last_name: null,
    full_name: null,
    email: null,
    company_name: null,
    company_domain: null,
    job_title: null,
    city: null,
    state: null,
    country: null,
    linkedin_url: null,
    ...partial,
  }
}

describe('visitorHeadline', () => {
  it('prefers title at company', () => {
    expect(
      visitorHeadline(
        v({
          job_title: 'VP Sales',
          company_name: 'Acme',
          full_name: 'Jane Doe',
        })
      )
    ).toBe('VP Sales at Acme')
  })

  it('falls back to name at company when no title', () => {
    expect(
      visitorHeadline(v({ full_name: 'Jane Doe', company_name: 'Acme' }))
    ).toBe('Jane Doe at Acme')
  })

  it('uses name alone when no company', () => {
    expect(visitorHeadline(v({ full_name: 'Jane Doe' }))).toBe('Jane Doe')
  })

  it('uses company alone when no person name', () => {
    expect(visitorHeadline(v({ company_name: 'Acme' }))).toBe('Acme')
  })

  it('returns null when nothing identifies the visitor', () => {
    expect(visitorHeadline(v({}))).toBeNull()
  })
})
