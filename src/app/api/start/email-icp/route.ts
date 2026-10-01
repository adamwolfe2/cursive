/**
 * POST /api/start/email-icp  body: { email, website, icp }  -> EmailIcpResponse.
 * Public "Email me this profile": soft capture for visitors not ready to claim. Any mailbox
 * (personal allowed) but it must have MX; capped per IP, per mailbox and globally because it
 * sends mail to an address the caller chooses. Anti-relay: the email carries only the ICP our own
 * scan produced for this session's site (read server-side), never text from the request body.
 * No credits.
 */
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { EmailIcpRequestSchema, type EmailIcpResponse } from '@/lib/free-leads/contract'
import { emailDomain } from '@/lib/free-leads/rules'
import { hasMailExchanger } from '@/lib/free-leads/mx'
import { normalizeSiteUrl, siteDomain } from '@/lib/free-leads/site'
import { recordStep, sessionIcp, sessionIdFrom } from '@/lib/free-leads/funnel'
import { badRequest, clientIp, isLimited, readJson, serverError } from '@/lib/free-leads/http'
import { sendFreeLeadsProfileEmail } from '@/lib/email/templates/free-leads-profile'
import { safeLog } from '@/lib/utils/log-sanitizer'

const reply = (body: EmailIcpResponse) => NextResponse.json<EmailIcpResponse>(body)

export async function POST(req: NextRequest) {
  const parsed = EmailIcpRequestSchema.safeParse(await readJson(req))
  if (!parsed.success) return reply({ status: 'invalid_email' })
  const website = normalizeSiteUrl(parsed.data.website)
  if (!website) return badRequest('Enter a valid website.')
  const email = parsed.data.email.trim().toLowerCase()
  if (!(await hasMailExchanger(emailDomain(email)))) return reply({ status: 'invalid_email' })

  if (
    (await isLimited('free-leads-email-icp', `ip:${clientIp(req)}`)) ||
    (await isLimited('free-leads-email-icp-email', `email:${email}`)) ||
    (await isLimited('free-leads-email-icp-global', 'global'))
  ) {
    return reply({ status: 'rate_limited' })
  }

  const domain = siteDomain(website)
  const sessionId = sessionIdFrom(req)
  const scanned = sessionId ? await sessionIcp(sessionId) : null
  if (!scanned || scanned.domain !== domain) return badRequest('Scan your site first, then we can email the profile.')
  const sent = await sendFreeLeadsProfileEmail({ to: email, domain, icp: scanned.icp })
  if (!sent.success) return serverError('We could not send the email. Please try again.')
  safeLog('[start/email-icp] profile sent', {})
  await recordStep(sessionId, 'icp_emailed', { patch: { email } })
  return reply({ status: 'sent' })
}
