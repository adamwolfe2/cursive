import { describe, it, expect } from 'vitest'
import { renderFreeLeadsProfileEmail } from './free-leads-profile'

const icp = {
  summary: 'You sell <script>x</script> audits & more',
  industries: ['Software Development'],
  job_titles: ['CTO', '<img src=x onerror=1>'],
  seniority: [],
  company_size: ['11 to 50' as const],
  countries: ['United States'],
  states: ['Texas'],
  cities: ['Austin'],
}

describe('renderFreeLeadsProfileEmail', () => {
  it('escapes model text, links back to /start?site=, never uses em dashes', () => {
    const { html, text, subject } = renderFreeLeadsProfileEmail({ to: 'a@x.com', domain: 'acme.com', icp })
    expect(subject).toBe('Who buys from acme.com')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('/start?site=acme.com')
    expect(html).toContain('11-50\u00a0people')
    expect(html).toContain('Austin · Texas · United States')
    expect(html).toContain('acme.&#8205;com')
    expect(text).toContain('Get 25 leads like this, free:')
    expect(html + text).not.toMatch(/—/)
  })
})
