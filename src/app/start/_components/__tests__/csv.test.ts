import { describe, expect, it } from 'vitest'
import type { FullLead } from '@/lib/free-leads/contract'
import { leadsCsv } from '../csv'

const lead: FullLead = {
  id: 'l1',
  first_name: 'Zoë',
  last_name: '=HYPERLINK("x")',
  job_title: 'CTO, "Platform"',
  seniority: 'C-Team',
  company: 'Acme',
  company_domain: 'acme.com',
  industry: null,
  company_size: '51 to 200',
  location: null,
  why: null,
  email: 'zoe@acme.com',
  linkedin_url: null,
  phone: '+1 512 555 0100',
}

describe('leadsCsv', () => {
  it('starts with a UTF-8 BOM so spreadsheets read accents', () => {
    const csv = leadsCsv([lead])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.slice(1).split('\n')[0]).toMatch(/^first_name,last_name,title,/)
  })

  it('quotes cells, escapes quotes, and defuses formulas', () => {
    const row = leadsCsv([lead]).split('\n')[1]
    expect(row).toContain('"Zoë"')
    expect(row).toContain(`"'=HYPERLINK(""x"")"`)
    expect(row).toContain('"CTO, ""Platform"""')
    expect(row).toContain(`"'+1 512 555 0100"`)
    expect(row).toContain('""')
  })
})
