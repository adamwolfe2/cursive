// One-off: ensure a given email is an active platform admin (idempotent).
// Usage: pnpm tsx scripts/seed-platform-admin.ts <email>
// Reads .env.local (NEXT_PUBLIC_SUPABASE_URL = prod custom domain) + service-role key.

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const email = (process.argv[2] || '').trim().toLowerCase()

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!email) {
  console.error('Usage: tsx scripts/seed-platform-admin.ts <email>')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('Target project URL:', url)

  const { data: before, error: beforeErr } = await supabase
    .from('platform_admins')
    .select('email, is_active')
    .order('email')
  if (beforeErr) {
    console.error('Read failed:', beforeErr.message)
    process.exit(1)
  }
  console.log('platform_admins BEFORE:', before)

  const { error: upsertErr } = await supabase
    .from('platform_admins')
    .upsert({ email, is_active: true }, { onConflict: 'email' })
  if (upsertErr) {
    console.error('Upsert failed:', upsertErr.message)
    process.exit(1)
  }

  const { data: after } = await supabase
    .from('platform_admins')
    .select('email, is_active')
    .order('email')
  console.log('platform_admins AFTER:', after)
  console.log(`Done — ${email} is now an active platform admin.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
