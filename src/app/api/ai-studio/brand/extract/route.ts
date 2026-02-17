/**
 * Brand Extraction API Route
 * POST /api/ai-studio/brand/extract
 * Extracts brand DNA from a website URL using Firecrawl
 */

// NOTE: Cannot use Edge runtime — firecrawl-js depends on undici which requires Node.js APIs.
// This route will hang on Vercel's Node.js serverless (known platform issue).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { extractBrandDNA, isValidUrl } from '@/lib/ai-studio/firecrawl'
import { generateKnowledgeBase, generateCustomerProfiles } from '@/lib/ai-studio/knowledge'
import { safeError } from '@/lib/utils/log-sanitizer'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const PROCESSING_TIMEOUT = 60000 // 60 seconds

const extractSchema = z.object({
  url: z.string().url('Invalid URL format'),
})

export async function POST(request: NextRequest) {
  try {
    // Check if API keys are set
    if (!process.env.FIRECRAWL_API_KEY) {
      safeError('[Brand Extract] FIRECRAWL_API_KEY not set')
      return NextResponse.json(
        { error: 'Required service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
      safeError('[Brand Extract] No AI API key set')
      return NextResponse.json(
        { error: 'Required service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // 1. Authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Validate input
    const body = await request.json()
    const { url } = extractSchema.parse(body)

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 3. Check if workspace already exists for this URL
    const { data: existing } = await (supabase as any)
      .from('brand_workspaces')
      .select('id, name, extraction_status')
      .eq('workspace_id', user.workspace_id)
      .eq('url', url)
      .single()

    if (existing) {
      return NextResponse.json({
        workspaceId: existing.id,
        name: existing.name,
        status: existing.extraction_status,
        message: 'Workspace already exists for this URL'
      })
    }

    // 4. Create workspace record (status: processing)
    const { data: workspace, error: workspaceError } = await (supabase as any)
      .from('brand_workspaces')
      .insert({
        user_id: user.auth_user_id,
        workspace_id: user.workspace_id,
        name: 'Processing...',
        url,
        extraction_status: 'processing',
      })
      .select('id, name')
      .single()

    if (workspaceError) {
      throw new Error(`Failed to create workspace: ${workspaceError.message}`)
    }

    // 5. Extract brand DNA with Firecrawl (async - don't await)
    processBrandExtractionWithTimeout(workspace.id, url, supabase)

    // 6. Return immediately with workspace ID
    return NextResponse.json({
      workspaceId: workspace.id,
      name: workspace.name,
      status: 'processing',
      message: 'Brand extraction started. This may take 30-60 seconds.'
    })

  } catch (error: any) {
    safeError('[Brand Extract] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to extract brand DNA' },
      { status: 500 }
    )
  }
}

/**
 * Wraps processBrandExtraction with a timeout to prevent indefinite "processing" state
 */
async function processBrandExtractionWithTimeout(
  workspaceId: string,
  url: string,
  supabase: SupabaseClient<Database>
) {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Processing timed out')), PROCESSING_TIMEOUT)
  )

  try {
    await Promise.race([
      processBrandExtraction(workspaceId, url, supabase),
      timeoutPromise,
    ])
  } catch (error: any) {
    safeError('[Brand Extract] Background extraction failed:', error)
    await (supabase as any)
      .from('brand_workspaces')
      .update({
        extraction_status: 'error',
        extraction_error: error.message,
      })
      .eq('id', workspaceId)
  }
}

/**
 * Background process for brand extraction
 */
async function processBrandExtraction(
  workspaceId: string,
  url: string,
  supabase: SupabaseClient<Database>
) {
  try {
    // Step 1: Extract brand DNA with Firecrawl
    const firecrawlResult = await extractBrandDNA(url)

    // Step 2: Generate knowledge base with OpenAI
    const knowledgeBase = await generateKnowledgeBase(
      firecrawlResult.markdown,
      firecrawlResult.brandData
    )

    // Step 3: Update workspace with extracted data
    await (supabase as any)
      .from('brand_workspaces')
      .update({
        name: firecrawlResult.brandData.company_name,
        logo_url: firecrawlResult.brandData.logo_url,
        favicon_url: firecrawlResult.brandData.favicon_url,
        brand_data: {
          colors: {
            primary: firecrawlResult.brandData.primary_color,
            secondary: firecrawlResult.brandData.secondary_color,
            accent: firecrawlResult.brandData.accent_color,
            background: firecrawlResult.brandData.background_color,
          },
          typography: {
            heading: firecrawlResult.brandData.heading_font,
            body: firecrawlResult.brandData.body_font,
          },
          headline: firecrawlResult.brandData.headline,
          images: firecrawlResult.brandData.images,
          screenshot: firecrawlResult.screenshot,
        },
        knowledge_base: knowledgeBase,
        extraction_status: 'completed',
        extraction_error: null,
      })
      .eq('id', workspaceId)

    // Step 4: Generate customer profiles
    const profiles = await generateCustomerProfiles(knowledgeBase)

    // Step 5: Insert customer profiles
    const profilesData = profiles.map(profile => ({
      brand_workspace_id: workspaceId,
      name: profile.name,
      title: profile.title,
      description: profile.description,
      demographics: profile.demographics,
      pain_points: profile.pain_points,
      goals: profile.goals,
      preferred_channels: profile.preferred_channels,
    }))

    await (supabase as any)
      .from('customer_profiles')
      .insert(profilesData)

    // Step 6: Extract and create offers
    const offersData = knowledgeBase.products_services.map(product => ({
      brand_workspace_id: workspaceId,
      name: product.name,
      description: product.description,
      source: 'extracted',
      status: 'active',
    }))

    if (offersData.length > 0) {
      await (supabase as any)
        .from('offers')
        .insert(offersData)
    }

  } catch (error: any) {
    safeError('[Brand Extract] Background process error:', error)
    throw error
  }
}
