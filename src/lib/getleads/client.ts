/**
 * Minimal REST client for the upstream contact database (app.getleads.io).
 * Server-only. Never surface the vendor name or raw upstream messages to users.
 *
 *   countContacts   POST /api/v1/contacts/search/count  (free)
 *   searchContacts  POST /api/v1/contacts/search        (1 credit per returned row)
 */
import { z } from 'zod'

const BASE_URL = 'https://app.getleads.io'
// Title-heavy counts measured 10-17s on 2026-09-30; search stays well under this.
const TIMEOUT_MS = 20_000
// Paid searches: a 25-row pull measured 22.7s on 2026-09-30, and a request that
// times out on our side is still billed upstream. Give paid calls real headroom.
const SEARCH_TIMEOUT_MS = 60_000

export interface GetLeadsFilters {
  industries?: string[]
  job_titles?: string[]
  seniority?: string[]
  company_size?: string[]
  countries?: string[]
  office_states?: string[]
  email_status: ['VALID']
}

export type GetLeadsErrorCode = 'not_configured' | 'timeout' | 'network' | 'rejected' | 'invalid_response'

export class GetLeadsError extends Error {
  constructor(
    message: string,
    readonly code: GetLeadsErrorCode,
    readonly status?: number
  ) {
    super(message)
    this.name = 'GetLeadsError'
  }
}

// Upstream sends "" or null for missing values; normalize both to ''.
const str = z
  .string()
  .nullish()
  .transform((v) => v ?? '')

export const GetLeadsContactSchema = z.object({
  first_name: str,
  last_name: str,
  email_address: str,
  email_status: str,
  job_title: str,
  job_level: str,
  org_company_name: str,
  org_domain: str,
  org_industry_linkedin: str,
  employee_count_range: str,
  person_city: str,
  state_name: str,
  person_country_name: str,
  person_linkedin_url: str,
  cellphone: str,
})
export type GetLeadsContact = z.infer<typeof GetLeadsContactSchema>

const CountResponseSchema = z.object({
  ok: z.literal(true),
  total_matching: z.number().int().nonnegative(),
})

const SearchResponseSchema = z.object({
  ok: z.literal(true),
  contacts: z.array(GetLeadsContactSchema),
  total_available: z.number().int().nonnegative(),
})

/** Throws `not_configured` before any request is sent (lets callers tell pre-request failures apart). */
export function assertConfigured(): string {
  const apiKey = process.env.GETLEADS_API_KEY
  if (!apiKey) throw new GetLeadsError('Lead database API key is not configured', 'not_configured')
  return apiKey
}

async function post(path: string, body: unknown, timeoutMs: number = TIMEOUT_MS): Promise<unknown> {
  const apiKey = assertConfigured()

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    })
  } catch (err) {
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    throw new GetLeadsError(
      isTimeout ? `Lead database timed out after ${timeoutMs}ms` : 'Lead database network error',
      isTimeout ? 'timeout' : 'network'
    )
  }

  const json: unknown = await res.json().catch(() => null)
  const okFlag = (json as { ok?: unknown } | null)?.ok
  if (!res.ok || okFlag === false) {
    const upstream = (json as { message?: unknown } | null)?.message
    const detail = typeof upstream === 'string' ? upstream.slice(0, 200) : `HTTP ${res.status}`
    throw new GetLeadsError(`Lead database rejected request: ${detail}`, 'rejected', res.status)
  }
  return json
}

function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, json: unknown): T {
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    throw new GetLeadsError(`Lead database returned an unexpected shape: ${parsed.error.message.slice(0, 200)}`, 'invalid_response')
  }
  return parsed.data
}

/** Free. Number of contacts matching the filters. */
export async function countContacts(filters: GetLeadsFilters): Promise<number> {
  const json = await post('/api/v1/contacts/search/count', filters)
  return parse(CountResponseSchema, json).total_matching
}

/** Costs 1 credit per returned row. Keep `limit` as small as the caller truly needs. */
export async function searchContacts(
  filters: GetLeadsFilters,
  page: { limit: number; offset?: number }
): Promise<{ contacts: GetLeadsContact[]; totalAvailable: number }> {
  const limit = Math.max(1, Math.min(100, Math.floor(page.limit)))
  const json = await post('/api/v1/contacts/search', { ...filters, limit, offset: page.offset ?? 0 }, SEARCH_TIMEOUT_MS)
  const data = parse(SearchResponseSchema, json)
  return { contacts: data.contacts, totalAvailable: data.total_available }
}
