/**
 * Campaign Builder API - List & Create
 * Sales.co-style campaign crafting
 */


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CampaignBuilderRepository } from '@/lib/repositories/campaign-builder.repository'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

const createDraftSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
})

/**
 * GET /api/campaign-builder
 * List campaign drafts for workspace
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // Query params
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status') || undefined
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20')), 100)
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)

    // Get drafts
    const repo = new CampaignBuilderRepository()
    const result = await repo.listByWorkspace(user.workspace_id, {
      status,
      limit,
      offset,
    })

    return NextResponse.json({
      drafts: result.drafts,
      total: result.total,
      limit,
      offset,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/campaign-builder
 * Create new campaign draft
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // Validate request
    const body = await req.json()
    const validated = createDraftSchema.parse(body)

    // Create draft
    const repo = new CampaignBuilderRepository()
    const draft = await repo.create(user.workspace_id, user.id, validated)

    return NextResponse.json({ draft }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
