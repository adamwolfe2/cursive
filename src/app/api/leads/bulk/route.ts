// Bulk Lead Actions API
// POST /api/leads/bulk - Perform bulk actions on leads

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'

const bulkActionSchema = z.object({
  action: z.enum(['update_status', 'assign', 'add_tags', 'remove_tags', 'delete', 'export']),
  lead_ids: z.array(z.string().uuid()).min(1, 'At least one lead is required'),
  // Action-specific params
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  assigned_to: z.string().uuid().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  note: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validationResult = bulkActionSchema.safeParse(body)

    if (!validationResult.success) {
      return badRequest(validationResult.error.errors[0]?.message || 'Invalid request')
    }

    const { action, lead_ids, status, assigned_to, tag_ids, note } = validationResult.data
    const supabase = await createClient()
    let result: { affected: number; message: string }

    switch (action) {
      case 'update_status': {
        if (!status) return badRequest('Status is required for this action')

        const { data, error } = await supabase.rpc('bulk_update_lead_status', {
          p_lead_ids: lead_ids,
          p_new_status: status,
          p_user_id: user.id,
          p_change_note: note,
        })

        if (error) throw new Error(`Failed to update status: ${error.message}`)
        result = { affected: data, message: `Updated ${data} leads to ${status}` }
        break
      }

      case 'assign': {
        if (!assigned_to) return badRequest('Assigned user is required for this action')

        const { data, error } = await supabase.rpc('bulk_assign_leads', {
          p_lead_ids: lead_ids,
          p_assigned_to: assigned_to,
          p_assigned_by: user.id,
        })

        if (error) throw new Error(`Failed to assign leads: ${error.message}`)
        result = { affected: data, message: `Assigned ${data} leads` }
        break
      }

      case 'add_tags': {
        if (!tag_ids || tag_ids.length === 0) return badRequest('Tags are required for this action')

        const { data, error } = await supabase.rpc('bulk_add_tags', {
          p_lead_ids: lead_ids,
          p_tag_ids: tag_ids,
          p_assigned_by: user.id,
        })

        if (error) throw new Error(`Failed to add tags: ${error.message}`)
        result = { affected: data, message: `Added tags to leads` }
        break
      }

      case 'remove_tags': {
        if (!tag_ids || tag_ids.length === 0) return badRequest('Tags are required for this action')

        const { data, error } = await supabase.rpc('bulk_remove_tags', {
          p_lead_ids: lead_ids,
          p_tag_ids: tag_ids,
        })

        if (error) throw new Error(`Failed to remove tags: ${error.message}`)
        result = { affected: data, message: `Removed tags from leads` }
        break
      }

      case 'delete': {
        // Check permission - only owners/admins can bulk delete
        if (user.role !== 'owner' && user.role !== 'admin') {
          return badRequest('Only owners and admins can bulk delete leads')
        }

        const { error } = await supabase
          .from('leads')
          .delete()
          .in('id', lead_ids)
          .eq('workspace_id', user.workspace_id)

        if (error) throw new Error(`Failed to delete leads: ${error.message}`)
        result = { affected: lead_ids.length, message: `Deleted ${lead_ids.length} leads` }
        break
      }

      case 'export': {
        // Export is handled separately via the export API
        result = { affected: lead_ids.length, message: 'Export queued' }
        break
      }

      default:
        return badRequest('Invalid action')
    }

    return success(result)
  } catch (error: any) {
    return handleApiError(error)
  }
}
