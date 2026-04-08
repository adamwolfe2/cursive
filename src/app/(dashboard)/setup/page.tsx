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

  // Fully set up → don't trap users in an obsolete wizard.
  if (hasPixel && hasTargeting) {
    redirect('/dashboard')
  }

  // Always start at step 1. Even when a pixel was auto-provisioned from the
  // user's email domain (which is most business signups), we still want the
  // user to confirm or correct the URL — their email domain is not always
  // their actual marketing site.
  const initialStep: 1 | 2 | 3 = 1

  // Pre-fill the URL input from the auto-provisioned pixel's domain (if any),
  // so the user only has to type something if they want to change it.
  const initialUrl = existingPixel?.domain ? `https://${existingPixel.domain}` : ''

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <SetupWizard
        initialStep={initialStep}
        initialUrl={initialUrl}
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
