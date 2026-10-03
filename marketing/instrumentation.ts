/**
 * Marketing-local instrumentation hook (intentionally empty).
 *
 * On Vercel the build's tracing/Turbopack root is the repo root, so without this file Next picks up
 * the app's src/instrumentation.ts, which imports Sentry and app-only modules marketing does not
 * install, and the build fails. A file here takes precedence and keeps marketing self-contained.
 */
export function register() {}
