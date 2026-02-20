/**
 * Environment Configuration
 * Cursive Platform
 *
 * Type-safe environment variable access and validation.
 */

import { z } from 'zod'

// ============================================
// ENVIRONMENT SCHEMAS
// ============================================

/**
 * Client-side environment variables (NEXT_PUBLIC_*)
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
})

/**
 * Server-side environment variables
 */
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Email
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CAMPAIGN_WEBHOOK_SECRET: z.string().optional(),

  // Inngest
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  // EmailBison (campaign sending)
  EMAILBISON_API_KEY: z.string().optional(),
  EMAILBISON_API_URL: z.string().url().optional(),
  EMAILBISON_WEBHOOK_SECRET: z.string().optional(),

  // AI / LLM
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  FAL_KEY: z.string().optional(),
  FIRECRAWL_API_KEY: z.string().optional(),

  // Notifications
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  SLACK_SALES_WEBHOOK_URL: z.string().url().optional(),

  // Cron / Scheduled Jobs
  CRON_SECRET: z.string().optional(),

  // AudienceLab
  AUDIENCELAB_WEBHOOK_SECRET: z.string().optional(),
  AUDIENCELAB_ACCOUNT_API_KEY: z.string().optional(),

  // External APIs
  APOLLO_API_KEY: z.string().optional(),
  CLEARBIT_API_KEY: z.string().optional(),

  // App Config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// ============================================
// TYPE EXPORTS
// ============================================

export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

// ============================================
// VALIDATION
// ============================================

function validateClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  })

  if (!parsed.success) {
    console.error('Invalid client environment variables:')
    console.error(parsed.error.flatten().fieldErrors)

    throw new Error('Invalid client environment configuration')
  }

  return parsed.data
}

function validateServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_CAMPAIGN_WEBHOOK_SECRET: process.env.STRIPE_CAMPAIGN_WEBHOOK_SECRET,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    EMAILBISON_API_KEY: process.env.EMAILBISON_API_KEY,
    EMAILBISON_API_URL: process.env.EMAILBISON_API_URL || undefined,
    EMAILBISON_WEBHOOK_SECRET: process.env.EMAILBISON_WEBHOOK_SECRET,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    FAL_KEY: process.env.FAL_KEY,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || undefined,
    SLACK_SALES_WEBHOOK_URL: process.env.SLACK_SALES_WEBHOOK_URL || undefined,
    CRON_SECRET: process.env.CRON_SECRET,
    AUDIENCELAB_WEBHOOK_SECRET: process.env.AUDIENCELAB_WEBHOOK_SECRET,
    AUDIENCELAB_ACCOUNT_API_KEY: process.env.AUDIENCELAB_ACCOUNT_API_KEY,
    APOLLO_API_KEY: process.env.APOLLO_API_KEY,
    CLEARBIT_API_KEY: process.env.CLEARBIT_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  })

  if (!parsed.success) {
    console.error('Invalid server environment variables:')
    console.error(parsed.error.flatten().fieldErrors)

    throw new Error('Invalid server environment configuration')
  }

  return parsed.data
}

// ============================================
// ENVIRONMENT ACCESSORS
// ============================================

// Singleton instances
let _clientEnv: ClientEnv | null = null
let _serverEnv: ServerEnv | null = null

/**
 * Get validated client environment variables
 * Safe to use in browser and server
 */
export function getClientEnv(): ClientEnv {
  if (!_clientEnv) {
    _clientEnv = validateClientEnv()
  }
  return _clientEnv
}

/**
 * Get validated server environment variables
 * Only safe to use on server
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('Server environment variables cannot be accessed on the client')
  }

  if (!_serverEnv) {
    _serverEnv = validateServerEnv()
  }
  return _serverEnv
}

// ============================================
// CONVENIENCE ACCESSORS
// ============================================

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // Server-side
  const env = getClientEnv()
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL
  }

  // Fallback for development
  return 'http://localhost:3000'
}

/**
 * Check if a feature is enabled via environment variable
 */
export function isFeatureEnabled(featureName: string): boolean {
  const envVar = process.env[`FEATURE_${featureName.toUpperCase()}`]
  return envVar === 'true' || envVar === '1'
}

// ============================================
// ENVIRONMENT CHECK UTILITY
// ============================================

interface EnvCheckResult {
  valid: boolean
  missing: string[]
  warnings: string[]
}

/**
 * Check environment configuration completeness
 */
export function checkEnvironment(): EnvCheckResult {
  const missing: string[] = []
  const warnings: string[] = []

  // Required client vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  // Server-side checks
  if (typeof window === 'undefined') {
    // Production requirements
    if (isProduction()) {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
      if (!process.env.RESEND_API_KEY) warnings.push('RESEND_API_KEY (email will not work)')
      if (!process.env.STRIPE_SECRET_KEY) warnings.push('STRIPE_SECRET_KEY (payments will not work)')
      if (!process.env.CRON_SECRET) warnings.push('CRON_SECRET (cron jobs will be unauthenticated)')
      if (!process.env.ANTHROPIC_API_KEY) warnings.push('ANTHROPIC_API_KEY (AI features will not work)')
    }

    // Optional but recommended
    if (!process.env.INNGEST_EVENT_KEY) {
      warnings.push('INNGEST_EVENT_KEY (background jobs will not work)')
    }
    if (!process.env.EMAILBISON_API_KEY) {
      warnings.push('EMAILBISON_API_KEY (campaign email sending will not work)')
    }
    if (!process.env.EMAILBISON_WEBHOOK_SECRET) {
      warnings.push('EMAILBISON_WEBHOOK_SECRET (campaign webhook verification will not work)')
    }
    if (!process.env.AUDIENCELAB_ACCOUNT_API_KEY) {
      warnings.push('AUDIENCELAB_ACCOUNT_API_KEY (AudienceLab segment pulls will not work)')
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}

/**
 * Log environment check results
 */
export function logEnvironmentCheck(): void {
  const result = checkEnvironment()

  console.log('\n=== Environment Check ===')
  console.log(`Status: ${result.valid ? '✓ Valid' : '✗ Invalid'}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)

  if (result.missing.length > 0) {
    console.log('\nMissing required variables:')
    result.missing.forEach(v => console.log(`  ✗ ${v}`))
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:')
    result.warnings.forEach(v => console.log(`  ! ${v}`))
  }

  console.log('=========================\n')
}
