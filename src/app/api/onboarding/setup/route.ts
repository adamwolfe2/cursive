/**
 * Onboarding Setup API
 * Creates workspace + user profile + targeting using admin client (bypasses RLS)
 */

import { NextResponse, type NextRequest, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { FREE_TRIAL_CREDITS } from '@/lib/constants/credit-packages'
import { z } from 'zod'
import { safeError } from '@/lib/utils/log-sanitizer'

// Monthly lead need → daily/weekly/monthly caps
const LEAD_CAPS: Record<string, { daily: number; weekly: number; monthly: number }> = {
  '10-25 leads': { daily: 2, weekly: 10, monthly: 25 },
  '25-50 leads': { daily: 3, weekly: 15, monthly: 50 },
  '50-100 leads': { daily: 5, weekly: 25, monthly: 100 },
  '100-250 leads': { daily: 10, weekly: 65, monthly: 250 },
  '250+ leads': { daily: 15, weekly: 75, monthly: 300 },
}

// US state name → abbreviation mapping
const STATE_MAP: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY',
}

// Region → state codes
const REGION_MAP: Record<string, string[]> = {
  'northeast': ['CT', 'ME', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
  'southeast': ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
  'midwest': ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
  'southwest': ['AZ', 'NM', 'OK', 'TX'],
  'west': ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY'],
}

/** Parse free-text location string into state codes */
function parseTargetLocations(raw: string | undefined): string[] {
  if (!raw || raw.toLowerCase() === 'national' || raw.toLowerCase() === 'nationwide') {
    return [] // empty = no geo filter = matches all
  }

  const states = new Set<string>()
  const parts = raw.split(/[,;]+/).map(p => p.trim().toLowerCase()).filter(Boolean)

  for (const part of parts) {
    // Check exact state abbreviation (2-letter)
    const upper = part.toUpperCase()
    if (upper.length === 2 && Object.values(STATE_MAP).includes(upper)) {
      states.add(upper)
      continue
    }
    // Check full state name
    if (STATE_MAP[part]) {
      states.add(STATE_MAP[part])
      continue
    }
    // Check region names
    const regionKey = Object.keys(REGION_MAP).find(r => part.includes(r))
    if (regionKey) {
      for (const code of REGION_MAP[regionKey]) states.add(code)
      continue
    }
    // If nothing matched, store the raw string as-is (user might type city names etc.)
    states.add(part)
  }

  return Array.from(states)
}

// Allow up to 60s on Pro plan (Hobby caps at 10s regardless)
export const maxDuration = 60

const businessSchema = z.object({
  role: z.literal('business'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  companyName: z.string().min(1),
  industry: z.string().min(1),
  targetLocations: z.string().optional(),
  monthlyLeadNeed: z.string().min(1),
})

const partnerSchema = z.object({
  role: z.literal('partner'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  companyName: z.string().min(1),
  partnerType: z.string().min(1),
  primaryVerticals: z.string().min(1),
  databaseSize: z.string().min(1),
  enrichmentMethods: z.string().optional(),
  linkedin: z.string().min(1),
  website: z.string().optional(),
})

const setupSchema = z.discriminatedUnion('role', [businessSchema, partnerSchema])

/** Fire-and-forget: send Inngest event without blocking response */
function fireInngestEvent(eventData: { name: string; data: Record<string, any> }): void {
  try {
    // Lazy-import to avoid module-level init issues
    const { inngest } = require('@/inngest/client')

    // Explicitly void the promise to indicate fire-and-forget pattern
    void inngest.send(eventData).catch((error: unknown) => {
      safeError('[Onboarding] Inngest event send failed:', error)
      // Don't throw - this is intentionally non-blocking
      return null
    })
  } catch (error) {
    safeError('[Onboarding] Inngest client init failed:', error)
    // Don't throw - this is intentionally non-blocking
  }
}

export async function POST(request: NextRequest) {
  try {
    // NOTE: safeError used instead of console.log/console.error because
    // production next.config.js strips console.log AND Vercel runtime logs
    // don't reliably surface console.error through the logs API.
    safeError('[Onboarding] Starting POST request')

    // 1. Verify auth session server-side (with timeout)
    const supabase = await createClient()

    const authResult = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth getUser timeout (8s)')), 8000)
      ),
    ])
    const authUser = authResult.data?.user
    const authError = authResult.error

    safeError('[Onboarding] Auth check:', { hasUser: !!authUser, authError: authError?.message })

    if (!authUser) {
      safeError('[Onboarding] No auth user - returning 401')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Parse and validate body
    const body = await request.json()
    safeError('[Onboarding] Received body:', { role: body.role, email: body.email })

    const validated = setupSchema.parse(body)

    // 3. Use admin client (service role) to bypass RLS
    safeError('[Onboarding] Creating admin client...')
    const admin = createAdminClient()

    // 3b. Verify admin client connectivity
    const { error: connError } = await admin
      .from('workspaces')
      .select('id')
      .limit(1)

    if (connError) {
      safeError('[Onboarding] Admin client connectivity FAILED:', { message: connError.message, code: connError.code })
      return NextResponse.json(
        { error: 'Database connection failed', detail: connError.message },
        { status: 500 }
      )
    }
    safeError('[Onboarding] Admin client connected OK')

    // 4. Check if user already has a workspace
    const { data: existingUser } = await admin
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle()

    if (existingUser?.workspace_id) {
      return NextResponse.json(
        { error: 'User already has a workspace', workspace_id: existingUser.workspace_id },
        { status: 409 }
      )
    }

    // 5. Generate slug from company name
    const slug = validated.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    safeError('[Onboarding] Generated slug:', slug)

    // 6. Check slug availability (both business AND partner flows)
    const { data: existingSlug } = await admin
      .from('workspaces')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Company name is taken. Please try another.' },
        { status: 409 }
      )
    }

    // 7. Create workspace
    const workspaceInsert = validated.role === 'business'
      ? {
          name: validated.companyName,
          slug,
          subdomain: slug,
          industry_vertical: validated.industry,
          allowed_industries: [validated.industry],
          allowed_regions: validated.targetLocations ? parseTargetLocations(validated.targetLocations) : ['US'],
          onboarding_status: 'completed',
        }
      : {
          name: validated.companyName,
          slug,
          subdomain: slug,
          onboarding_status: 'completed',
        }

    safeError('[Onboarding] Inserting workspace:', JSON.stringify(workspaceInsert))

    const { data: workspace, error: workspaceError } = await admin
      .from('workspaces')
      .insert(workspaceInsert)
      .select('id')
      .single()

    if (workspaceError) {
      safeError('[Onboarding] Workspace creation FAILED:', {
        message: workspaceError.message,
        code: workspaceError.code,
        details: workspaceError.details,
        hint: workspaceError.hint
      })
      return NextResponse.json(
        { error: 'Failed to create workspace', detail: workspaceError.message, code: workspaceError.code },
        { status: 500 }
      )
    }

    safeError('[Onboarding] Workspace created:', workspace.id)

    // 8. Create user profile
    // NOTE: Only use columns that exist in the users table.
    // is_partner (boolean) replaces the old partner_approved/active_subscription.
    const fullName = `${validated.firstName} ${validated.lastName}`
    const userInsert = validated.role === 'business'
      ? {
          auth_user_id: authUser.id,
          workspace_id: workspace.id,
          email: validated.email,
          full_name: fullName,
          role: 'owner' as const,
          plan: 'free' as const,
          daily_credit_limit: 3,
          daily_credits_used: 0,
          is_partner: false,
          // Daily lead distribution segments
          industry_segment: validated.industry?.toLowerCase().replace(/\s+/g, '_'),
          location_segment: validated.targetLocations?.toLowerCase().replace(/\s+/g, '_').split(',')[0] || 'us',
          daily_lead_limit: 10, // Free tier gets 10 daily leads
          is_active: true,
        }
      : {
          auth_user_id: authUser.id,
          workspace_id: workspace.id,
          email: validated.email,
          full_name: fullName,
          role: 'partner' as const,
          plan: 'free' as const,
          is_partner: true,
        }

    safeError('[Onboarding] Inserting user for auth_user_id:', authUser.id)

    const { data: userProfile, error: userError } = await admin
      .from('users')
      .insert(userInsert)
      .select('id')
      .single()

    if (userError) {
      // Rollback: delete the workspace we just created
      await admin.from('workspaces').delete().eq('id', workspace.id)
      safeError('[Onboarding] User creation FAILED:', {
        message: userError.message,
        code: userError.code,
        details: userError.details,
        hint: userError.hint
      })
      return NextResponse.json(
        { error: 'Failed to create user profile', detail: userError.message, code: userError.code },
        { status: 500 }
      )
    }

    safeError('[Onboarding] User created:', userProfile.id)

    // 9. Grant free trial credits
    try {
      const { error: creditsError } = await admin
        .from('workspace_credits')
        .insert({
          workspace_id: workspace.id,
          balance: FREE_TRIAL_CREDITS.credits,
          total_purchased: 0,
          total_used: 0,
          total_earned: FREE_TRIAL_CREDITS.credits,
        })

      if (creditsError) {
        throw new Error(`Failed to initialize credits: ${creditsError.message}`)
      }

      const { error: grantError } = await admin
        .from('free_credit_grants')
        .insert({
          workspace_id: workspace.id,
          user_id: userProfile.id,
          credits_granted: FREE_TRIAL_CREDITS.credits,
        })

      if (grantError) {
        throw new Error(`Failed to record credit grant: ${grantError.message}`)
      }
    } catch (creditError) {
      // Rollback: delete user and workspace
      await admin.from('users').delete().eq('id', userProfile.id)
      await admin.from('workspaces').delete().eq('id', workspace.id)
      safeError('[Onboarding] Credit grant FAILED:', creditError instanceof Error ? creditError.message : creditError)
      return NextResponse.json(
        { error: 'Failed to grant free credits', detail: creditError instanceof Error ? creditError.message : 'Unknown' },
        { status: 500 }
      )
    }

    safeError('[Onboarding] Credits granted.')

    // 10. Create user targeting for business users (enables lead routing)
    if (validated.role === 'business') {
      try {
        const targetStates = parseTargetLocations(validated.targetLocations)
        const caps = LEAD_CAPS[validated.monthlyLeadNeed] || LEAD_CAPS['25-50 leads']

        await admin
          .from('user_targeting')
          .insert({
            user_id: userProfile.id,
            workspace_id: workspace.id,
            target_industries: [validated.industry],
            target_states: targetStates,
            target_cities: [],
            target_zips: [],
            target_sic_codes: [],
            daily_lead_cap: caps.daily,
            weekly_lead_cap: caps.weekly,
            monthly_lead_cap: caps.monthly,
            is_active: true,
          })

        safeError('[Onboarding] User targeting created:', {
          industries: [validated.industry],
          states: targetStates,
          caps,
        })
      } catch (targetingError) {
        // Non-fatal: user can set targeting later from dashboard
        safeError('[Onboarding] User targeting creation failed (non-fatal):', targetingError instanceof Error ? targetingError.message : targetingError)
      }
    }

    safeError('[Onboarding] Returning success.')

    // Build the response FIRST, then fire non-blocking side effects
    const response = NextResponse.json({ workspace_id: workspace.id })

    // Non-blocking logo fetch from email domain — runs after response via next/server after()
    const GENERIC_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com', 'mail.com', 'live.com', 'msn.com']
    const emailDomain = validated.email.split('@')[1]?.toLowerCase()
    if (emailDomain && !GENERIC_DOMAINS.includes(emailDomain)) {
      const workspaceId = workspace.id
      after(async () => {
        try {
          const { getCompanyEnrichmentService } = await import('@/lib/services/company-enrichment.service')
          const enrichmentService = getCompanyEnrichmentService()
          const logoUrl = await enrichmentService.fetchLogo(emailDomain)
          if (logoUrl) {
            const afterAdmin = createAdminClient()
            await afterAdmin
              .from('workspaces')
              .update({ branding: { logo_url: logoUrl } })
              .eq('id', workspaceId)
            safeError('[Onboarding] Logo fetched and saved:', { domain: emailDomain, logoUrl })
          }
        } catch (logoError) {
          safeError('[Onboarding] Logo fetch failed (non-fatal):', logoError instanceof Error ? logoError.message : logoError)
        }
      })
    }

    // Non-blocking Slack notification (fire-and-forget)
    const slackMetadata = validated.role === 'business'
      ? {
          email: validated.email,
          name: fullName,
          company: validated.companyName,
          industry: validated.industry,
          target_locations: validated.targetLocations || 'Not specified',
          monthly_lead_need: validated.monthlyLeadNeed,
          workspace_id: workspace.id,
          free_credits: FREE_TRIAL_CREDITS.credits,
        }
      : {
          email: validated.email,
          name: fullName,
          company: validated.companyName,
          partner_type: validated.partnerType,
          verticals: validated.primaryVerticals,
          database_size: validated.databaseSize,
          enrichment: validated.enrichmentMethods || 'Not specified',
          linkedin: validated.linkedin,
          website: validated.website || 'Not specified',
          workspace_id: workspace.id,
          free_credits: FREE_TRIAL_CREDITS.credits,
        }

    sendSlackAlert({
      type: 'new_signup',
      severity: 'info',
      message: `New ${validated.role} signup: ${validated.companyName} (${FREE_TRIAL_CREDITS.credits} free credits granted)`,
      metadata: slackMetadata,
    }).catch((error) => {
      safeError('[Onboarding] Slack notification failed:', error)
    })

    // Non-blocking GHL onboard (fire-and-forget, lazy-loaded to avoid blocking)
    fireInngestEvent({
      name: 'ghl-admin/onboard-customer',
      data: {
        user_id: authUser.id,
        user_email: authUser.email!,
        user_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || validated.firstName,
        workspace_id: workspace.id,
        purchase_type: validated.role === 'business' ? 'free_signup' : 'partner_signup',
        amount: 0,
      },
    })

    return response
  } catch (error) {
    safeError('[Onboarding] Caught error:', error instanceof Error ? error.message : error)
    safeError('[Onboarding] Stack:', error instanceof Error ? error.stack : 'no stack')

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
