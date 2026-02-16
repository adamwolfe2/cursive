/**
 * Offers API Routes
 * GET /api/ai-studio/offers - List offers for a workspace
 * POST /api/ai-studio/offers - Create a manual offer
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'

const querySchema = z.object({
  workspace: z.string().min(1, 'Invalid workspace ID format').regex(/^[a-zA-Z0-9-]+$/, 'Invalid workspace ID format'),
})

const createOfferSchema = z.object({
  workspace: z.string().min(1, 'Workspace ID required'),
  name: z.string().min(1, 'Offer name is required').max(200, 'Name must be 200 characters or less'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be 1000 characters or less'),
  pricing: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceParam = searchParams.get('workspace')

    if (!workspaceParam) {
      return NextResponse.json({ error: 'workspace parameter required' }, { status: 400 })
    }

    // Validate input
    const validationResult = querySchema.safeParse({ workspace: workspaceParam })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid workspace ID format' },
        { status: 400 }
      )
    }

    const { workspace: workspaceId } = validationResult.data

    const supabase = await createClient()

    // Verify brand workspace belongs to user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: brandWorkspace } = await supabase
      .from('brand_workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('workspace_id', userData.workspace_id)
      .single()

    if (!brandWorkspace) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch offers for the workspace
    const { data: offers, error } = await supabase
      .from('offers')
      .select('id, brand_workspace_id, name, description, pricing, source, status, created_at, updated_at')
      .eq('brand_workspace_id', workspaceId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      safeError('[Offers] Database error:', error)
      throw new Error('Failed to fetch offers')
    }

    return NextResponse.json({ offers: offers || [] })
  } catch (error: any) {
    safeError('[Offers] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai-studio/offers
 * Create a new manual offer
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createOfferSchema.parse(body)
    const { workspace: workspaceId, name, description, pricing } = validated

    const supabase = await createClient()

    // Verify brand workspace belongs to user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: brandWorkspace } = await supabase
      .from('brand_workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('workspace_id', userData.workspace_id)
      .single()

    if (!brandWorkspace) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create the offer
    const { data: newOffer, error: insertError } = await (supabase as any)
      .from('offers')
      .insert({
        brand_workspace_id: workspaceId,
        name,
        description,
        pricing: pricing || null,
        source: 'manual',
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      safeError('[Offers] Insert error:', insertError)
      throw new Error('Failed to create offer')
    }

    return NextResponse.json(
      {
        success: true,
        offer: newOffer,
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    safeError('[Offers] Create error:', error)
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    )
  }
}
