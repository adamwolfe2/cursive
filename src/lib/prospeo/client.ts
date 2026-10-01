/**
 * Minimal client for the email-finder vendor (api.prospeo.io). Server-only.
 * Never surface the vendor name or raw upstream messages to users, and never log names or emails.
 *
 *   findWorkEmail  POST /enrich-person  (1 credit per match; NO_MATCH is free with only_verified_email)
 */
import { z } from 'zod'

const BASE_URL = 'https://api.prospeo.io'
export const LOOKUP_TIMEOUT_MS = 10_000
/** Approximate $ per credit on the current plan (override with PROSPEO_CREDIT_USD). */
const creditUsd = Number(process.env.PROSPEO_CREDIT_USD)
export const PROSPEO_CREDIT_USD = Number.isFinite(creditUsd) && creditUsd >= 0 && process.env.PROSPEO_CREDIT_USD ? creditUsd : 0.04

export type ProspeoErrorCode = 'not_configured' | 'timeout' | 'network' | 'rejected' | 'invalid_response'

export class ProspeoError extends Error {
  constructor(message: string, readonly code: ProspeoErrorCode, readonly status?: number) {
    super(message)
    this.name = 'ProspeoError'
  }
}

const ResponseSchema = z.object({
  error: z.boolean(),
  error_code: z.string().nullish(),
  person: z
    .object({ email: z.object({ status: z.string().nullish(), email: z.string().nullish() }).nullish() })
    .nullish(),
})

export interface WorkEmailQuery {
  firstName: string
  lastName: string
  /** Company domain or website. */
  companyDomain?: string
  linkedinUrl?: string
}

export function prospeoConfigured(): boolean {
  return Boolean(process.env.PROSPEO_API_KEY)
}

/** True when the query has enough to identify a person (name plus a company domain or LinkedIn URL). */
export function canLookUp(q: WorkEmailQuery): boolean {
  return Boolean(q.linkedinUrl || (q.firstName && q.lastName && q.companyDomain))
}

/**
 * Work email for one person, or null when there is no match. Only a verified address is returned
 * (an unverified match is neither returned nor charged). Throws ProspeoError on any other failure.
 */
export async function findWorkEmail(q: WorkEmailQuery, timeoutMs: number = LOOKUP_TIMEOUT_MS): Promise<string | null> {
  const apiKey = process.env.PROSPEO_API_KEY
  if (!apiKey) throw new ProspeoError('Email finder is not configured', 'not_configured')

  const data = q.linkedinUrl
    ? { linkedin_url: q.linkedinUrl }
    : { first_name: q.firstName, last_name: q.lastName, company_website: q.companyDomain }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/enrich-person`, {
      method: 'POST',
      headers: { 'X-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ only_verified_email: true, data }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    })
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    throw new ProspeoError(timedOut ? 'lookup timed out' : 'lookup network error', timedOut ? 'timeout' : 'network')
  }

  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new ProspeoError('lookup returned a non-JSON body', 'invalid_response', res.status)
  }
  const parsed = ResponseSchema.safeParse(json)
  if (!parsed.success) throw new ProspeoError('lookup response failed validation', 'invalid_response', res.status)

  const body = parsed.data
  if (body.error) {
    if (body.error_code === 'NO_MATCH') return null
    throw new ProspeoError(`lookup rejected (${body.error_code ?? res.status})`, 'rejected', res.status)
  }
  if (!res.ok) throw new ProspeoError('lookup rejected', 'rejected', res.status)
  const email = body.person?.email?.email?.trim().toLowerCase()
  return email && email.includes('@') ? email : null
}
