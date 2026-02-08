/**
 * Onboarding Setup API
 * Creates workspace + user profile using admin client (bypasses RLS)
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { inngest } from '@/inngest/client'
import { z } from 'zod'

const businessSchema = z.object({
  role: z.literal('business'),
  businessName: z.string().min(1, 'Business name is required'),
  industry: z.string().min(1, 'Industry is required'),
})

const partnerSchema = z.object({
  role: z.literal('partner'),
  companyName: z.string().min(1, 'Company name is required'),
})

const setupSchema = z.discriminatedUnion('role', [businessSchema, partnerSchema])

export async function POST(request: NextRequest) {
  try {
    // 1. Verify auth session server-side
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Parse and validate body
    const body = await request.json()
    const validated = setupSchema.parse(body)

    // 3. Use admin client (service role) to bypass RLS
    const admin = createAdminClient()

    // 4. Check if user already has a workspace
    const { data: existingUser } = await admin
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (existingUser?.workspace_id) {
      return NextResponse.json(
        { error: 'User already has a workspace', workspace_id: existingUser.workspace_id },
        { status: 409 }
      )
    }

    if (validated.role === 'business') {
      const slug = validated.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Check slug availability
      const { data: existing } = await admin
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Business name is taken. Please try another.' },
          { status: 409 }
        )
      }

      // Create workspace
      const { data: workspace, error: workspaceError } = await admin
        .from('workspaces')
        .insert({
          name: validated.businessName,
          slug,
          subdomain: slug,
          industry_vertical: validated.industry,
          allowed_industries: [validated.industry],
          allowed_regions: ['US'],
          onboarding_status: 'completed',
        })
        .select('id')
        .single()

      if (workspaceError) {
        console.error('[Onboarding] Workspace creation failed:', workspaceError)
        return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
      }

      // Create user profile
      const { error: userError } = await admin
        .from('users')
        .insert({
          auth_user_id: authUser.id,
          workspace_id: workspace.id,
          email: authUser.email!,
          full_name: authUser.user_metadata.full_name || authUser.user_metadata.name || null,
          role: 'owner',
          plan: 'free',
          daily_credit_limit: 3,
          daily_credits_used: 0,
          active_subscription: false,
          partner_approved: false,
        })

      if (userError) {
        // Rollback workspace
        await admin.from('workspaces').delete().eq('id', workspace.id)
        console.error('[Onboarding] User creation failed:', userError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }

      // Non-blocking Slack notification
      sendSlackAlert({
        type: 'new_signup',
        severity: 'info',
        message: `New business signup: ${validated.businessName}`,
        metadata: {
          email: authUser.email,
          name: authUser.user_metadata.full_name || authUser.user_metadata.name || 'N/A',
          business: validated.businessName,
          industry: validated.industry,
          workspace_id: workspace.id,
        },
      }).catch(() => {})

      // Non-blocking GHL onboard (creates contact in Cursive's GHL CRM)
      inngest.send({
        name: 'ghl-admin/onboard-customer',
        data: {
          user_id: authUser.id,
          user_email: authUser.email!,
          user_name: authUser.user_metadata.full_name || authUser.user_metadata.name || 'Customer',
          workspace_id: workspace.id,
          purchase_type: 'free_signup',
          amount: 0,
        },
      }).catch(() => {})

      return NextResponse.json({ workspace_id: workspace.id })

    } else {
      // Partner flow
      const slug = validated.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Create workspace
      const { data: workspace, error: workspaceError } = await admin
        .from('workspaces')
        .insert({
          name: validated.companyName,
          slug,
          subdomain: slug,
          onboarding_status: 'completed',
        })
        .select('id')
        .single()

      if (workspaceError) {
        console.error('[Onboarding] Partner workspace creation failed:', workspaceError)
        return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
      }

      // Create partner user
      const { error: userError } = await admin
        .from('users')
        .insert({
          auth_user_id: authUser.id,
          workspace_id: workspace.id,
          email: authUser.email!,
          full_name: authUser.user_metadata.full_name || authUser.user_metadata.name || null,
          role: 'partner',
          plan: 'free',
          partner_approved: false,
          active_subscription: true,
        })

      if (userError) {
        // Rollback workspace
        await admin.from('workspaces').delete().eq('id', workspace.id)
        console.error('[Onboarding] Partner user creation failed:', userError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }

      // Non-blocking Slack notification
      sendSlackAlert({
        type: 'new_signup',
        severity: 'info',
        message: `New partner signup: ${validated.companyName}`,
        metadata: {
          email: authUser.email,
          name: authUser.user_metadata.full_name || authUser.user_metadata.name || 'N/A',
          company: validated.companyName,
          role: 'partner',
          workspace_id: workspace.id,
        },
      }).catch(() => {})

      // Non-blocking GHL onboard (creates contact in Cursive's GHL CRM)
      inngest.send({
        name: 'ghl-admin/onboard-customer',
        data: {
          user_id: authUser.id,
          user_email: authUser.email!,
          user_name: authUser.user_metadata.full_name || authUser.user_metadata.name || 'Partner',
          workspace_id: workspace.id,
          purchase_type: 'partner_signup',
          amount: 0,
        },
      }).catch(() => {})

      return NextResponse.json({ workspace_id: workspace.id })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[Onboarding] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
