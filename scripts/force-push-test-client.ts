// Force-runs the post-approval push directly (bypasses Inngest) for a
// is_test_client=true client. Use this when:
//   1. You want to see the post-approval steps light up in the portal,
//   2. Inngest dispatch silently failed and the push never ran.
//
// SAFE BY DESIGN: refuses to run unless is_test_client=true. Real clients
// should always go through the Inngest-driven path.

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function getArg(flag: string): string | undefined {
  const prefix = `--${flag}=`
  const found = process.argv.find((a) => a.startsWith(prefix))
  return found?.slice(prefix.length)
}

const email = getArg('email') ?? 'adamwolfe100@gmail.com'

async function main() {
  console.log(`\nForce-pushing test client for: ${email}`)

  const { data: client, error } = await supabase
    .from('onboarding_clients')
    .select('*')
    .eq('primary_contact_email', email)
    .eq('is_test_client', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !client) {
    console.error('No test client found. Run pnpm seed:portal first.')
    process.exit(1)
  }

  if (!client.is_test_client) {
    console.error('REFUSED: client is not flagged is_test_client=true. Real clients must go through Inngest.')
    process.exit(1)
  }

  if (client.copy_approval_status !== 'approved') {
    console.error(`Cannot force-push: copy_approval_status is "${client.copy_approval_status}", expected "approved". Approve the copy first.`)
    process.exit(1)
  }

  if (!client.draft_sequences) {
    console.error('Client has no draft_sequences.')
    process.exit(1)
  }

  // Use the same dry-run path the Inngest job would have used.
  const { pushCopyToEmailBison } = await import('../src/lib/services/onboarding/emailbison-push')

  const workspaceId = client.assigned_workspace_id || client.id
  const result = await pushCopyToEmailBison({
    clientName: client.company_name,
    sequences: client.draft_sequences,
    workspaceId,
    dryRun: true,
  })

  console.log(`  Synthesized ${result.campaigns.length} dry-run campaigns:`)
  for (const c of result.campaigns) {
    console.log(`    - ${c.campaignName} (${c.sequenceSteps} steps, ${c.variants} variants)`)
  }

  const campaignIds = result.campaigns.map((c) => c.campaignId)
  const now = new Date().toISOString()

  // Append automation log entry the Inngest job would have written.
  const newLogEntry = {
    step: 'emailbison_push',
    status: 'complete',
    timestamp: now,
    note: 'Force-push (Inngest bypass, dry-run mode)',
  }
  const newLog = [...(client.automation_log || []), newLogEntry]

  // Decide if status should auto-promote to 'active'
  const shouldActivate =
    client.copy_approval_status === 'approved' &&
    client.enrichment_status === 'complete' &&
    client.sow_signed &&
    client.payment_confirmed
  const nextStatus = shouldActivate && client.status === 'setup' ? 'active' : client.status

  const { error: updateErr } = await supabase
    .from('onboarding_clients')
    .update({
      emailbison_campaign_ids: campaignIds,
      campaign_deployed: true,
      automation_log: newLog,
      status: nextStatus,
      updated_at: now,
    })
    .eq('id', client.id)

  if (updateErr) {
    console.error('Failed to update client:', updateErr.message)
    process.exit(1)
  }

  console.log(`  campaign_deployed: true`)
  console.log(`  status: ${client.status} -> ${nextStatus}`)
  console.log('\nDone. Reload the portal — Step 5 (Setup) should be active, Step 6 (Campaign Live) green if status=active.')
}

main().catch((err) => {
  console.error('Force-push failed:', err)
  process.exit(1)
})
