/**
 * Next.js Instrumentation
 * Runs once on server startup before any requests are handled.
 *
 * PURPOSE: Prevent GoTrueClient _recoverAndRefresh() background rejections
 * from crashing Vercel serverless function instances.
 *
 * When supabase.auth.getUser() or createServerClient() is called, GoTrueClient
 * starts a background _recoverAndRefresh() task. If the token refresh fails
 * (e.g. on expired/missing session), this emits an unhandledRejection which
 * can kill the Node.js process on Vercel, causing cascading 504s on all
 * in-flight requests in the same function instance.
 *
 * This handler catches those rejections and logs them as warnings instead of
 * allowing them to crash the process.
 */

export async function register() {
  // Validate critical environment variables once at startup (not per-request in middleware).
  // Wrapped in try/catch because this file may be resolved by other Next.js projects
  // in the monorepo (e.g. marketing site) that don't have this module.
  try {
    const { validateRequiredEnvVars } = await import('@/lib/env-validation')
    validateRequiredEnvVars()
  } catch {
    // Module not available (e.g. marketing site) — skip validation
  }

  // @sentry/nextjs 8+ does not load sentry.*.config.ts by itself: without these imports the server never
  // initialized Sentry and every server-side error was invisible.
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('../sentry.server.config')
  if (process.env.NEXT_RUNTIME === 'edge') await import('../sentry.edge.config')

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.on('unhandledRejection', (reason: unknown) => {
      const message =
        reason instanceof Error ? reason.message : String(reason ?? '')

      // Suppress GoTrueClient background token-refresh errors — these are
      // expected when users have expired sessions or missing cookies.
      // They must NOT crash the function instance (which would 504 all other
      // in-flight requests).
      if (
        message.includes('_recoverAndRefresh') ||
        message.includes('GoTrueClient') ||
        message.includes('Auth session missing') ||
        message.includes('invalid JWT') ||
        message.includes('JWT expired') ||
        message.includes('not authenticated') ||
        message.includes('Invalid Refresh Token')
      ) {
        // Silently suppress — these are expected background auth failures
        return
      }

      // Log unexpected unhandled rejections (don't crash for any of them)
      // NOTE: Using console.error directly here — this file must be self-contained
      // because it runs before the app initializes and may be resolved by other
      // Next.js projects in the monorepo (e.g. marketing site).
      console.error('[UnhandledRejection] Unhandled promise rejection:', message)
    })

    // No uncaughtException listener here on purpose. Next's server already installs one that logs
    // and keeps the process alive. Re-throwing from a listener is fatal: a client disconnecting
    // mid-request emits ECONNRESET "aborted" on the IncomingMessage, which then killed the whole
    // instance (and every in-flight request on it).
  }
}

/** Uncaught errors in route handlers, server components and middleware go to Sentry. */
export async function onRequestError(...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>) {
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(...args)
}
