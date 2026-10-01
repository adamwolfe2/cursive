/**
 * Small-niche email rescue. When the email-ready pool is thinner than FREE_LEAD_COUNT, make ONE extra
 * pull of the same filters without the email filter, fit-score it, and look up work emails for the
 * best-fit people who lack one, only up to the shortfall. Runs inside the single paid attempt; never
 * retried; always fails open (the caller delivers what it already has). Logs counts only, never PII.
 */
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { searchContacts, type GetLeadsContact, type GetLeadsFilters } from '@/lib/getleads/client'
import { canLookUp, findWorkEmail, LOOKUP_TIMEOUT_MS, prospeoConfigured } from '@/lib/prospeo/client'
import { isLimited } from './http'
import { FREE_LEAD_COUNT, type Icp } from './contract'
import { claudeUsd } from './cost'
import { scoreLeads, selectFitLeads, type LeadFit } from './lead-fit'

/** Hard cap on lookups per claim. */
export const MAX_EMAIL_LOOKUPS = 30
export const MAX_EXTRA_PULL = 30
const LOOKUP_CONCURRENCY = 5
const RESCUE_BUDGET_MS = 25_000

export interface RescueResult {
  /** Rescued people, best fit first, each with a usable email. */
  leads: Array<{ item: GetLeadsContact; fit: LeadFit | null }>
  /** Lead-database credits spent by the extra pull. */
  extraCredits: number
  lookups: { tried: number; found: number }
  /** Model spend for fit-scoring the extra rows. */
  fitUsd: number
}

const EMPTY: RescueResult = { leads: [], extraCredits: 0, lookups: { tried: 0, found: 0 }, fitUsd: 0 }

const personKey = (c: GetLeadsContact) =>
  [c.first_name, c.last_name, c.org_domain, c.person_linkedin_url].map((v) => v.trim().toLowerCase()).join('|')

const hasEmail = (c: GetLeadsContact) => c.email_status === 'VALID' && c.email_address.includes('@')

export async function rescueThinPool(args: {
  filters: GetLeadsFilters
  icp: Icp | null
  website: string
  /** Everyone already pulled (email or not), for dedupe. */
  seen: readonly GetLeadsContact[]
  /** Email-ready people already in hand. */
  have: number
}): Promise<RescueResult> {
  const shortfall = FREE_LEAD_COUNT - args.have
  if (shortfall <= 0) return EMPTY
  if (!prospeoConfigured()) {
    safeLog('[free-leads/rescue] skipped: email finder not configured', { shortfall })
    return EMPTY
  }
  // Check the daily budget BEFORE buying the extra pull; this slot is spent by the first lookup.
  let preAllowed = await isLimited('free-leads-email-lookup-global', 'all').then((l) => !l)
  if (!preAllowed) {
    safeLog('[free-leads/rescue] skipped: daily lookup cap reached', { shortfall })
    return EMPTY
  }
  const allow = async () => {
    if (preAllowed) {
      preAllowed = false
      return true
    }
    return !(await isLimited('free-leads-email-lookup-global', 'all'))
  }

  let fitUsd = 0
  // The one place the email filter is intentionally absent (the type pins it for every other caller).
  const unfiltered = { ...args.filters, email_status: undefined } as unknown as GetLeadsFilters
  const limit = Math.min(MAX_EXTRA_PULL, shortfall * 2)
  let extra: GetLeadsContact[]
  try {
    extra = (await searchContacts(unfiltered, { limit, offset: 0 })).contacts
  } catch (err) {
    safeError('[free-leads/rescue] extra pull failed; delivering as is', err)
    return EMPTY
  }
  const extraCredits = extra.length

  try {
    const known = new Set(args.seen.map(personKey))
    const fresh = extra.filter((c) => {
      const key = personKey(c)
      if (known.has(key)) return false
      known.add(key)
      return true
    })
    const fits = args.icp
      ? await scoreLeads(args.icp, args.website, fresh, {
          delivery: true,
          onUsage: ({ usage, model }) => (fitUsd += claudeUsd(model, usage)),
        })
      : null
    const ranked = selectFitLeads(fresh, fits, fresh.length)

    const leads: RescueResult['leads'] = []
    const queue: typeof ranked = []
    for (const r of ranked) {
      if (hasEmail(r.item)) leads.push(r)
      else if (canLookUp(toQuery(r.item))) queue.push(r)
    }
    leads.splice(shortfall)

    const lookups = { tried: 0, found: 0 }
    const deadline = Date.now() + RESCUE_BUDGET_MS
    const found: typeof ranked = []
    const need = shortfall - leads.length
    // Batches never exceed what is still needed, so a hit is never bought and thrown away.
    let at = 0
    while (found.length < need && lookups.tried < MAX_EMAIL_LOOKUPS && at < queue.length && Date.now() < deadline) {
      const size = Math.min(LOOKUP_CONCURRENCY, need - found.length, MAX_EMAIL_LOOKUPS - lookups.tried)
      const batch: typeof queue = []
      while (batch.length < size && at < queue.length && (await allow())) batch.push(queue[at++])
      if (!batch.length) break
      lookups.tried += batch.length
      const timeout = Math.min(LOOKUP_TIMEOUT_MS, Math.max(1_000, deadline - Date.now()))
      const results = await Promise.all(
        batch.map(async (r) => {
          try {
            return await findWorkEmail(toQuery(r.item), timeout)
          } catch (err) {
            safeError('[free-leads/rescue] lookup failed', (err as { code?: string }).code ?? 'unknown')
            return null
          }
        })
      )
      results.forEach((email, i) => {
        if (email) found.push({ item: { ...batch[i].item, email_address: email, email_status: 'VALID' }, fit: batch[i].fit })
      })
    }
    lookups.found = found.length
    safeLog('[free-leads/rescue] done', { shortfall, pulled: extraCredits, direct: leads.length, tried: lookups.tried, found: lookups.found })
    return { leads: [...leads, ...found], extraCredits, lookups, fitUsd }
  } catch (err) {
    safeError('[free-leads/rescue] failed after the extra pull; delivering as is', err)
    return { ...EMPTY, extraCredits, fitUsd }
  }
}

const toQuery = (c: GetLeadsContact) => ({
  firstName: c.first_name,
  lastName: c.last_name,
  companyDomain: c.org_domain || undefined,
  linkedinUrl: c.person_linkedin_url || undefined,
})
