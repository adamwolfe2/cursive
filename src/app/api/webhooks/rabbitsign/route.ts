import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * RabbitSign webhook handler.
 * Called when a contract is signed or status changes.
 * Updates the onboarding_clients record.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // RabbitSign sends: { folderId, event, signers, ... }
    const folderId = body.folderId || body.folder_id
    const event = body.event || body.status

    if (!folderId) {
      return NextResponse.json({ error: 'Missing folderId' }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (event === 'COMPLETED' || event === 'ALL_SIGNED' || event === 'completed') {
      // All parties signed — update client record
      const { error } = await supabase
        .from('onboarding_clients')
        .update({
          rabbitsign_status: 'signed',
          contract_signed_at: new Date().toISOString(),
        })
        .eq('rabbitsign_folder_id', folderId)

      if (error) {
        return NextResponse.json({ error: 'Failed to update client record' }, { status: 500 })
      }
    } else if (event === 'VIEWED' || event === 'viewed') {
      await supabase
        .from('onboarding_clients')
        .update({ rabbitsign_status: 'viewed' })
        .eq('rabbitsign_folder_id', folderId)
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
