import type { FullLead } from '@/lib/free-leads/contract'

/** Pure CSV export for the free list. */

const CSV_COLUMNS: Array<[string, (l: FullLead) => string | null]> = [
  ['first_name', (l) => l.first_name],
  ['last_name', (l) => l.last_name],
  ['title', (l) => l.job_title],
  ['seniority', (l) => l.seniority],
  ['company', (l) => l.company],
  ['company_domain', (l) => l.company_domain],
  ['industry', (l) => l.industry],
  ['company_size', (l) => l.company_size],
  ['location', (l) => l.location],
  ['email', (l) => l.email],
  ['linkedin_url', (l) => l.linkedin_url],
  ['phone', (l) => l.phone],
  ['why_this_lead', (l) => l.why],
]

/** Quote every cell; prefix formula-looking values so spreadsheets don't execute them. */
const cell = (v: string | null) => {
  const s = v ?? ''
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

/** BOM first so Excel reads UTF-8 names (accents, CJK) correctly. */
export function leadsCsv(leads: FullLead[]): string {
  const lines = [CSV_COLUMNS.map(([h]) => h).join(','), ...leads.map((l) => CSV_COLUMNS.map(([, get]) => cell(get(l))).join(','))]
  return `\uFEFF${lines.join('\n')}`
}
