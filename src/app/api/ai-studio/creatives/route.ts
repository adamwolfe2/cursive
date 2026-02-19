/**
 * Ad Creatives API Routes
 * GET /api/ai-studio/creatives - List creatives
 * POST /api/ai-studio/creatives - Generate new creative
 */

export const maxDuration = 60 // Fal.ai Flux Pro generation can take up to 30s
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { generateAdCreative } from '@/lib/ai-studio/image-generation'
import { safeError } from '@/lib/utils/log-sanitizer'
import { z } from 'zod'

const generateSchema = z.object({
  workspaceId: z.string(),
  prompt: z.string().min(1, 'Prompt is required'),
  stylePreset: z.enum(['Write with Elegance', 'Flow of Creativity', 'Handcrafted Perfection', 'Timeless Style']).optional(),
  format: z.enum(['square', 'story', 'landscape']).default('square'),
  icpId: z.string().optional(),
  offerId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace parameter required' }, { status: 400 })
    }

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

    // Fetch creatives for the workspace
    const { data: creatives, error } = await supabase
      .from('ad_creatives')
      .select('*, customer_profiles(name, title), offers(name)')
      .eq('brand_workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      safeError('[Creatives GET] Database error:', error)
      throw new Error('Failed to fetch creatives')
    }

    return NextResponse.json({ creatives: creatives || [] })
  } catch (error: any) {
    safeError('[Creatives GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creatives' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, prompt, stylePreset, format, icpId, offerId } = generateSchema.parse(body)

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

    // 1. Get workspace with brand data and knowledge base
    const { data: workspace, error: workspaceError } = await supabase
      .from('brand_workspaces')
      .select('*, customer_profiles(*), offers(*)')
      .eq('id', workspaceId)
      .eq('workspace_id', userData.workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Get selected ICP and offer
    const icp = icpId
      ? workspace.customer_profiles?.find((p: any) => p.id === icpId)
      : null

    const offer = offerId
      ? workspace.offers?.find((o: any) => o.id === offerId)
      : null

    // 3. Generate creative with comprehensive brand intelligence
    const result = await generateAdCreative({
      prompt,
      brandData: workspace.brand_data,
      knowledgeBase: workspace.knowledge_base,  // Full brand intelligence
      icp,
      offer,
      stylePreset,
      format,
      quality: 'high',  // Always use high quality for best results
    })

    // 4. Save creative to database
    const { data: creative, error: saveError } = await supabase
      .from('ad_creatives')
      .insert({
        brand_workspace_id: workspaceId,
        icp_id: icpId || null,
        offer_id: offerId || null,
        image_url: result.imageUrl,
        prompt,
        style_preset: stylePreset || null,
        format,
        generation_status: 'completed',
      })
      .select('id, brand_workspace_id, icp_id, offer_id, image_url, prompt, style_preset, format, generation_status, created_at')
      .single()

    if (saveError) {
      safeError('[Creatives POST] Save error:', saveError)
      throw new Error('Failed to save creative')
    }

    return NextResponse.json({ creative, message: 'Creative generated successfully' })
  } catch (error: any) {
    safeError('[Creatives] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate creative' },
      { status: 500 }
    )
  }
}
