/** POST /api/start/refine  body: { icp, instruction }  -> RefineResponse. Public; model call; rate-limited per IP. */
export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse, type NextRequest } from 'next/server'
import { RefineRequestSchema, type RefineResponse } from '@/lib/free-leads/contract'
import { refineIcp, ScanError } from '@/lib/free-leads/scan'
import { icpToFilters } from '@/lib/free-leads/icp-to-filters'
import { countContacts } from '@/lib/getleads/client'
import { badRequest, clientIp, isLimited, rateLimited, readJson, serverError } from '@/lib/free-leads/http'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function POST(req: NextRequest) {
  const parsed = RefineRequestSchema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest('Invalid request')
  if (await isLimited('free-leads-refine', `ip:${clientIp(req)}`)) return rateLimited()
  if (await isLimited('free-leads-refine-global', 'global')) return rateLimited('Edits are busy right now. Try again tomorrow.')

  try {
    const { icp, note } = await refineIcp(parsed.data.icp, parsed.data.instruction)
    const total = await countContacts(icpToFilters(icp))
    return NextResponse.json<RefineResponse>({ icp, note, total })
  } catch (err) {
    safeError('[start/refine] refine failed', err instanceof ScanError ? `${err.code}: ${err.message}` : err)
    return serverError('We could not apply that change. Try rephrasing it.')
  }
}
