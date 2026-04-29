// Patches an existing test portal client so the token-based portal at
// /portal/[token] shows ALL six steps in the right state (not just step 4).
//
// What it sets:
//   - rabbitsign_status = 'signed'        → Step 1 ✓
//   - stripe_invoice_status = 'paid'      → Step 2 ✓
//   - client_portal_approvals.domains = 'approved' → Step 3 ✓
//   - copy approval is whatever you already did via admin/portal
//
// Step 5 unlocks automatically once 1–4 are done. Step 6 (Campaign Live)
// turns green when status flips to 'active' (the Inngest job already
// handles that on copy approval if all gates are met).
//
// Usage:
//   pnpm tsx scripts/fix-portal-test-client.ts
//   pnpm tsx scripts/fix-portal-test-client.ts --email=you@x.com

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
  console.log(`\nLooking up test client for: ${email}`)

  const { data: client, error: clientErr } = await supabase
    .from('onboarding_clients')
    .select('id, company_name, rabbitsign_status, stripe_invoice_status')
    .eq('primary_contact_email', email)
    .eq('is_test_client', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (clientErr || !client) {
    console.error('No test client found. Run pnpm seed:portal first.')
    process.exit(1)
  }

  console.log(`  Found: ${client.company_name} (${client.id})`)

  const { error: updateErr } = await supabase
    .from('onboarding_clients')
    .update({
      rabbitsign_status: 'signed',
      stripe_invoice_status: 'paid',
      contract_signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', client.id)

  if (updateErr) {
    console.error('Failed to update client:', updateErr.message)
    process.exit(1)
  }
  console.log('  Set rabbitsign_status=signed, stripe_invoice_status=paid')

  // Find most recent unrevoked token for this client (needed for FK on approvals)
  const { data: token } = await supabase
    .from('client_portal_tokens')
    .select('id')
    .eq('client_id', client.id)
    .eq('revoked', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!token) {
    console.log('  No portal token found yet — generate one from the admin Portal Link panel.')
    console.log('  Domain approval skipped (will need to be approved through the portal once a token exists).')
  } else {
    // Upsert the domains approval. Unique constraint is (client_id, step_type).
    const { error: approvalErr } = await supabase
      .from('client_portal_approvals')
      .upsert(
        {
          client_id: client.id,
          token_id: token.id,
          step_type: 'domains',
          status: 'approved',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'client_id,step_type' }
      )

    if (approvalErr) {
      console.error('Failed to upsert domain approval:', approvalErr.message)
      process.exit(1)
    }
    console.log('  Upserted client_portal_approvals: domains = approved')
  }

  console.log('\nDone. Reload the portal page — Steps 1, 2, 3 should be ✓.')
  console.log('If Step 6 (Campaign Live) is still locked, the status promotion job did not run')
  console.log('— check /admin/onboarding to confirm status is "active".')
}

main().catch((err) => {
  console.error('Fix failed:', err)
  process.exit(1)
})
