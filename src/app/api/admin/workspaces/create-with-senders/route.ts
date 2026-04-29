export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

// Creates a Cursive workspace tied to a set of EmailBison sender addresses.
// Used from the onboarding "+ New workspace" picker — admin sets up the EB
// sub-account / senders manually in EB, then comes back here, names the
// new workspace, and ticks which EB sender addresses belong to it. We
// create:
//   - one row in workspaces (id auto, slug unique, name)
//   - one row per chosen sender in email_accounts with provider='emailbison',
//     is_verified=true, workspace_id=new workspace
// Subsequent EB pushes for any onboarding client assigned to this workspace
// will only attach those senders (not the all-senders fallback).

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  sender_emails: z.array(z.string().email().toLowerCase()).min(1).max(50),
})

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'workspace'
  )
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { name, sender_emails } = schema.parse(body)

    const supabase = createAdminClient()
    const baseSlug = slugify(name)

    // Resolve a unique slug. Append -2, -3, ... if collision.
    let slug = baseSlug
    for (let attempt = 1; attempt <= 5; attempt++) {
      const { data: existing } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      if (!existing) break
      slug = `${baseSlug}-${attempt + 1}`
    }

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({ name, slug })
      .select('id, name, slug')
      .single()

    if (wsError || !workspace) {
      safeError('[Admin] Failed to create workspace:', wsError)
      return NextResponse.json(
        { error: wsError?.message ?? 'Failed to create workspace' },
        { status: 500 }
      )
    }

    // Insert one email_accounts row per sender. Provider is 'emailbison' —
    // these aren't OAuth-connected to Cursive, they're just attribution
    // markers so the EB push knows which senders to attach for this
    // workspace's campaigns.
    const accountsRows = sender_emails.map((email) => ({
      workspace_id: workspace.id,
      email_address: email,
      provider: 'emailbison',
      is_verified: true,
      display_name: name,
    }))

    const { error: accountsError } = await supabase
      .from('email_accounts')
      .insert(accountsRows)

    if (accountsError) {
      // Roll back: delete the workspace we just created so we don't leave
      // orphaned rows.
      await supabase.from('workspaces').delete().eq('id', workspace.id)
      safeError('[Admin] Failed to create email_accounts:', accountsError)
      return NextResponse.json(
        { error: accountsError.message ?? 'Failed to attach senders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
      senders_attached: sender_emails.length,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: err.format() }, { status: 400 })
    }
    safeError('[Admin] create-with-senders POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
