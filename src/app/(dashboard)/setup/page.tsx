/**
 * Setup Wizard — the aha-moment onboarding
 *
 * 3 steps, no Gmail required:
 *   1. Paste your website URL (creates pixel + AI extracts ICP)
 *   2. Confirm ICP (industries + geography pre-filled from the AI pass)
 *   3. Install pixel (copy snippet + live verification)
 *
 * Runs AFTER workspace creation. New users are routed here from the
 * post-signup flow. Returns to /dashboard when done (or skipped).
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SetupWizard } from './setup-wizard'

export const metadata: Metadata = {
  title: 'Get Started | Cursive',
}

export default async function SetupPage() {
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

  // If the user already has both pixel AND targeting, setup is done.
  // Don't trap them in an obsolete wizard — kick them to the dashboard.
  if (hasPixel && hasTargeting) {
    redirect('/dashboard')
  }

  // Pick the step the user should land on
  const initialStep: 1 | 2 | 3 = !hasPixel ? 1 : !hasTargeting ? 2 : 3

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <SetupWizard
        initialStep={initialStep}
        userName={userData.full_name ?? null}
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
