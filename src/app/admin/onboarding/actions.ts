'use server'

import { revalidatePath } from 'next/cache'
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

  // Load the client to get workspace context for the push event
  const { data: client, error: fetchError } = await supabase
    .from('onboarding_clients')
    .select('id, packages_selected')
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

  // Trigger EmailBison push when copy is approved
  try {
    const inngest = getInngest()
    await inngest.send({
      name: 'onboarding/copy-approved',
      data: {
        client_id: clientId,
        workspace_id: clientId, // Onboarding clients use their own ID as workspace scope
      },
    })
  } catch {
    // Non-fatal — the push can be retried manually from admin
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

export async function regenerateCopy(clientId: string, feedback?: string) {
  const supabase = createAdminClient()

  const { error: updateError } = await supabase
    .from('onboarding_clients')
    .update({
      copy_generation_status: 'processing',
      copy_approval_status: 'regenerating',
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  if (updateError) {
    throw new Error(`Failed to trigger copy regeneration: ${updateError.message}`)
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')

    await fetch(`${baseUrl}/api/automations/regenerate-copy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-automation-secret': process.env.AUTOMATION_SECRET || '',
      },
      body: JSON.stringify({ client_id: clientId, feedback }),
    })
  } catch {
    // The automation endpoint will handle its own error logging
  }

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
