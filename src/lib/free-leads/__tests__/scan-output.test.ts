import { describe, expect, it } from 'vitest'
import { snapshotEmitter, toIcp, ScanError } from '../scan'
import type { Finding, Icp } from '../contract'

const full = {
  findings: [
    { label: 'What you sell', text: 'You sell audits.' },
    { label: 'Who buys', text: 'SaaS CTOs.' },
  ],
  summary: 'You sell audits to SaaS teams.',
  industries: ['Software Development'],
  job_titles: ['CTO'],
  seniority: ['C-Team'],
  company_size: ['11 to 50'],
  countries: ['United States'],
  states: [],
}

describe('snapshotEmitter', () => {
  it('emits each finding once, only when complete, then completed ICP fields in order', () => {
    const findings: Finding[] = []
    const partials: Partial<Icp>[] = []
    const emit = snapshotEmitter({ onFinding: (f) => findings.push(f), onIcpPartial: (p) => partials.push(p) })
    const json = JSON.stringify(full)
    for (let i = 1; i <= json.length; i++) emit(json.slice(0, i))

    expect(findings).toEqual(full.findings)
    expect(partials.length).toBeGreaterThan(0)
    expect(partials[0]).toEqual({ summary: full.summary })
    // Never emits a half-written field: every emitted value equals the final value.
    for (const p of partials) {
      for (const [k, v] of Object.entries(p)) expect(v).toEqual(full[k as keyof typeof full])
    }
  })
})

describe('toIcp', () => {
  it('clamps lengths and drops non-enum industries', () => {
    const icp = toIcp({ ...full, industries: ['Software Development', 'Made Up'], job_titles: Array(20).fill('CTO') })
    expect(icp.industries).toEqual(['Software Development'])
    expect(icp.job_titles).toHaveLength(12)
  })

  it('throws ScanError(invalid) on unusable output', () => {
    expect(() => toIcp({ ...full, summary: '' })).toThrow(ScanError)
  })
})
