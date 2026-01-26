// Team Invites API
// GET /api/team/invites - Get pending invites
// POST /api/team/invites - Create a new invite

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, forbidden, success, badRequest } from '@/lib/utils/api-error-handler'

// Lazy-load Resend to avoid build-time initialization errors
let resendClient: Resend | null = null
function getResend(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

const createInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']).default('member'),
})

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Check if user has permission (owner or admin)
    if (user.role !== 'owner' && user.role !== 'admin') {
      return forbidden('Only owners and admins can view invites')
    }

    // 3. Get pending invites
    const supabase = await createClient()
    const { data: invites, error } = await supabase
      .from('team_invites')
      .select('id, email, role, status, created_at, expires_at, invited_by_user:users!team_invites_invited_by_fkey(id, full_name, email)')
      .eq('workspace_id', user.workspace_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch invites: ${error.message}`)
    }

    return success({ invites: invites || [] })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Check if user has permission (owner or admin)
    if (user.role !== 'owner' && user.role !== 'admin') {
      return forbidden('Only owners and admins can invite members')
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const validationResult = createInviteSchema.safeParse(body)

    if (!validationResult.success) {
      return badRequest(validationResult.error.errors[0]?.message || 'Invalid request')
    }

    const { email, role } = validationResult.data

    // 4. Create invite using database function
    const supabase = await createClient()
    const { data: invite, error } = await supabase.rpc('create_team_invite', {
      p_workspace_id: user.workspace_id,
      p_email: email,
      p_role: role,
      p_invited_by: user.id,
    })

    if (error) {
      if (error.message.includes('already exists')) {
        return badRequest('This user is already a member of your workspace')
      }
      throw new Error(`Failed to create invite: ${error.message}`)
    }

    // 5. Get workspace name for email
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', user.workspace_id)
      .single()

    // 6. Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${invite.token}`

    try {
      await getResend().emails.send({
        from: 'LeadMe <noreply@leadme.app>',
        to: email,
        subject: `You've been invited to join ${workspace?.name || 'a workspace'} on LeadMe`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">You've been invited!</h2>
            <p>${user.full_name || user.email} has invited you to join <strong>${workspace?.name || 'their workspace'}</strong> on LeadMe as a ${role}.</p>
            <p style="margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Accept Invitation
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">
              LeadMe - Lead Generation Platform
            </p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('[Team Invites] Email send error:', emailError)
      // Don't fail the request if email fails - invite is still created
    }

    return success({ invite, message: 'Invitation sent successfully' }, 201)
  } catch (error: any) {
    return handleApiError(error)
  }
}
