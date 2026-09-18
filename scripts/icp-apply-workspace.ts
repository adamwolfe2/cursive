/**
 * Apply an ICP profile to one workspace and re-score its existing pixel leads.
 *
 *   node_modules/.bin/tsx scripts/icp-apply-workspace.ts --workspace=<uuid> --icp=<file.json>          # dry run
 *   node_modules/.bin/tsx scripts/icp-apply-workspace.ts --workspace=<uuid> --icp=<file.json> --apply
 *
 * 1. Saves the ICP to workspaces.settings.icp (other settings keys preserved).
 * 2. For every stored pixel event, re-reads the raw AudienceLab payload and, on
 *    the linked lead: sets the ICP score (intent_score_calculated), makes the
 *    work email primary (personal kept as secondary_email), adds LinkedIn, and
 *    sets/clears the `icp-match` tag.
 * 3. Creates leads for visitors that were dropped only because their work email
 *    was not AL-verified (work email + full name + company present).
 *
 * Service-role use: one-off support backfill; every read and write is filtered
 * by the single --workspace id.
 */
import { readFileSync } from 'node:fs'
import { createAdminClient } from '../src/lib/supabase/admin'
import { normalizeALPayload, flattenPayload } from '../src/lib/audiencelab/field-map'
import { icpProfileSchema } from '../src/lib/icp/profile'
import { scoreIcpFit, icpInputFromALRecord } from '../src/lib/icp/score'
import { resolveLeadContact } from '../src/lib/icp/contact'

const arg = (name: string) => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=')[1] ?? null
const APPLY = process.argv.includes('--apply')
const WORKSPACE = arg('workspace')
const ICP_FILE = arg('icp')
if (!WORKSPACE || !ICP_FILE) throw new Error('usage: --workspace=<uuid> --icp=<file.json> [--apply]')

type EventRow = { id: string; raw: Record<string, any> | null; lead_id: string | null; identity_id: string | null; received_at: string }
type LeadRow = { id: string; email: string | null; secondary_email: string | null; tags: string[] | null; intent_score_calculated: number | null }

async function pageAll<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 500) {
    const { data, error } = await fetchPage(from, from + 499)
    if (error) throw new Error(error.message)
    out.push(...(data || []))
    if (!data || data.length < 500) return out
  }
}

async function main() {
  const icp = icpProfileSchema.parse(JSON.parse(readFileSync(ICP_FILE!, 'utf8')))
  const db = createAdminClient()

  const { data: ws, error: wsErr } = await db.from('workspaces').select('id, name, settings').eq('id', WORKSPACE!).single()
  if (wsErr || !ws) throw new Error(`workspace not found: ${wsErr?.message}`)
  console.log(`workspace: ${ws.name} (${ws.id}) — ${APPLY ? 'APPLY' : 'DRY RUN'}`)

  const events = await pageAll<EventRow>((a, b) =>
    db.from('audiencelab_events').select('id, raw, lead_id, identity_id, received_at')
      .eq('workspace_id', WORKSPACE!).not('raw', 'is', null).order('received_at', { ascending: true }).range(a, b))
  const leads = await pageAll<LeadRow>((a, b) =>
    db.from('leads').select('id, email, secondary_email, tags, intent_score_calculated')
      .eq('workspace_id', WORKSPACE!).order('id').range(a, b))
  const leadById = new Map(leads.map(l => [l.id, l]))
  const emailsInUse = new Set(leads.map(l => (l.email || '').toLowerCase()).filter(Boolean))
  console.log(`events: ${events.length}, leads: ${leads.length}`)

  // Latest event per lead (and per unlinked identity) wins.
  const latestForLead = new Map<string, EventRow>()
  const unlinked = new Map<string, EventRow>()
  for (const e of events) {
    if (e.lead_id && leadById.has(e.lead_id)) latestForLead.set(e.lead_id, e)
    else if (!e.lead_id) unlinked.set(e.identity_id || e.id, e)
  }

  const stats = { scored: 0, matches: 0, emailSwitched: 0, emailConflict: 0, created: 0 }
  const updates: Array<{ id: string; patch: Record<string, unknown> }> = []

  for (const [leadId, e] of latestForLead) {
    const lead = leadById.get(leadId)!
    const normalized = normalizeALPayload(e.raw!)
    const input = icpInputFromALRecord(flattenPayload(e.raw!))
    const fit = scoreIcpFit(input, icp)
    const contact = resolveLeadContact(normalized, icp, input)
    const current = (lead.email || '').toLowerCase()
    const tags = new Set(lead.tags || [])
    fit.isMatch ? tags.add('icp-match') : tags.delete('icp-match')
    const patch: Record<string, unknown> = { intent_score_calculated: fit.score, tags: [...tags] }
    if (input.linkedinUrl) patch.individual_linkedin_url = input.linkedinUrl
    if (contact.email && contact.email !== current) {
      if (emailsInUse.has(contact.email)) {
        stats.emailConflict++
      } else {
        patch.email = contact.email
        patch.secondary_email = current || contact.secondaryEmail
        emailsInUse.add(contact.email)
        stats.emailSwitched++
      }
    }
    stats.scored++
    if (fit.isMatch) stats.matches++
    updates.push({ id: leadId, patch })
  }

  const creates: Array<{ event: EventRow; row: Record<string, unknown> }> = []
  for (const e of unlinked.values()) {
    const n = normalizeALPayload(e.raw!)
    const input = icpInputFromALRecord(flattenPayload(e.raw!))
    const contact = resolveLeadContact(n, icp, input)
    if (!contact.b2bQualified || !contact.email || emailsInUse.has(contact.email)) continue
    const fit = scoreIcpFit(input, icp)
    emailsInUse.add(contact.email)
    creates.push({
      event: e,
      row: {
        workspace_id: WORKSPACE,
        email: contact.email,
        secondary_email: contact.secondaryEmail,
        first_name: n.first_name,
        last_name: n.last_name,
        full_name: [n.first_name, n.last_name].filter(Boolean).join(' '),
        company_name: n.company_name,
        company_domain: n.company_domain,
        company_industry: n.company_industry,
        job_title: n.job_title,
        seniority_level: n.seniority_level,
        department: n.department,
        company_employee_count: n.company_employee_count,
        individual_linkedin_url: input.linkedinUrl,
        phone: n.phones[0] || null,
        city: n.city,
        state: n.state,
        state_code: n.state,
        source: 'superpixel',
        enrichment_status: 'enriched',
        delivery_status: 'pending',
        delivered_at: e.received_at,
        created_at: e.received_at,
        status: 'new',
        validated: false,
        verification_status: 'pending',
        qualification_score: n.deliverability_score,
        intent_score_calculated: fit.score,
        tags: fit.isMatch ? ['icp-match', 'unverified-work-email'] : ['unverified-work-email'],
      },
    })
  }
  stats.created = creates.length

  console.log(JSON.stringify(stats))
  for (const c of creates.slice(0, 25)) console.log('  create:', c.row.intent_score_calculated, c.row.job_title, '@', c.row.company_name, `<${c.row.email}>`)
  if (!APPLY) return console.log('dry run — nothing written. Re-run with --apply.')

  const settings = (ws.settings && typeof ws.settings === 'object' ? ws.settings : {}) as Record<string, unknown>
  const { error: setErr } = await db.from('workspaces').update({ settings: { ...settings, icp } }).eq('id', WORKSPACE!)
  if (setErr) throw new Error(`save icp: ${setErr.message}`)

  let failed = 0
  for (const u of updates) {
    const { error } = await db.from('leads').update(u.patch).eq('id', u.id).eq('workspace_id', WORKSPACE!)
    if (error) { failed++; console.error('update failed', u.id, error.message) }
  }
  for (const c of creates) {
    const { data, error } = await db.from('leads').insert(c.row).select('id').single()
    if (error || !data) { failed++; console.error('insert failed', c.row.email, error?.message); continue }
    await db.from('audiencelab_events').update({ lead_id: data.id }).eq('id', c.event.id).eq('workspace_id', WORKSPACE!)
    if (c.event.identity_id) await db.from('audiencelab_identities').update({ lead_id: data.id }).eq('id', c.event.identity_id)
  }
  console.log(`applied: ${updates.length} updated, ${creates.length} created, ${failed} failed`)
  if (failed > 0) process.exitCode = 1
}

main().catch(err => { console.error(err); process.exit(1) })
