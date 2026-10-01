/* eslint-disable no-console -- CLI eval: stdout is the report */
/**
 * How well does the production fit check (src/lib/free-leads/lead-fit.ts, ICP-only context)
 * agree with the eval's Opus judge (full site context)? Zero credits: reuses cached pulls.
 *
 *   ./node_modules/.bin/tsx --env-file=.env.local scripts/free-leads-eval/judge-agreement.ts --tag baseline --models claude-haiku-4-5,claude-sonnet-5-5
 */
import Anthropic from '@anthropic-ai/sdk'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { scoreLeads, selectFitLeads, type LeadFit } from '@/lib/free-leads/lead-fit'
import { usableContacts } from '@/lib/free-leads/rules'
import type { GetLeadsContact } from '@/lib/getleads/client'
import type { Icp } from '@/lib/free-leads/contract'

const HERE = dirname(fileURLToPath(import.meta.url))
const { values: args } = parseArgs({
  options: { tag: { type: 'string', default: 'baseline' }, effort: { type: 'string', default: 'low' }, models: { type: 'string', default: 'claude-haiku-4-5' }, limit: { type: 'string', default: '10' } },
})

interface SiteResult {
  domain: string
  vertical: string
  ok: boolean
  icp?: Icp
  pull_file?: string
  leads: Array<{ score: number; title: string; company: string }>
}

const PULLS = join(HERE, '.cache', 'pulls')
const pullFiles = readdirSync(PULLS).map((f) => ({ f, contacts: (JSON.parse(readFileSync(join(PULLS, f), 'utf8')) as { contacts: GetLeadsContact[] }).contacts }))

/** The pull behind a result: by recorded file, else by matching the lead rows (older results). */
function findPull(r: SiteResult, limit: number): GetLeadsContact[] | null {
  const byFile = r.pull_file ? pullFiles.find((p) => p.f === r.pull_file) : undefined
  const match = byFile ?? pullFiles.find((p) => {
    const cs = usableContacts(p.contacts, limit)
    return cs.length === r.leads.length && cs.every((c, k) => c.job_title === r.leads[k].title && c.org_company_name === r.leads[k].company)
  })
  return match ? usableContacts(match.contacts, limit) : null
}
const PRICE: Record<string, [number, number]> = { 'claude-haiku-4-5': [1, 5], 'claude-sonnet-5-5': [2, 10], 'claude-opus-5-5': [4, 20] }

async function main(): Promise<void> {
  const results = JSON.parse(readFileSync(join(HERE, 'results', `${args.tag}.json`), 'utf8')) as SiteResult[]
  const limit = Number(args.limit)
  for (const model of args.models!.split(',')) {
    let n = 0, exact = 0, within1 = 0, binAgree = 0, usd = 0, failures = 0
    let keptOpus: number[] = [], top70: number[] = [], allOpus: number[] = [], dropped = 0, droppedOpusGood = 0
    const t0 = Date.now()
    await Promise.all(
      results.filter((r) => r.ok && r.icp && r.leads.length).map(async (r) => {
        const contacts = findPull(r, limit)
        if (!contacts) return void console.warn(`  no cached pull for ${r.domain}`)
        const fits: LeadFit[] | null = await scoreLeads(r.icp!, r.domain, contacts, {
          model,
          effort: args.effort as 'low' | 'medium' | 'high',
          onUsage: ({ usage }: { usage: Anthropic.Usage }) => {
            const [i, o] = PRICE[model] ?? [4, 20]
            usd += (usage.input_tokens * i + usage.output_tokens * o) / 1e6
          },
        })
        if (!fits) return void failures++
        fits.forEach((f, k) => {
          const opus = r.leads[k].score
          n++
          if (f.score === opus) exact++
          if (Math.abs(f.score - opus) <= 1) within1++
          if (f.score >= 2 === opus >= 2) binAgree++
          allOpus.push(opus)
        })
        const kept = selectFitLeads(contacts.map((_, k) => k), fits, limit)
        keptOpus = keptOpus.concat(kept.map((x) => r.leads[x.item].score))
        // Over-pull simulation: pull 1.4x, show the best 1/1.4 (= 25 of 35).
        const shown = selectFitLeads(contacts.map((_, k) => k), fits, Math.round(contacts.length / 1.4))
        top70 = top70.concat(shown.map((x) => r.leads[x.item].score))
        const droppedIdx = contacts.map((_, k) => k).filter((k) => fits[k].score === 0)
        dropped += droppedIdx.length
        droppedOpusGood += droppedIdx.filter((k) => r.leads[k].score >= 2).length
        if (r.domain === 'kahnmechanical.com' || r.domain === 'curvedental.com') {
          console.log(`  sample ${r.domain}:`, fits.slice(0, 3).map((f) => `${f.score} ${f.why}`))
        }
      })
    )
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1)
    console.log(
      `${model}: leads ${n}, exact ${(100 * exact / n).toFixed(0)}%, within-1 ${(100 * within1 / n).toFixed(0)}%, fit>=2 agreement ${(100 * binAgree / n).toFixed(0)}%, ` +
        `dropped ${dropped} (of which Opus rated >=2: ${droppedOpusGood}), Opus mean fit all ${mean(allOpus).toFixed(2)} -> kept ${mean(keptOpus).toFixed(2)} ` +
        `(kept fit>=2 ${(100 * keptOpus.filter((s) => s >= 2).length / (keptOpus.length || 1)).toFixed(0)}%), ` +
        `best-70%: Opus fit ${mean(top70).toFixed(2)}, fit>=2 ${(100 * top70.filter((s) => s >= 2).length / (top70.length || 1)).toFixed(0)}%, failures ${failures}, cost $${usd.toFixed(4)} total, ${((Date.now() - t0) / 1000).toFixed(1)}s wall`
    )
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
