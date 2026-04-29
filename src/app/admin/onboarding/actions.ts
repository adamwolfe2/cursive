'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getInngest } from '@/inngest/client'
import type { ClientStatus } from '@/types/onboarding'

export async function updateClientStatus(clientId: string, status: ClientStatus, expectedUpdatedAt?: string) {
  const supabase = createAdminClient()

  let query = supabase
    .from('onboarding_clients')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', clientId)

  // Optimistic locking: if caller provides the expected updated_at,
  // include it in the WHERE clause so the update fails if another
  // user modified the record concurrently.
  if (expectedUpdatedAt) {
    query = query.eq('updated_at', expectedUpdatedAt)
  }

  const { data, error } = await query.select('id').maybeSingle()

  if (error) {
    throw new Error(`Failed to update client status: ${error.message}`)
  }

  if (!data) {
    throw new Error(
      'Concurrent modification detected: this client was updated by another user. Please refresh and try again.'
    )
  }

  revalidatePath('/admin/onboarding')
  revalidatePath(`/admin/onboarding/${clientId}`)
}

export async function approveSequences(clientId: string) {
  const supabase = createAdminClient()

  // Load the client to get workspace context for the push event.
  // assigned_workspace_id (if set) determines which Cursive workspace's
  // senders get attached to the campaigns; falling back to clientId
  // preserves the legacy onboarding behaviour (attach all connected senders).
  const { data: client, error: fetchError } = await supabase
    .from('onboarding_clients')
    .select('id, packages_selected, assigned_workspace_id')
    .eq('id', clientId)
    .single()

  if (fetchError || !client) {
    throw new Error(`Failed to load client for approval: ${fetchError?.message || 'not found'}`)
  }

  const { error } = await supabase
    .from('onboarding_clients')
    .update({
      copy_approval_status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  if (error) {
    throw new Error(`Failed to approve sequences: ${error.message}`)
  }

  const workspaceId = client.assigned_workspace_id || clientId

  // Fire-and-forget inline push. This is the authoritative path because the
  // prod Inngest project is unreachable (see project_inngest_orphaned memory).
  // We still call inngest.send() below as belt-and-suspenders if it ever
  // comes back online, but the inline call is what actually deploys campaigns.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000')

  after(async () => {
    try {
      await fetch(`${baseUrl}/api/admin/onboarding/${clientId}/push-emailbison`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-automation-secret': process.env.AUTOMATION_SECRET || '',
        },
      })
    } catch (err) {
      const { safeError } = await import('@/lib/utils/log-sanitizer')
      const msg = err instanceof Error ? err.message : String(err)
      safeError(`[approveSequences] inline push dispatch failed for ${clientId}: ${msg}`)
    }
  })

  // Inngest fallback (currently a no-op in prod — Inngest project missing).
  try {
    const inngest = getInngest()
    await inngest.send({
      name: 'onboarding/copy-approved',
      data: {
        client_id: clientId,
        workspace_id: workspaceId,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const { safeError } = await import('@/lib/utils/log-sanitizer')
    safeError(`[approveSequences] inngest.send failed for ${clientId}: ${msg}`)
    // Append failure to automation_log so admin sees it in the timeline.
    try {
      const repoMod = await import('@/lib/repositories/onboarding-client.repository')
      const repo = new repoMod.OnboardingClientRepository()
      await repo.appendAutomationLog(clientId, {
        step: 'emailbison_push_dispatch',
        status: 'failed',
        error: `Inngest dispatch failed: ${msg}. Push will need manual retry.`,
        timestamp: new Date().toISOString(),
      })
    } catch {
      // best effort
    }
    // Best-effort Slack heads-up.
    try {
      const { sendSlackAlert } = await import('@/lib/monitoring/alerts')
      await sendSlackAlert({
        type: 'inngest_failure',
        severity: 'critical',
        message: `Copy approval succeeded but EmailBison dispatch FAILED for client ${clientId}. Manual retry required.`,
        metadata: { client_id: clientId, error: msg },
      }).catch(() => {})
    } catch {
      // best effort
    }
  }

  revalidatePath(`/admin/onboarding/${clientId}`)
}

export async function requestSequenceEdits(clientId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('onboarding_clients')
    .update({
      copy_approval_status: 'needs_edits',
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  if (error) {
    throw new Error(`Failed to request edits: ${error.message}`)
  }

  revalidatePath(`/admin/onboarding/${clientId}`)
}

export async function updateChecklistItem(
  checklistId: string,
  itemId: string,
  completed: boolean
) {
  const supabase = createAdminClient()

  const { data: checklist, error: fetchError } = await supabase
    .from('fulfillment_checklists')
    .select('items')
    .eq('id', checklistId)
    .single()

  if (fetchError || !checklist) {
    throw new Error(`Failed to fetch checklist: ${fetchError?.message}`)
  }

  const items = (checklist.items as Array<{
    id: string
    label: string
    completed: boolean
    completed_at: string | null
    category: string
  }>).map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }
    }
    return item
  })

  const { error } = await supabase
    .from('fulfillment_checklists')
    .update({ items, updated_at: new Date().toISOString() })
    .eq('id', checklistId)

  if (error) {
    throw new Error(`Failed to update checklist: ${error.message}`)
  }

  revalidatePath('/admin/onboarding')
}

export async function updateAdminNotes(clientId: string, notes: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('onboarding_clients')
    .update({ admin_notes: notes, updated_at: new Date().toISOString() })
    .eq('id', clientId)

  if (error) {
    throw new Error(`Failed to update admin notes: ${error.message}`)
  }

  revalidatePath(`/admin/onboarding/${clientId}`)
}

export async function updateDomainsApprovalUrl(clientId: string, url: string) {
  const supabase = createAdminClient()

  const trimmed = url.trim()
  const value = trimmed.length > 0 ? trimmed : null

  if (value && !/^https?:\/\//i.test(value)) {
    throw new Error('URL must start with http:// or https://')
  }

  const { error } = await supabase
    .from('onboarding_clients')
    .update({ domains_approval_url: value, updated_at: new Date().toISOString() })
    .eq('id', clientId)

  if (error) {
    throw new Error(`Failed to update domains approval URL: ${error.message}`)
  }

  revalidatePath(`/admin/onboarding/${clientId}`)
}

export async function regenerateCopy(clientId: string, _feedback?: string) {
  const supabase = createAdminClient()

  // Reset copy state so the inline runner re-generates it.
  const { error: updateError } = await supabase
    .from('onboarding_clients')
    .update({
      copy_generation_status: 'pending',
      copy_approval_status: 'regenerating',
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  if (updateError) {
    throw new Error(`Failed to trigger copy regeneration: ${updateError.message}`)
  }

  // Fire the inline runner in the background. No Inngest involved.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000')

  after(async () => {
    try {
      await fetch(`${baseUrl}/api/admin/onboarding/${clientId}/run-pipeline-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-automation-secret': process.env.AUTOMATION_SECRET || '',
        },
      })
    } catch {
      // Non-fatal: admin can hit Run Inline manually.
    }
  })

  revalidatePath(`/admin/onboarding/${clientId}`)
}

export async function retryAutomationStep(clientId: string, step: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000')

  try {
    await fetch(`${baseUrl}/api/automations/retry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-automation-secret': process.env.AUTOMATION_SECRET || '',
      },
      body: JSON.stringify({ client_id: clientId, step }),
    })
  } catch {
    throw new Error(`Failed to retry automation step: ${step}`)
  }

  revalidatePath(`/admin/onboarding/${clientId}`)
}

/**
 * Re-fire the full onboarding intake pipeline for a client by resetting
 * state to 'pending' and triggering the inline runner. Runs in the
 * background via after() so the response returns immediately.
 */
export async function restartIntakePipeline(clientId: string) {
  const supabase = createAdminClient()

  const { error: resetError } = await supabase
    .from('onboarding_clients')
    .update({
      enrichment_status: 'pending',
      copy_generation_status: 'pending',
      copy_approval_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  if (resetError) {
    throw new Error(`Failed to reset pipeline state: ${resetError.message}`)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000')

  after(async () => {
    try {
      await fetch(`${baseUrl}/api/admin/onboarding/${clientId}/run-pipeline-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-automation-secret': process.env.AUTOMATION_SECRET || '',
        },
      })
    } catch {
      // Non-fatal: admin can hit Run Inline manually.
    }
  })

  revalidatePath(`/admin/onboarding/${clientId}`)
}

export async function getFileSignedUrl(storagePath: string): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('client-uploads')
    .createSignedUrl(storagePath, 3600) // 1 hour expiry
  if (error || !data?.signedUrl) {
    throw new Error('Failed to generate download URL')
  }
  return data.signedUrl
}

// ---------------------------------------------------------------------------
// Per-email copy comments (admin side)
// ---------------------------------------------------------------------------

export async function addAdminComment(args: {
  clientId: string
  sequenceIndex: number
  emailStep: number
  body: string
  parentCommentId?: string | null
  authorName?: string | null
}) {
  const { clientId, sequenceIndex, emailStep, body, parentCommentId, authorName } = args

  const trimmed = body.trim()
  if (trimmed.length === 0 || trimmed.length > 4000) {
    throw new Error('Comment body must be between 1 and 4000 characters')
  }
  if (sequenceIndex < 0 || emailStep < 0) {
    throw new Error('Invalid email reference')
  }

  const supabase = createAdminClient()

  if (parentCommentId) {
    const { data: parent } = await supabase
      .from('client_portal_copy_comments')
      .select('client_id')
      .eq('id', parentCommentId)
      .maybeSingle()
    if (!parent || parent.client_id !== clientId) {
      throw new Error('Invalid parent comment')
    }
  }

  const { error } = await supabase.from('client_portal_copy_comments').insert({
    client_id: clientId,
    sequence_index: sequenceIndex,
    email_step: emailStep,
    parent_comment_id: parentCommentId ?? null,
    author_type: 'admin',
    author_name: authorName ?? 'Cursive Team',
    body: trimmed,
  })

  if (error) {
    throw new Error(`Failed to save comment: ${error.message}`)
  }

  revalidatePath(`/admin/onboarding/${clientId}`)
}

export async function resolveComment(commentId: string, clientId: string) {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('client_portal_copy_comments')
    .update({ status: 'resolved', resolved_by: 'admin', resolved_at: now, updated_at: now })
    .eq('id', commentId)
    .eq('client_id', clientId)

  if (error) {
    throw new Error(`Failed to resolve comment: ${error.message}`)
  }

  revalidatePath(`/admin/onboarding/${clientId}`)
}

export async function reopenComment(commentId: string, clientId: string) {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('client_portal_copy_comments')
    .update({ status: 'open', resolved_by: null, resolved_at: null, updated_at: now })
    .eq('id', commentId)
    .eq('client_id', clientId)

  if (error) {
    throw new Error(`Failed to reopen comment: ${error.message}`)
  }

  revalidatePath(`/admin/onboarding/${clientId}`)
}

export async function deleteComment(commentId: string, clientId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('client_portal_copy_comments')
    .delete()
    .eq('id', commentId)
    .eq('client_id', clientId)

  if (error) {
    throw new Error(`Failed to delete comment: ${error.message}`)
  }

  revalidatePath(`/admin/onboarding/${clientId}`)
}
