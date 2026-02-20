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
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CRON_SECRET',
  'AUDIENCELAB_WEBHOOK_SECRET',
  'ANTHROPIC_API_KEY',
] as const

const OPTIONAL_WITH_WARNING = [
  'SLACK_WEBHOOK_URL',
  'EMAILBISON_API_KEY',
  'EMAILBISON_API_URL',
  'EMAILBISON_WEBHOOK_SECRET',
  'GHL_CURSIVE_LOCATION_TOKEN',
  'RESEND_API_KEY',
  'INNGEST_EVENT_KEY',
  'INNGEST_SIGNING_KEY',
  'FAL_KEY',
  'FIRECRAWL_API_KEY',
  'AUDIENCELAB_ACCOUNT_API_KEY',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const

let validated = false

/**
 * Validates that all required environment variables are set.
 * Throws a descriptive error if any are missing.
 * Logs warnings for optional but recommended variables.
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

  // Check optional vars and warn
  const missingOptional: string[] = []
  for (const envVar of OPTIONAL_WITH_WARNING) {
    if (!process.env[envVar]) {
      missingOptional.push(envVar)
    }
  }

  if (missingOptional.length > 0) {
    console.warn(
      `[WARN] Missing optional environment variables (some features may not work):\n${missingOptional.map((v) => `  - ${v}`).join('\n')}`
    )
  }

  validated = true
}
