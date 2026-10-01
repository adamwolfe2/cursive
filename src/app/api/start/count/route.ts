/** POST /api/start/count  body: { icp }  -> CountResponse. Public; free upstream call; rate-limited per IP. */
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { IcpRequestSchema, type CountResponse } from '@/lib/free-leads/contract'
import { icpToFilters } from '@/lib/free-leads/icp-to-filters'
import { cachedCount } from '@/lib/free-leads/cache'
import { badRequest, clientIp, isLimited, rateLimited, readJson, serverError } from '@/lib/free-leads/http'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(req: NextRequest) {
  const parsed = IcpRequestSchema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest('Invalid profile')
  if (await isLimited('free-leads-count', `ip:${clientIp(req)}`)) return rateLimited()
  // Upstream rate limits are shared with paid deliveries: a count flood must not starve them.
  if (await isLimited('free-leads-count-global', 'global')) return rateLimited('Counts are busy right now. Try again shortly.')

  try {
    const total = await cachedCount(icpToFilters(parsed.data.icp))
    return NextResponse.json<CountResponse>({ total })
  } catch (err) {
    safeError('[start/count] count failed', err)
    return serverError('We could not count matches just now. Please try again.')
  }
}
