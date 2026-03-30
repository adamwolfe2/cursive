import { NextRequest, NextResponse } from 'next/server'
import { fastAuth } from '@/lib/auth/fast-auth'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

export interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  href: string
}

export async function GET(request: NextRequest) {
  try {
    const user = await fastAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const workspaceId = user.workspaceId

    // Run all six checklist queries in parallel
    const [pixelResult, targetingResult, creditResult, leadResult, crmResult, emailAccountResult] =
      await Promise.all([
        // 1. Install tracking pixel — check audiencelab_pixels
        supabase
          .from('audiencelab_pixels')
          .select('pixel_id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .eq('is_active', true),

        // 2. Set lead preferences — check user_targeting
        supabase
          .from('user_targeting')
          .select('is_active, target_industries, target_states')
          .eq('workspace_id', workspaceId)
          .maybeSingle(),

        // 3. Buy your first credits — check credit_purchases
        supabase
          .from('credit_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId),

        // 4. Receive your first lead — check leads table
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId),

        // 5. Connect a CRM — check crm_connections for active/connected status
        supabase
          .from('crm_connections')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .in('status', ['active', 'connected']),

        // 6. Connect email account — check email_accounts
        supabase
          .from('email_accounts')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId),
      ])

    // Evaluate completion state for each step
    const hasPixel = (pixelResult.count ?? 0) > 0

    const targetingData = targetingResult.data
    const hasPreferences = !!(
      targetingData?.target_industries?.length ||
      targetingData?.target_states?.length
    )

    const hasCredits = (creditResult.count ?? 0) > 0

    const hasLead = (leadResult.count ?? 0) > 0

    const hasCrm = (crmResult.count ?? 0) > 0

    const hasEmailAccount = (emailAccountResult.count ?? 0) > 0

    const items: ChecklistItem[] = [
      {
        id: 'pixel',
        title: 'Install tracking pixel',
        description: 'Add the Cursive pixel to your website to identify anonymous visitors.',
        completed: hasPixel,
        href: '/settings/pixel',
      },
      {
        id: 'preferences',
        title: 'Set lead preferences',
        description: 'Choose your target industries and locations so we match the right leads.',
        completed: hasPreferences,
        href: '/my-leads/preferences',
      },
      {
        id: 'credits',
        title: 'Buy your first credits',
        description: 'Purchase enrichment credits to reveal verified contact info on your leads.',
        completed: hasCredits,
        href: '/settings/billing',
      },
      {
        id: 'first-lead',
        title: 'Receive your first lead',
        description: 'Fresh leads are delivered every morning at 8am CT based on your preferences.',
        completed: hasLead,
        href: '/leads',
      },
      {
        id: 'crm',
        title: 'Connect a CRM',
        description: 'Sync leads directly to HubSpot, Salesforce, or another CRM.',
        completed: hasCrm,
        href: '/crm',
      },
      {
        id: 'connect_email_account',
        title: 'Connect Email Account',
        description: 'Connect your email sending account to enable outreach sequences.',
        completed: hasEmailAccount,
        href: '/settings/email-accounts',
      },
    ]

    return NextResponse.json({ items })
  } catch (error) {
    safeError('[Onboarding Checklist] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 })
  }
}
