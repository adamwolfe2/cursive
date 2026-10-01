import { describe, expect, it } from 'vitest'
import type { Fact } from '@/lib/free-leads/contract'
import { attributionFrom } from '../api'
import { groupFacts, pagesSummary, replayLabel, withPage } from '../scan-state'

describe('withPage', () => {
  it('upserts by path in first-seen order and keeps chars once read', () => {
    let pages = withPage([], { type: 'page', path: '/', state: 'fetching' })
    pages = withPage(pages, { type: 'page', path: '/pricing', state: 'fetching' })
    pages = withPage(pages, { type: 'page', path: '/', state: 'read', title: 'Home', chars: 1200 })
    expect(pages.map((p) => [p.path, p.state, p.chars])).toEqual([
      ['/', 'read', 1200],
      ['/pricing', 'fetching', null],
    ])
    expect(pagesSummary(pages)).toBeNull()
    pages = withPage(pages, { type: 'page', path: '/pricing', state: 'failed' })
    expect(pagesSummary(pages)).toBe('Read 1 of 2 pages, 1.2k characters')
  })
})

describe('groupFacts', () => {
  const f = (key: Fact['key'], source: Fact['source'], text: string): Fact => ({ key, label: key, source, text })
  it('groups by key in first-arrival order', () => {
    const groups = groupFacts([f('company', 'site', 'Acme'), f('pricing', 'site', '$99'), f('offer', 'model', 'Audits'), f('pricing', 'model', 'Flat fee')])
    expect(groups.map((g) => [g.key, g.facts.map((x) => x.text)])).toEqual([
      ['company', ['Acme']],
      ['pricing', ['$99', 'Flat fee']],
      ['offer', ['Audits']],
    ])
  })
})

describe('replayLabel', () => {
  const now = new Date(2026, 8, 30, 15, 0)
  it('says when the cached scan ran', () => {
    expect(replayLabel(new Date(2026, 8, 30, 9, 0).toISOString(), now)).toBe('From a scan of this site earlier today.')
    expect(replayLabel(new Date(2026, 8, 29, 22, 0).toISOString(), now)).toBe('From a scan of this site yesterday.')
    expect(replayLabel(new Date(2026, 8, 26, 12, 0).toISOString(), now)).toBe('From a scan of this site 4 days ago.')
    expect(replayLabel('not a date', now)).toBe('From an earlier scan of this site.')
  })
})

describe('attributionFrom', () => {
  it('keeps utm, ref, referrer and landing path within schema limits', () => {
    const a = attributionFrom(`https://x.com/start?utm_source=linkedin&utm_campaign=${'c'.repeat(300)}&ref=adam&site=acme.com`, 'https://www.linkedin.com/')
    expect(a).toEqual({
      utm_source: 'linkedin',
      utm_campaign: 'c'.repeat(200),
      ref: 'adam',
      referrer: 'https://www.linkedin.com/',
      landing: '/start',
    })
  })

  it('omits what is missing', () => {
    expect(attributionFrom('https://x.com/start', '')).toEqual({ landing: '/start' })
  })
})
