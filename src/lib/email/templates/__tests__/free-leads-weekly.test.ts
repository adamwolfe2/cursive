import { describe, expect, it, vi } from 'vitest'
vi.mock('../../resend-client', () => ({ sendEmail: vi.fn() }))
import { renderFreeLeadsWeeklyEmail } from '../free-leads-weekly'

describe('renderFreeLeadsWeeklyEmail', () => {
  it('escapes names and reasons, and never names the data provider', () => {
    const { subject, html, text } = renderFreeLeadsWeeklyEmail({
      to: 'a@b.com',
      domain: 'acme.com',
      count: 25,
      top: [{ name: '<script>x</script>', title: 'CTO', company: 'Co', why: 'Runs "security" & audits' }],
    })
    expect(subject).toBe('25 new leads for acme.com')
    expect(html).not.toContain('<script>x</script>')
    expect(html).toContain('&lt;script&gt;')
    expect(`${html}${text}`.toLowerCase()).not.toMatch(/getleads|audiencelab|prospeo/)
  })
})
