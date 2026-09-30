import { describe, it, expect } from 'vitest'
import { renderFreeLeadsReadyEmail } from './free-leads-ready'

const loginUrl = 'https://leads.meetcursive.com/auth/confirm?token_hash=abc&next=/start/leads'

describe('renderFreeLeadsReadyEmail', () => {
  it('escapes user-supplied strings and keeps the link in both parts', () => {
    const { html, text, subject } = renderFreeLeadsReadyEmail({
      to: 'a@x.com',
      loginUrl,
      domain: '<b>x.com</b>',
      icpSummary: 'You sell <script>alert(1)</script> & more',
    })
    expect(subject).toBe('Your 25 leads are ready')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<b>x.com</b>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('token_hash=abc&amp;next=/start/leads')
    expect(html).toContain('Open my 25 leads')
    expect(text).toContain(loginUrl)
    expect(html + text).not.toMatch(/—/)
  })

  it('omits the ICP block when no summary is given', () => {
    const { html } = renderFreeLeadsReadyEmail({ to: 'a@x.com', loginUrl, domain: 'x.com' })
    expect(html).not.toContain('Who we looked for')
  })
})
