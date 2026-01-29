// CRM Leads Bulk Operations API
// API endpoint for bulk operations on leads

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { CRMLeadRepository } from '@/lib/repositories/crm-lead.repository'
import { withRateLimit } from '@/lib/middleware/rate-limiter'

// Validation schema for bulk operations
const bulkOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['update_status', 'assign', 'add_tags', 'remove_tags', 'delete']),
  data: z.record(z.unknown()),
})

// POST /api/crm/leads/bulk - Perform bulk operations
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await withRateLimit(
      request,
      'crm-operations',
      `user:${user.id}`
    )
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('id, workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validated = bulkOperationSchema.parse(body)

    const repo = new CRMLeadRepository()

    // Perform action based on type
    switch (validated.action) {
      case 'update_status': {
        const status = z
          .enum(['new', 'contacted', 'qualified', 'won', 'lost'])
          .parse(validated.data.status)

        await repo.bulkUpdate(
          validated.ids,
          { status },
          userData.workspace_id
        )

        return NextResponse.json({
          success: true,
          message: `Updated status for ${validated.ids.length} leads`,
          count: validated.ids.length,
        })
      }

      case 'assign': {
        const assignedUserId = z
          .string()
          .uuid()
          .nullable()
          .parse(validated.data.assigned_user_id)

        await repo.bulkUpdate(
          validated.ids,
          { assigned_user_id: assignedUserId },
          userData.workspace_id
        )

        return NextResponse.json({
          success: true,
          message: `Assigned ${validated.ids.length} leads`,
          count: validated.ids.length,
        })
      }

      case 'add_tags': {
        const tagsToAdd = z.array(z.string()).parse(validated.data.tags)

        // For each lead, fetch current tags and merge with new ones
        // This requires individual updates due to array merging logic
        for (const leadId of validated.ids) {
          const lead = await repo.findById(leadId, userData.workspace_id)
          if (!lead) continue

          const currentTags = lead.tags || []
          const newTags = Array.from(new Set([...currentTags, ...tagsToAdd]))

          await repo.update(leadId, { tags: newTags }, userData.workspace_id)
        }

        return NextResponse.json({
          success: true,
          message: `Added tags to ${validated.ids.length} leads`,
          count: validated.ids.length,
        })
      }

      case 'remove_tags': {
        const tagsToRemove = z.array(z.string()).parse(validated.data.tags)

        // For each lead, fetch current tags and remove specified ones
        for (const leadId of validated.ids) {
          const lead = await repo.findById(leadId, userData.workspace_id)
          if (!lead) continue

          const currentTags = lead.tags || []
          const newTags = currentTags.filter((tag) => !tagsToRemove.includes(tag))

          await repo.update(leadId, { tags: newTags }, userData.workspace_id)
        }

        return NextResponse.json({
          success: true,
          message: `Removed tags from ${validated.ids.length} leads`,
          count: validated.ids.length,
        })
      }

      case 'delete': {
        await repo.bulkDelete(validated.ids, userData.workspace_id)

        return NextResponse.json({
          success: true,
          message: `Deleted ${validated.ids.length} leads`,
          count: validated.ids.length,
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[CRM Bulk API] Failed to perform bulk operation:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}
