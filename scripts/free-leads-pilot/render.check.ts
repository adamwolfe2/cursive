/* eslint-disable no-console -- CLI self-check */
/** Self-check for render.ts: ./node_modules/.bin/tsx scripts/free-leads-pilot/render.check.ts */
import assert from 'node:assert/strict'
import type { GetLeadsContact } from '@/lib/getleads/client'
import { CreditBudget, email1Words, fill, maskBuyer, mergeFields, renderSteps, STEPS, toCsv } from './render'

const contact: GetLeadsContact = {
  first_name: 'DANA', last_name: 'reyes', email_address: 'dana@acmehousing.com', email_status: 'VALID',
  job_title: 'VP Operations, Acme Housing', job_level: 'VP', org_company_name: 'Acme Housing', org_domain: 'acmehousing.com',
  org_industry_linkedin: 'Real Estate', employee_count_range: '51 to 200', person_city: 'austin', state_name: 'Texas',
  person_country_name: 'United States', person_linkedin_url: '', cellphone: '',
}

// Masking: first name + initial, company never named (title, why), described instead.
const b = maskBuyer(contact, 'Runs ops at Acme Housing — owns vendor contracts!')
assert.equal(b.line, 'Dana R., VP Operations at a 51-200 person real estate company in Austin, Texas')
assert.ok(!/acme/i.test(b.line + b.why), 'company name leaked')
assert.ok(!/[—–!]/.test(b.why))
assert.ok(maskBuyer({ ...contact, job_title: 'Head of Ops at Acme Housing' }, null).line.startsWith('Dana R., Head of Ops at a 51-200'))

// Copy rules on every template.
for (const s of STEPS) {
  const all = [s.body, ...s.subjects].join('\n')
  assert.ok(!/[—–!]/.test(all), 'em dash or exclamation in copy')
  assert.ok(!/verified|getleads|audiencelab/i.test(all), 'banned word in copy')
  assert.ok(s.subjects.every((x) => x.length <= 40))
}

// Rendering: every merge field resolves; email 1 stays short; unknown fields throw.
const fields = mergeFields({
  prospect: { domain: 'acme.com', first_name: 'sam', last_name: 'lee', email: 'Sam@Acme.com', company: 'Acme' },
  siteDomain: 'acme.com',
  icpSentence: 'You sell SOC 2 audits to Series A SaaS teams in the United States.',
  matchCount: 4212,
  buyers: [b, b, b],
  senderAddress: 'Cursive, 1 Main St, Austin, TX 78701',
})
const steps = renderSteps(fields)
assert.ok(steps[0].body.includes('We found 4,212 people who match.'))
assert.ok(steps[0].body.includes('https://leads.meetcursive.com/start?site=acme.com\n'))
assert.ok(steps.every((s) => !/\{[a-z0-9_]+\}/.test(s.body)), 'unfilled merge field')
const words = email1Words(steps[0].body, fields)
assert.ok(words <= 120, `email 1 is ${words} words`)
assert.throws(() => fill('{nope}', {}))

// Credit cap: never exceeded, never released.
const budget = new CreditBudget(12)
assert.deepEqual([5, 5, 5].map((n) => budget.tryReserve(n)), [true, true, false])
assert.equal(budget.used, 10)

assert.equal(toCsv([{ a: 'x,"y"', b: 1 }]), 'a,b\n"x,""y""",1\n')
console.log(`render.check ok (email 1: ${words} words)`)
