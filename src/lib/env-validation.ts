/**
 * Environment Variable Validation
 * Cursive Platform
 *
 * Validates that critical environment variables are present at startup.
 * Import this in middleware or root layout to catch misconfigurations early.
 */

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

let validated = false

/**
 * Validates that all required environment variables are set.
 * Throws a descriptive error if any are missing.
 * Only runs once per process lifecycle (cached after first call).
 */
export function validateRequiredEnvVars(): void {
  if (validated) {
    return
  }

  const missing: string[] = []

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    const message = [
      '[FATAL] Missing required environment variables:',
      ...missing.map((v) => `  - ${v}`),
      '',
      'The application cannot start without these variables.',
      'Check your .env.local file or deployment environment configuration.',
    ].join('\n')

    console.error(message)
    throw new Error(message)
  }

  validated = true
}
