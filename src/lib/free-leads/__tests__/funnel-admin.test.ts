import { describe, expect, it, vi } from 'vitest'
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => { throw new Error('pure tests only') } }))
import { CREDIT_USD } from '../cost'
import {
  claimRows,
  costSummary,
  funnelCounts,
  leadViews,
  rangeStart,
  timeline,
  type ClaimDbRow,
  type EventRow,
  type LeadDbRow,
} from '../funnel-admin'

const NOW = new Date('2026-09-30T12:00:00Z')
const ev = (session_id: string, step: string, created_at = '2026-09-29T10:00:00Z', meta: Record<string, unknown> | null = {}): EventRow => ({
  session_id, step, created_at, meta,
})

describe('funnelCounts', () => {
  const events = [
    ev('a', 'paste'), ev('b', 'paste'), ev('c', 'paste'), ev('d', 'paste'),
    ev('a', 'scan_done'), ev('b', 'scan_done'), ev('b', 'scan_done'), ev('c', 'scan_done'),
    ev('a', 'claim'), ev('b', 'claim'),
    ev('a', 'delivered'),
  ]

  it('counts distinct sessions per step in FUNNEL_STEPS order with conversion vs previous and vs paste', () => {
    const rows = funnelCounts(events, 'all', NOW)
    expect(rows.map((r) => r.step)[0]).toBe('paste')
    const by = Object.fromEntries(rows.map((r) => [r.step, r]))
    expect(by.paste).toMatchObject({ sessions: 4, vsPrev: null, vsPaste: null })
    expect(by.scan_done).toMatchObject({ sessions: 3, vsPrev: 0.75, vsPaste: 0.75 })
    expect(by.claim).toMatchObject({ sessions: 2, vsPaste: 0.5 })
    expect(by.delivered).toMatchObject({ sessions: 1, vsPaste: 0.25, vsPrev: null }) // link_opened is 0
    // preview has 0 sessions, so claim has no defined "vs previous"
    expect(by.preview.sessions).toBe(0)
    expect(by.claim.vsPrev).toBeNull()
  })

  it('drops events outside the range', () => {
    const old = [ev('x', 'paste', '2026-08-01T00:00:00Z'), ev('y', 'paste', '2026-09-28T00:00:00Z')]
    expect(funnelCounts(old, '7d', NOW)[0].sessions).toBe(1)
    expect(funnelCounts(old, 'all', NOW)[0].sessions).toBe(2)
    expect(rangeStart('all', NOW)).toBeNull()
  })

  it('returns zeros and null ratios when empty', () => {
    const rows = funnelCounts([], '30d', NOW)
    expect(rows.every((r) => r.sessions === 0 && r.vsPrev === null && r.vsPaste === null)).toBe(true)
  })
})

describe('costSummary', () => {
  it('splits usd and credits by step and divides by distinct delivered sessions', () => {
    const c = costSummary([
      ev('a', 'scan_done', undefined, { usd: 0.02, cached: false }),
      ev('b', 'scan_done', undefined, { usd: 0.03 }),
      ev('a', 'preview', undefined, { credits: 5, usd: 0 }),
      ev('a', 'delivered', undefined, { credits: 30 }),
      ev('a', 'delivered', undefined, { credits: 0 }),
      ev('b', 'claim', undefined, null),
    ])
    expect(c.usd).toBeCloseTo(0.05, 5)
    expect(c.credits).toBe(35)
    expect(c.creditUsd).toBeCloseTo(35 * CREDIT_USD, 5)
    expect(c.totalUsd).toBeCloseTo(0.05 + 35 * CREDIT_USD, 5)
    expect(c.byStep.scan_done.usd).toBeCloseTo(0.05, 5)
    expect(c.byStep.delivered.credits).toBe(30)
    expect(c.byStep.claim).toBeUndefined()
    expect(c.deliveredSessions).toBe(1)
    expect(c.costPerDelivered).toBeCloseTo(c.totalUsd, 5)
  })

  it('has a null cost per signup when nothing was delivered and ignores non-numeric meta', () => {
    const c = costSummary([ev('a', 'scan_done', undefined, { usd: 'lots', credits: NaN })])
    expect(c.totalUsd).toBe(0)
    expect(c.costPerDelivered).toBeNull()
  })
})

describe('claimRows', () => {
  const icp = { summary: 'You sell audits to SaaS.', industries: [], job_titles: [], seniority: [], company_size: [], countries: [], states: [], cities: [] }
  const claim = (over: Partial<ClaimDbRow>): ClaimDbRow => ({
    id: 'c1', created_at: '2026-09-29T00:00:00Z', email: 'a@acme.com', website: 'https://acme.com', icp,
    status: 'fulfilled', total_matching: 1200, session_id: 's1', upgrade_interest: ['ai_dashboard'], ...over,
  })

  it('joins delivered lead count, mean fit score, and session attribution', () => {
    const rows = claimRows(
      [claim({}), claim({ id: 'c2', session_id: null, icp: { bad: true }, upgrade_interest: null })],
      [{ id: 's1', attribution: { utm_source: 'linkedin', ref: 'adam' } }],
      [
        { claim_id: 'c1', fit_score: '3' },
        { claim_id: 'c1', fit_score: 2 },
        { claim_id: 'c1', fit_score: null },
        { claim_id: 'other', fit_score: '1' },
      ]
    )
    expect(rows[0]).toMatchObject({
      id: 'c1', icp_summary: 'You sell audits to SaaS.', lead_count: 3, mean_fit_score: 2.5,
      upgrade_interest: ['ai_dashboard'], utm_source: 'linkedin', ref: 'adam', total_matching: 1200,
    })
    expect(rows[1]).toMatchObject({ icp_summary: null, lead_count: 0, mean_fit_score: null, utm_source: null, ref: null, upgrade_interest: [] })
  })
})

describe('leadViews and timeline', () => {
  const lead = (id: string, rank: unknown, extra: Partial<LeadDbRow> = {}): LeadDbRow => ({
    id, first_name: 'Ann', last_name: 'Lee', job_title: 'CMO', company_name: 'Acme', city: 'Austin', state: 'Texas', country: 'US',
    metadata: { fit_rank: rank, fit_score: 3, fit_why: 'Buys audits' }, ...extra,
  })

  it('orders by fit_rank with unranked last and caps at 25', () => {
    const rows = leadViews([lead('z', undefined), lead('b', 1), lead('a', 0)])
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'z'])
    expect(rows[0]).toMatchObject({ name: 'Ann Lee', location: 'Austin, Texas', fit_score: 3, fit_why: 'Buys audits' })
    expect(leadViews(Array.from({ length: 40 }, (_, i) => lead(String(i), i)))).toHaveLength(25)
  })

  it('sorts the timeline and exposes only whitelisted meta', () => {
    const t = timeline([
      ev('s', 'delivered', '2026-09-29T10:05:00Z', { credits: 30, usd: 0.1, model: 'x', source: 'secret' }),
      ev('s', 'paste', '2026-09-29T10:00:00Z', {}),
    ])
    expect(t.map((e) => e.step)).toEqual(['paste', 'delivered'])
    expect(t[1]).toEqual({ step: 'delivered', created_at: '2026-09-29T10:05:00Z', usd: 0.1, credits: 30, cached: null })
  })
})
