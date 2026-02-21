// CRM Leads Bulk Operations API
// API endpoint for bulk operations on leads


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { CRMLeadRepository } from '@/lib/repositories/crm-lead.repository'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { safeError } from '@/lib/utils/log-sanitizer'

// Validation schema for bulk operations
const bulkOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['update_status', 'assign', 'add_tags', 'remove_tags', 'delete']),
  data: z.record(z.unknown()),
})

// POST /api/crm/leads/bulk - Perform bulk operations
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // Rate limiting
    const rateLimitResult = await withRateLimit(
      request,
      'default',
      `user:${user.id}`
    )
    if (rateLimitResult) return rateLimitResult

    // Parse and validate request body
    const body = await request.json()
    const validated = bulkOperationSchema.parse(body)

    const repo = new CRMLeadRepository()
    const workspaceId = user.workspace_id

    // Perform action based on type
    switch (validated.action) {
      case 'update_status': {
        const status = z
          .enum(['new', 'contacted', 'qualified', 'won', 'lost'])
          .parse(validated.data.status)

        await repo.bulkUpdate(validated.ids, { status }, workspaceId)

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
          workspaceId
        )

        return NextResponse.json({
          success: true,
          message: `Assigned ${validated.ids.length} leads`,
          count: validated.ids.length,
        })
      }

      case 'add_tags': {
        const tagsToAdd = z.array(z.string()).parse(validated.data.tags)

        // Batch-fetch all leads in one query, then update in parallel
        const supabase = await createClient()
        const { data: leads } = await supabase
          .from('leads')
          .select('id, tags')
          .in('id', validated.ids)
          .eq('workspace_id', workspaceId)

        if (leads && leads.length > 0) {
          await Promise.all(
            leads.map((lead) => {
              const currentTags = (lead.tags as string[]) || []
              const newTags = Array.from(new Set([...currentTags, ...tagsToAdd]))
              return supabase
                .from('leads')
                .update({ tags: newTags })
                .eq('id', lead.id)
                .eq('workspace_id', workspaceId)
            })
          )
        }

        return NextResponse.json({
          success: true,
          message: `Added tags to ${validated.ids.length} leads`,
          count: validated.ids.length,
        })
      }

      case 'remove_tags': {
        const tagsToRemove = z.array(z.string()).parse(validated.data.tags)

        // Batch-fetch all leads in one query, then update in parallel
        const supabase = await createClient()
        const { data: leads } = await supabase
          .from('leads')
          .select('id, tags')
          .in('id', validated.ids)
          .eq('workspace_id', workspaceId)

        if (leads && leads.length > 0) {
          await Promise.all(
            leads.map((lead) => {
              const currentTags = (lead.tags as string[]) || []
              const newTags = currentTags.filter((tag) => !tagsToRemove.includes(tag))
              return supabase
                .from('leads')
                .update({ tags: newTags })
                .eq('id', lead.id)
                .eq('workspace_id', workspaceId)
            })
          )
        }

        return NextResponse.json({
          success: true,
          message: `Removed tags from ${validated.ids.length} leads`,
          count: validated.ids.length,
        })
      }

      case 'delete': {
        await repo.bulkDelete(validated.ids, workspaceId)

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
    safeError('[CRM Bulk API] Failed to perform bulk operation:', error)
    return handleApiError(error)
  }
}
