/**
 * Setup Wizard — the aha-moment onboarding
 *
 * Single-page flow (no multi-step wizard):
 *   1. User enters / confirms their URL
 *   2. We orchestrate pixel + AI ICP + targeting + lead pull in one shot
 *   3. User sees real, enriched leads on the same screen before /dashboard
 *
 * Runs AFTER workspace creation. New users are routed here from the
 * post-signup flow. Pixel install is a secondary CTA — not gating.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SetupWizard } from './setup-wizard'

export const metadata: Metadata = {
  title: 'Get Started | Cursive',
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ targeting_failed?: string }>
}) {
  const params = await searchParams
  const targetingFailed = params.targeting_failed === 'true'

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const admin = createAdminClient()
  const { data: userData } = await admin
    .from('users')
    .select('id, full_name, workspace_id, workspaces(name, industry_vertical)')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (!userData?.workspace_id) {
    redirect('/welcome')
  }

  // Read current state so we can pre-fill and decide which step to open on
  const [pixelResult, targetingResult] = await Promise.all([
    admin
      .from('audiencelab_pixels')
      .select('pixel_id, domain, snippet, install_url, is_active, trial_status, trial_ends_at')
      .eq('workspace_id', userData.workspace_id)
      .eq('is_active', true)
      .maybeSingle(),
    admin
      .from('user_targeting')
      .select('target_industries, target_states')
      .eq('user_id', userData.id)
      .eq('workspace_id', userData.workspace_id)
      .maybeSingle(),
  ])

  const existingPixel = pixelResult.data
  const existingTargeting = targetingResult.data

  const hasPixel = !!existingPixel
  const hasTargeting = !!(
    existingTargeting?.target_industries?.length ||
    existingTargeting?.target_states?.length
  )

  // Fully set up → don't trap users in an obsolete wizard.
  if (hasPixel && hasTargeting) {
    redirect('/dashboard')
  }

  // Pre-fill the URL input from the auto-provisioned pixel's domain (if any),
  // so the user only has to type something if they want to change it. Most
  // business signups already have a pixel auto-created from their email domain.
  const initialUrl = existingPixel?.domain ? `https://${existingPixel.domain}` : ''

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <SetupWizard
        initialUrl={initialUrl}
        userName={userData.full_name ?? null}
        targetingFailed={targetingFailed}
        existingPixel={
          existingPixel
            ? {
                pixel_id: existingPixel.pixel_id,
                domain: existingPixel.domain,
                install_url: existingPixel.install_url,
                snippet: existingPixel.snippet,
                trial_status: existingPixel.trial_status,
                trial_ends_at: existingPixel.trial_ends_at,
              }
            : null
        }
        existingTargeting={
          existingTargeting
            ? {
                target_industries: existingTargeting.target_industries ?? [],
                target_states: existingTargeting.target_states ?? [],
              }
            : null
        }
      />
    </div>
  )
}
