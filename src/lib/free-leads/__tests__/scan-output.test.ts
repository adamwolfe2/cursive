import { describe, expect, it } from 'vitest'
import { dedupeFacts, snapshotEmitter, toIcp, ScanError } from '../scan'
import type { Fact, Icp } from '../contract'

const full = {
  findings: [
    { key: 'offer', text: 'You sell audits.' },
    { key: 'customers', text: 'SaaS CTOs.' },
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
  it('emits each fact once, only when complete, then completed ICP fields in order', () => {
    const findings: Fact[] = []
    const partials: Partial<Icp>[] = []
    const emit = snapshotEmitter({ onFact: (f) => findings.push(f), onIcpPartial: (p) => partials.push(p) })
    const json = JSON.stringify(full)
    for (let i = 1; i <= json.length; i++) emit(json.slice(0, i))

    expect(findings).toEqual([
      { key: 'offer', label: 'What you sell', text: 'You sell audits.', source: 'model' },
      { key: 'customers', label: 'Who buys', text: 'SaaS CTOs.', source: 'model' },
    ])
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
    const icp = toIcp({ ...full, industries: ['Software Development', 'Made Up'], job_titles: Array.from({ length: 20 }, (_, i) => `CTO ${i}`) })
    expect(icp.industries).toEqual(['Software Development'])
    expect(icp.job_titles).toHaveLength(12)
  })

  it('throws ScanError(invalid) on unusable output', () => {
    expect(() => toIcp({ ...full, summary: '' })).toThrow(ScanError)
  })
})

describe('dedupeFacts', () => {
  const f = (key: Fact['key'], source: Fact['source'], text: string): Fact => ({ key, label: key, text, source })
  it('keeps one fact per key, preferring the model, in first-seen order', () => {
    const out = dedupeFacts([f('pricing', 'site', 'Listed prices: $499/mo'), f('offer', 'model', 'a'), f('pricing', 'model', 'Per property monthly: $499'), f('offer', 'model', 'b')])
    expect(out.map((x) => [x.key, x.text])).toEqual([['pricing', 'Per property monthly: $499'], ['offer', 'a']])
  })
})

describe('toIcp titles', () => {
  it('reduces compound titles to plain ones', () => {
    const icp = toIcp({ ...full, job_titles: ['VP Marketing Multifamily', 'Director of Marketing Real Estate', 'Asset Manager'] })
    expect(icp.job_titles).toEqual(['VP of Marketing', 'Director of Marketing', 'Asset Manager'])
  })
})
