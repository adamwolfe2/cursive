export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { listSenderEmails } from '@/lib/integrations/emailbison'
import { safeError } from '@/lib/utils/log-sanitizer'

// Lists currently-connected sender emails from the EmailBison account so
// admins can pick which ones belong to a newly-created Cursive workspace.
// Filters by status='connected' so we never offer broken senders.

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin()
    const { sender_emails } = await listSenderEmails({ status: 'connected' })
    const senders = (sender_emails ?? []).map((s) => ({
      id: s.id,
      email: s.email,
      warmup_enabled: s.warmup_enabled ?? false,
    }))
    return NextResponse.json({ senders })
  } catch (err) {
    safeError('[Admin] emailbison/senders GET error:', err)
    return NextResponse.json({ error: 'Failed to load senders' }, { status: 500 })
  }
}
