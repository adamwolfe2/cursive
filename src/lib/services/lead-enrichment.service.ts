/**
 * Lead Enrichment Top-Up
 *
 * For a verified-but-sparse AL record, re-enrich the SAME person via /enrich and
 * fill ONLY the missing fields before the record becomes a client-facing lead.
 * This is the one place AudienceLab's enrichment API actively earns its keep:
 * most records arrive fully populated, so this runs only for the minority that
 * assessLeadQuality() flags with needsEnrichment.
 *
 * Guarantees:
 *  - Never overwrites existing data (fills empty fields only).
 *  - Never blocks delivery: any failure / no-match returns the original record.
 */

import { enrich } from '@/lib/audiencelab/api-client'
import type { ALEnrichedProfile, ALEnrichFilter } from '@/lib/audiencelab/api-client'
import { pickBestEmail } from '@/lib/audiencelab/provision-helpers'
import { safeError } from '@/lib/utils/log-sanitizer'

// Scalar identity/company fields we backfill from a top-up enrich.
const TOPUP_FIELDS = [
  'FIRST_NAME',
  'LAST_NAME',
  'JOB_TITLE',
  'SENIORITY_LEVEL',
  'DEPARTMENT',
  'COMPANY_NAME',
  'COMPANY_DOMAIN',
  'COMPANY_INDUSTRY',
  'COMPANY_STATE',
  'COMPANY_CITY',
  'PERSONAL_STATE',
  'PERSONAL_CITY',
] as const

function isEmpty(v: unknown): boolean {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  return false
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

/**
 * Gated top-up: only spends an AL /enrich call when the record actually needs
 * it (assessLeadQuality flagged needsEnrichment) AND the feature is not killed
 * via `LEAD_ENRICH_TOPUP=off`. Safe to drop into any ingestion path.
 */
export async function maybeEnrichTopUp(
  record: ALEnrichedProfile,
  needsEnrichment: boolean
): Promise<ALEnrichedProfile> {
  if (!needsEnrichment) return record
  if (process.env.LEAD_ENRICH_TOPUP === 'off') return record
  return enrichTopUp(record)
}

export async function enrichTopUp(record: ALEnrichedProfile): Promise<ALEnrichedProfile> {
  // Prefer the verified email (same-person match); fall back to company domain.
  const email = pickBestEmail(record)
  const domain = asString((record as Record<string, unknown>).COMPANY_DOMAIN).trim()
  const filter: ALEnrichFilter | null = email
    ? { email }
    : domain
      ? { company_domain: domain }
      : null
  if (!filter) return record

  try {
    const res = await enrich({ filter })
    const match = res.found > 0 ? res.result?.[0] : null
    if (!match) return record

    const merged: Record<string, unknown> = { ...record }
    const src = match as Record<string, unknown>
    for (const field of TOPUP_FIELDS) {
      if (isEmpty(merged[field]) && !isEmpty(src[field])) {
        merged[field] = src[field]
      }
    }
    return merged as ALEnrichedProfile
  } catch (err) {
    safeError('[enrichTopUp] /enrich failed; delivering original record:', err)
    return record
  }
}
