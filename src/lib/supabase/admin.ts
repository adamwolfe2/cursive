// Supabase Admin Client
// Use this for server-side operations that need elevated privileges
// (webhooks, background jobs, system operations)

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Creates an admin Supabase client with service role key
 * This bypasses RLS policies - use with caution!
 *
 * Use cases:
 * - Webhook handlers that insert/update data
 * - Background jobs (Inngest functions)
 * - System-level operations
 *
 * DO NOT use in:
 * - Client components
 * - Server components with user-facing data
 * - API routes that should respect RLS
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
