// Bulk Lead Actions API
// POST /api/leads/bulk - Perform bulk actions on leads


import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'

const bulkActionSchema = z.object({
  action: z.enum(['update_status', 'assign', 'add_tags', 'remove_tags', 'delete', 'export', 'archive', 'unarchive', 'tag', 'export_csv']),
  lead_ids: z.array(z.string().uuid()).min(1, 'At least one lead is required').max(100, 'Cannot process more than 100 leads at once'),
  // Action-specific params
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  assigned_to: z.string().uuid().optional(),
  tag_ids: z.array(z.string().uuid()).max(50, 'Cannot apply more than 50 tags at once').optional(),
  tag_name: z.string().min(1).max(50).optional(),
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

    const { action, lead_ids, status, assigned_to, tag_ids, tag_name, note } = validationResult.data
    const supabase = await createClient()
    let result: { affected: number; message: string }

    switch (action) {
      case 'update_status': {
        if (!status) return badRequest('Status is required for this action')

        const { data, error } = await supabase.rpc('bulk_update_lead_status', {
          p_lead_ids: lead_ids,
          p_new_status: status,
          p_user_id: user.id,
          p_workspace_id: user.workspace_id,
          p_change_note: note,
        })

        if (error) {
          safeError('[Bulk Update Status] Error:', error)
          throw new Error('Failed to update status')
        }
        result = { affected: data, message: `Updated ${data} leads to ${status}` }
        break
      }

      case 'assign': {
        if (!assigned_to) return badRequest('Assigned user is required for this action')

        const { data, error } = await supabase.rpc('bulk_assign_leads', {
          p_lead_ids: lead_ids,
          p_assigned_to: assigned_to,
          p_assigned_by: user.id,
          p_workspace_id: user.workspace_id,
        })

        if (error) {
          safeError('[Bulk Assign] Error:', error)
          throw new Error('Failed to assign leads')
        }
        result = { affected: data, message: `Assigned ${data} leads` }
        break
      }

      case 'add_tags': {
        if (!tag_ids || tag_ids.length === 0) return badRequest('Tags are required for this action')

        const { data, error } = await supabase.rpc('bulk_add_tags', {
          p_lead_ids: lead_ids,
          p_tag_ids: tag_ids,
          p_assigned_by: user.id,
          p_workspace_id: user.workspace_id,
        })

        if (error) {
          safeError('[Bulk Add Tags] Error:', error)
          throw new Error('Failed to add tags')
        }
        result = { affected: data, message: `Added tags to leads` }
        break
      }

      case 'remove_tags': {
        if (!tag_ids || tag_ids.length === 0) return badRequest('Tags are required for this action')

        const { data, error } = await supabase.rpc('bulk_remove_tags', {
          p_lead_ids: lead_ids,
          p_tag_ids: tag_ids,
          p_workspace_id: user.workspace_id,
        })

        if (error) {
          safeError('[Bulk Remove Tags] Error:', error)
          throw new Error('Failed to remove tags')
        }
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

        if (error) {
          safeError('[Bulk Delete] Error:', error)
          throw new Error('Failed to delete leads')
        }
        result = { affected: lead_ids.length, message: `Deleted ${lead_ids.length} leads` }
        break
      }

      case 'export': {
        // Return lead IDs for client-side export trigger via /api/leads/export
        result = {
          affected: lead_ids.length,
          message: `Export ${lead_ids.length} leads via /api/leads/export`,
        }
        break
      }

      // My-Leads table actions — operate on user_lead_assignments by assignment ID
      case 'archive': {
        const { error } = await supabase
          .from('user_lead_assignments')
          .update({ status: 'archived' })
          .in('id', lead_ids)
          .eq('workspace_id', user.workspace_id)
          .eq('user_id', user.id)

        if (error) {
          safeError('[Bulk Archive] Error:', error)
          throw new Error('Failed to archive assignments')
        }
        result = { affected: lead_ids.length, message: `Archived ${lead_ids.length} lead${lead_ids.length !== 1 ? 's' : ''}` }
        break
      }

      case 'unarchive': {
        const { error } = await supabase
          .from('user_lead_assignments')
          .update({ status: 'new' })
          .in('id', lead_ids)
          .eq('workspace_id', user.workspace_id)
          .eq('user_id', user.id)

        if (error) {
          safeError('[Bulk Unarchive] Error:', error)
          throw new Error('Failed to unarchive assignments')
        }
        result = { affected: lead_ids.length, message: `Unarchived ${lead_ids.length} lead${lead_ids.length !== 1 ? 's' : ''}` }
        break
      }

      case 'tag': {
        if (!tag_name) return badRequest('tag_name is required for the tag action')

        // Fetch the lead_ids from the assignments
        const { data: assignments, error: assignErr } = await supabase
          .from('user_lead_assignments')
          .select('lead_id')
          .in('id', lead_ids)
          .eq('workspace_id', user.workspace_id)
          .eq('user_id', user.id)

        if (assignErr) {
          safeError('[Bulk Tag] Error fetching assignments:', assignErr)
          throw new Error('Failed to fetch assignments for tagging')
        }

        if (!assignments || assignments.length === 0) {
          return badRequest('No matching assignments found')
        }

        const resolvedLeadIds = assignments.map((a) => a.lead_id)

        // Find or create the tag in lead_tags
        const { data: existingTag } = await supabase
          .from('lead_tags')
          .select('id')
          .eq('workspace_id', user.workspace_id)
          .eq('name', tag_name.trim())
          .maybeSingle()

        let tagId: string

        if (existingTag) {
          tagId = existingTag.id
        } else {
          const { data: newTag, error: tagCreateErr } = await supabase
            .from('lead_tags')
            .insert({ workspace_id: user.workspace_id, name: tag_name.trim(), color: '#6b7280' })
            .select('id')
            .maybeSingle()

          if (tagCreateErr || !newTag) {
            safeError('[Bulk Tag] Error creating tag:', tagCreateErr)
            throw new Error('Failed to create tag')
          }
          tagId = newTag.id
        }

        // Upsert tag assignments for all resolved lead IDs
        const tagRows = resolvedLeadIds.map((lid) => ({ lead_id: lid, tag_id: tagId }))
        const { error: upsertErr } = await supabase
          .from('lead_tag_assignments')
          .upsert(tagRows, { onConflict: 'lead_id,tag_id', ignoreDuplicates: true })

        if (upsertErr) {
          safeError('[Bulk Tag] Error upserting tag assignments:', upsertErr)
          throw new Error('Failed to apply tag to leads')
        }

        result = { affected: resolvedLeadIds.length, message: `Tagged ${resolvedLeadIds.length} lead${resolvedLeadIds.length !== 1 ? 's' : ''} with "${tag_name.trim()}"` }
        break
      }

      case 'export_csv': {
        // Fetch assignment + lead data for selected assignment IDs
        const { data: assignmentsForExport, error: exportFetchErr } = await supabase
          .from('user_lead_assignments')
          .select(`
            id,
            status,
            created_at,
            leads (
              id,
              first_name,
              last_name,
              full_name,
              email,
              phone,
              company_name,
              job_title,
              city,
              state,
              state_code,
              company_industry
            )
          `)
          .in('id', lead_ids)
          .eq('workspace_id', user.workspace_id)
          .eq('user_id', user.id)

        if (exportFetchErr) {
          safeError('[Bulk Export CSV] Error fetching data:', exportFetchErr)
          throw new Error('Failed to fetch lead data for export')
        }

        const rows = (assignmentsForExport || []).map((a: any) => {
          const lead = a.leads || {}
          const fullName =
            lead.full_name ||
            [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
            ''
          const location = [lead.city, lead.state_code || lead.state].filter(Boolean).join(', ')
          return [
            fullName,
            lead.email || '',
            lead.phone || '',
            lead.company_name || '',
            lead.job_title || '',
            location,
            lead.company_industry || '',
            a.status || '',
            new Date(a.created_at).toLocaleDateString(),
          ]
        })

        const headers = ['Name', 'Email', 'Phone', 'Company', 'Job Title', 'Location', 'Industry', 'Status', 'Assigned Date']
        const csv = [
          headers.join(','),
          ...rows.map((row: string[]) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          ),
        ].join('\n')

        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="my-leads-export-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        })
      }

      default:
        return badRequest('Invalid action')
    }

    return success(result)
  } catch (error) {
    return handleApiError(error)
  }
}
