/**
 * Ad Creatives API Routes
 * GET /api/ai-studio/creatives - List creatives
 * POST /api/ai-studio/creatives - Generate new creative
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { generateAdCreative } from '@/lib/ai-studio/image-generation'
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

    // Fetch creatives for the workspace
    const { data: creatives, error } = await supabase
      .from('ad_creatives')
      .select('*, customer_profiles(name, title), offers(name)')
      .eq('brand_workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch creatives: ${error.message}`)
    }

    return NextResponse.json({ creatives: creatives || [] })
  } catch (error: any) {
    console.error('[Creatives] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch creatives' },
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

    // 1. Get workspace with brand data and knowledge base
    const { data: workspace, error: workspaceError } = await supabase
      .from('brand_workspaces')
      .select('*, customer_profiles(*), offers(*)')
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      throw new Error('Workspace not found')
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
      .select()
      .single()

    if (saveError) {
      throw new Error(`Failed to save creative: ${saveError.message}`)
    }

    return NextResponse.json({ creative, message: 'Creative generated successfully' })
  } catch (error: any) {
    console.error('[Creatives] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate creative' },
      { status: 500 }
    )
  }
}
