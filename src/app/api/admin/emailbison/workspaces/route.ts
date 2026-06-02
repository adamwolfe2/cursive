// Admin endpoint for EmailBison workspace management.
// GET  — list all EB child workspaces (children only, not the root Adam's Team)
// POST — create a new EB child workspace (name only; connect senders in EB UI)

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import {
  listEBWorkspaces,
  createEBWorkspace,
} from '@/lib/integrations/emailbison'
import { getErrorMessage } from '@/lib/utils/error-helpers'

// Auth note: aligned with sibling admin onboarding routes (push-emailbison,
// assign-workspace, comments, approvals) which all use requireAdmin().
// The /admin layout already gates by users.role (owner|admin), so platform_admins
// strict membership added no protection here while breaking workspace owners
// who manage EB via the admin console.

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { workspaces } = await listEBWorkspaces()
    // Filter to child workspaces only (parent_id != null) so the picker
    // doesn't show the top-level "Adam's Team" root account.
    const children = workspaces
      .filter((w) => w.parent_id !== null)
      .sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json({ workspaces: children })
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
})

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'name must be 2-100 characters',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  try {
    const workspace = await createEBWorkspace(parsed.data.name)
    return NextResponse.json({ workspace }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
