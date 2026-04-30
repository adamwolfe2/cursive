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

    // Run checklist queries in parallel — one per step shown to the user.
    const [pixelResult, targetingResult, leadResult, crmResult, emailAccountResult] =
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

        // 3. Receive first lead — check leads table
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId),

        // 4. Connect a CRM — check crm_connections for active/connected status
        supabase
          .from('crm_connections')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
          .in('status', ['active', 'connected']),

        // 5. Connect email account — check email_accounts
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

    const hasLead = (leadResult.count ?? 0) > 0
    const hasCrm = (crmResult.count ?? 0) > 0
    const hasEmailAccount = (emailAccountResult.count ?? 0) > 0

    // Aha-moment ordering: pixel + ICP are the essentials, done together via
    // the /setup wizard. Email + CRM come later, only after the user has leads
    // worth following up on. Credits are a billing concern, not a setup step.
    const items: ChecklistItem[] = [
      {
        id: 'pixel',
        title: 'Install tracking pixel',
        description: 'Identify anonymous visitors on your website in real time.',
        completed: hasPixel,
        href: '/setup',
      },
      {
        id: 'preferences',
        title: 'Define your ideal customer',
        description: 'Tell us your target industries + geography so we match the right leads.',
        completed: hasPreferences,
        href: '/setup',
      },
      {
        id: 'first-lead',
        title: 'Get your first identified lead',
        description: 'Your pixel will surface enriched, verified leads automatically.',
        completed: hasLead,
        href: '/leads',
      },
      {
        id: 'connect_email_account',
        title: 'Connect your email',
        description: 'When you\'re ready to reach out, connect Gmail or any SMTP provider.',
        completed: hasEmailAccount,
        href: '/settings/email-accounts',
      },
      {
        id: 'crm',
        title: 'Connect your CRM (optional)',
        description: 'Sync leads to HubSpot, Salesforce, or Google Sheets.',
        completed: hasCrm,
        href: '/settings/integrations',
      },
    ]

    return NextResponse.json({ items })
  } catch (error) {
    safeError('[Onboarding Checklist] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 })
  }
}
