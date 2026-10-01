/**
 * POST /api/start/claim  body: ClaimRequest -> ClaimResponse.
 * Records a pending claim and emails a magic link (next=/start/leads?c=<token>).
 * No credits are spent here: the 25-lead pull happens only after the mailbox is
 * verified, in GET /api/start/leads, and only with the emailed token (invariant 1).
 *
 * Answers `sent` for already-claimed addresses too, so the endpoint never reveals
 * who has claimed. An address that already has its leads gets a fresh login link.
 */
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { ClaimRequestSchema, type ClaimResponse } from '@/lib/free-leads/contract'
import { claimDecisionFor, companyDomain, emailDomain, emailKey, hashIp, isPersonalEmail, newClaimToken } from '@/lib/free-leads/rules'
import {
  claimIcp,
  findLatestClaimByEmail,
  isDomainTaken,
  rotateFulfilledClaimToken,
  upsertPendingClaim,
  type ClaimRow,
} from '@/lib/free-leads/claims'
import { icpToFilters } from '@/lib/free-leads/icp-to-filters'
import { hasMailExchanger } from '@/lib/free-leads/mx'
import { normalizeSiteUrl, siteDomain } from '@/lib/free-leads/site'
import { badRequest, clientIp, isLimited, readJson, serverError } from '@/lib/free-leads/http'
import { sendFreeLeadsReadyEmail } from '@/lib/email/templates/free-leads-ready'
import { createAdminClient } from '@/lib/supabase/admin'
import { APP_URL } from '@/lib/config/urls'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { recordStep, sessionIdFrom } from '@/lib/free-leads/funnel'
import { notifySales, slackSafe } from '@/lib/free-leads/notify'

const reply = (body: ClaimResponse) => NextResponse.json<ClaimResponse>(body)

/**
 * One-time login link for this mailbox. New auth users are created UNCONFIRMED;
 * verifying the magic link confirms the email (checked live against Supabase
 * 2026-09-30). generateLink on a missing user would instead return a signup-typed
 * token, which /auth/confirm (type=magiclink) rejects, hence createUser first.
 */
async function magicLinkFor(email: string, claimToken: string): Promise<string> {
  // Service role: auth.admin (createUser/generateLink) has no anon equivalent.
  const admin = createAdminClient()
  const created = await admin.auth.admin.createUser({ email, email_confirm: false })
  if (created.error && created.error.code !== 'email_exists') {
    throw new Error(`createUser failed: ${created.error.message}`)
  }
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const tokenHash = link.data?.properties?.hashed_token
  if (link.error || !tokenHash || link.data.properties.verification_type !== 'magiclink') {
    throw new Error(`generateLink failed: ${link.error?.message ?? `type ${link.data?.properties?.verification_type}`}`)
  }
  const next = `/start/leads?c=${encodeURIComponent(claimToken)}`
  return `${APP_URL}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&next=${encodeURIComponent(next)}`
}

async function sendLink(email: string, claimToken: string, website: string, icpSummary: string | undefined) {
  const loginUrl = await magicLinkFor(email, claimToken)
  return sendFreeLeadsReadyEmail({ to: email, loginUrl, domain: siteDomain(website), icpSummary })
}

/** Existing claim already has its leads: rotate the token and send a login link back to them (no new pull). */
async function relink(email: string, existing: ClaimRow) {
  const { token, hash } = newClaimToken()
  await rotateFulfilledClaimToken(existing.id, hash)
  return sendLink(email, token, existing.website, claimIcp(existing)?.summary)
}

export async function POST(req: NextRequest) {
  const parsed = ClaimRequestSchema.safeParse(await readJson(req))
  if (!parsed.success) return badRequest('Enter a valid work email.')
  const email = parsed.data.email.trim().toLowerCase()
  if (isPersonalEmail(email)) return reply({ status: 'personal_email' })

  const website = normalizeSiteUrl(parsed.data.website)
  if (!website) return badRequest('Enter a valid website.')

  // One free claim per registrable company domain (sub-domains of one company share it).
  const domain = companyDomain(email)
  // Before any cap is touched, so made-up domains cannot burn the send budget.
  if (!(await hasMailExchanger(emailDomain(email)))) return badRequest('Enter a valid work email.')

  const ip = clientIp(req)
  // Per IP, and per mailbox per day, so rotating IPs cannot email-bomb one address.
  if ((await isLimited('free-leads-claim', `ip:${ip}`)) || (await isLimited('free-leads-claim-email', `email:${emailKey(email)}`))) {
    return reply({ status: 'rate_limited' })
  }

  try {
    const [existing, domainTaken] = await Promise.all([findLatestClaimByEmail(email), isDomainTaken(domain)])
    const decision = claimDecisionFor(existing?.status ?? null, domainTaken)
    if (decision === 'silent') {
      safeLog('[start/claim] already claimed; nothing sent', { status: existing?.status ?? 'domain' })
      return reply({ status: 'sent' })
    }
    if (decision === 'relink') {
      const sent = await relink(email, existing as ClaimRow)
      if (!sent.success) return serverError('We could not send the email. Please try again.')
      safeLog('[start/claim] login link re-sent for fulfilled claim', {})
      return reply({ status: 'sent' })
    }
    // Pre-verification send cap (emails only; the paid pull has its own cap after verification).
    if (decision === 'new' && (await isLimited('free-leads-claim-global', 'global'))) {
      return reply({ status: 'rate_limited' })
    }

    const sessionId = sessionIdFrom(req)
    const { token, hash } = newClaimToken()
    await upsertPendingClaim({
      sessionId,
      email,
      emailDomain: domain,
      website,
      icp: parsed.data.icp,
      filters: icpToFilters(parsed.data.icp),
      ipHash: hashIp(ip),
      tokenHash: hash,
    })
    const sent = await sendLink(email, token, website, parsed.data.icp.summary)
    if (!sent.success) return serverError('We could not send the email. Please try again.')
    safeLog('[start/claim] magic link sent', { decision })
    const claim = await findLatestClaimByEmail(email)
    await recordStep(sessionId, 'claim', { patch: { email, ...(claim ? { claim_id: claim.id } : {}) } })
    if (decision === 'new') {
      await notifySales(
        `Free leads claim: ${slackSafe(email)} for ${slackSafe(siteDomain(website))}. ICP: ${slackSafe(parsed.data.icp.summary)}`
      )
    }
    return reply({ status: 'sent' })
  } catch (err) {
    safeError('[start/claim] claim failed', err)
    return serverError()
  }
}
