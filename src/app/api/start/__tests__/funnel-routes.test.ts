import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { fakeSupabase } from '@/lib/free-leads/__tests__/fake-supabase'

const db = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.current }))
const limited = vi.hoisted(() => ({ types: new Set<string>() }))
vi.mock('@/lib/free-leads/http', async (orig) => ({
  ...(await orig<typeof import('@/lib/free-leads/http')>()),
  isLimited: async (type: string) => limited.types.has(type),
}))
vi.mock('@/lib/free-leads/mx', () => ({ hasMailExchanger: async (d: string) => d !== 'nomx.test' }))
const sendProfile = vi.hoisted(() => vi.fn())
vi.mock('@/lib/email/templates/free-leads-profile', () => ({ sendFreeLeadsProfileEmail: sendProfile }))

import { POST as event } from '../event/route'
import { POST as emailIcp } from '../email-icp/route'
import { slackSafe } from '@/lib/free-leads/notify'

const SID = '6f1c2a9e-3b7d-4c1a-9e2f-1a2b3c4d5e6f'
const ICP = {
  summary: 'You sell SOC 2 audits.', industries: [], job_titles: ['CTO'], seniority: [], company_size: [],
  countries: ['United States'], states: [], cities: [],
}
const req = (path: string, body: unknown, sid: string | null = SID) =>
  new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'x-forwarded-for': '1.2.3.4', ...(sid ? { 'x-fl-session': sid } : {}) },
  })
const tables = () => (db.current as ReturnType<typeof fakeSupabase>).tables

beforeEach(() => {
  db.current = fakeSupabase({ free_lead_sessions: [], free_lead_events: [] })
  limited.types.clear()
  sendProfile.mockReset()
  sendProfile.mockResolvedValue({ success: true })
})

describe('POST /api/start/event', () => {
  it('records an allowlisted client step for a valid session', async () => {
    expect((await event(req('/api/start/event', { step: 'icp_approved' }))).status).toBe(204)
    expect(tables().free_lead_events.map((e) => e.step)).toEqual(['icp_approved'])
  })

  it('rejects server-only steps, bad sessions, and respects the rate limit', async () => {
    expect((await event(req('/api/start/event', { step: 'delivered' }))).status).toBe(400)
    expect((await event(req('/api/start/event', { step: 'csv' }, 'nope'))).status).toBe(400)
    limited.types.add('free-leads-event')
    expect((await event(req('/api/start/event', { step: 'csv' }))).status).toBe(429)
    expect(tables().free_lead_events).toHaveLength(0)
  })
})

describe('POST /api/start/email-icp', () => {
  const body = { email: 'Me@Gmail.com', website: 'acme.com', icp: ICP }

  it('refuses to email a profile this session did not scan (no relay of request text)', async () => {
    const res = await (await emailIcp(req('/api/start/email-icp', body))).json()
    expect(res.error).toBeTruthy()
    tables().free_lead_sessions.push({ id: SID, domain: 'other.com', icp: ICP })
    expect((await emailIcp(req('/api/start/email-icp', body))).status).toBe(400)
    expect(sendProfile).not.toHaveBeenCalled()
  })

  it('sends the scanned profile (not the request body) to any mailbox with MX', async () => {
    tables().free_lead_sessions.push({ id: SID, domain: 'acme.com', icp: ICP })
    const res = await (await emailIcp(req('/api/start/email-icp', { ...body, icp: { ...ICP, summary: 'Pay this invoice now' } }))).json()
    expect(res).toEqual({ status: 'sent' })
    expect(sendProfile).toHaveBeenCalledWith({ to: 'me@gmail.com', domain: 'acme.com', icp: expect.objectContaining({ summary: ICP.summary }) })
    expect(tables().free_lead_sessions[0]).toMatchObject({ email: 'me@gmail.com', last_step: 'icp_emailed' })
  })

  it('refuses mailboxes without MX and never sends past a cap', async () => {
    expect(await (await emailIcp(req('/api/start/email-icp', { ...body, email: 'a@nomx.test' }))).json()).toEqual({ status: 'invalid_email' })
    limited.types.add('free-leads-email-icp-email')
    expect(await (await emailIcp(req('/api/start/email-icp', body))).json()).toEqual({ status: 'rate_limited' })
    expect(sendProfile).not.toHaveBeenCalled()
  })
})

describe('slackSafe', () => {
  it('strips Slack control characters so user text cannot inject links or mentions', () => {
    expect(slackSafe('<!channel> <https://evil|click> *bold*')).toBe('!channel https://evil click bold')
  })
})
