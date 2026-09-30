/**
 * POST /api/start/event  body: { step }  header: x-fl-session  -> 204.
 * Public: records a funnel step only the browser can see (ICP approved, CSV downloaded).
 * Allowlisted steps, valid uuid session, per-IP rate limit; grants nothing.
 */
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { ClientEventSchema } from '@/lib/free-leads/contract'
import { recordStep, sessionIdFrom } from '@/lib/free-leads/funnel'
import { badRequest, clientIp, isLimited, rateLimited, readJson } from '@/lib/free-leads/http'

export async function POST(req: NextRequest) {
  const parsed = ClientEventSchema.safeParse(await readJson(req))
  const sessionId = sessionIdFrom(req)
  if (!parsed.success || !sessionId) return badRequest('Invalid event')
  if (await isLimited('free-leads-event', `ip:${clientIp(req)}`)) return rateLimited()
  await recordStep(sessionId, parsed.data.step)
  return new NextResponse(null, { status: 204 })
}
