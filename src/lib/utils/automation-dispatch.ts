/**
 * Helpers for dispatching server-to-server fetches from Next.js server actions
 * to internal API routes (typically inside `after()` for fire-and-forget work).
 *
 * Why this exists:
 *   Several admin server actions kick off background work via HTTP fetches to
 *   our own API routes (see actions.ts in /admin/onboarding). Those routes
 *   are protected by `AUTOMATION_SECRET` OR an admin session. Server-to-server
 *   fetches do NOT carry browser cookies by default, so when AUTOMATION_SECRET
 *   is missing or empty in env, the runner returned 401 — which surfaced as
 *   "copy_regeneration_dispatch failed: Runner returned 401".
 *
 *   This helper:
 *     1. Forwards the current admin's session cookies so `requireAdmin()` on
 *        the runner side passes (auth fallback path).
 *     2. Attaches the AUTOMATION_SECRET header if it's set (primary path).
 *
 * Either path is sufficient — the runner accepts whichever arrives valid.
 */

import { cookies } from 'next/headers'

/**
 * Build the headers for an authenticated server-to-server fetch from a server
 * action to one of our protected internal API routes.
 *
 * MUST be called from inside a server action (or a server component) because
 * `cookies()` reads the request scope. Calling it from a background timer or
 * worker outside a request scope will throw.
 *
 * Captures cookies SYNCHRONOUSLY from the current request, so it's safe to
 * use the returned headers later inside `after(...)` — by then the request
 * scope is gone, but we've already snapshotted the cookies.
 *
 * @param extra optional extra headers to merge in (e.g. a custom dispatch ID)
 */
export async function buildAutomationHeaders(
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  }

  // Snapshot the session cookies. Runner's `requireAdmin()` validates these.
  try {
    const store = await cookies()
    const cookieHeader = store
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ')
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }
  } catch {
    // No request scope (e.g. called from a cron). Continue without cookies;
    // the AUTOMATION_SECRET path below should handle this case.
  }

  // Attach AUTOMATION_SECRET if present — primary auth path. If unset, we
  // rely on the cookies above. If both are unset/invalid, the runner returns
  // 401 and the caller logs the dispatch failure.
  const secret = process.env.AUTOMATION_SECRET
  if (secret && secret.length > 0) {
    headers['x-automation-secret'] = secret
  }

  return headers
}

/**
 * Convenience wrapper: snapshot headers + return a fetch-ready RequestInit
 * with method=POST, JSON body, and the authenticated headers attached.
 */
export async function buildAutomationRequestInit(
  body?: unknown,
  extra: Record<string, string> = {},
): Promise<RequestInit> {
  const headers = await buildAutomationHeaders(extra)
  const init: RequestInit = {
    method: 'POST',
    headers,
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }
  return init
}
