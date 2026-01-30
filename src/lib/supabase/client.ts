// Supabase Browser Client
// Use this in Client Components

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export const createClient = () => {
  // Browser client handles cookies automatically - no need for custom handlers
  // The @supabase/ssr package manages cookie storage internally
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
