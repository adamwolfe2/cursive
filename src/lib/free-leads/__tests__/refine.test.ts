import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Icp } from '../contract'

const reply = vi.hoisted(() => ({ json: {} as Record<string, unknown> }))
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(reply.json) }], usage: {} }),
    }
  },
}))

import { refineIcp } from '../scan'

const icp: Icp = {
  summary: 'You sell SOC 2 audits to SaaS teams.', industries: ['Software Development'], job_titles: ['CTO'],
  seniority: [], company_size: [], countries: ['United States'], states: [], cities: [],
}

beforeEach(() => vi.stubEnv('ANTHROPIC_API_KEY', 'test'))

describe('refineIcp', () => {
  it('keeps the previous summary when the model empties it ("remove everything")', async () => {
    reply.json = { summary: '  ', industries: [], job_titles: [], seniority: [], company_size: [], countries: [], states: [], cities: [], note: 'Cleared.' }
    const out = await refineIcp(icp, 'remove everything')
    expect(out.icp.summary).toBe(icp.summary)
    expect(out.icp.job_titles).toEqual([])
  })

  it('maps industries to the database spelling regardless of case', async () => {
    reply.json = { ...icp, industries: ['software development', 'Made Up'], note: 'ok' }
    expect((await refineIcp(icp, 'tweak')).icp.industries).toEqual(['Software Development'])
  })
})
