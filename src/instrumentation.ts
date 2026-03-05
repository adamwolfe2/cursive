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
      console.error('[UnhandledRejection] Unhandled promise rejection:', message)
    })

    // Also suppress unhandledRejection warnings printed by Node for GoTrue
    process.on('uncaughtException', (err: Error) => {
      const message = err?.message ?? ''
      if (
        message.includes('_recoverAndRefresh') ||
        message.includes('GoTrueClient') ||
        message.includes('Auth session missing')
      ) {
        return
      }
      // Re-throw unexpected uncaught exceptions to preserve original behavior
      throw err
    })
  }
}
