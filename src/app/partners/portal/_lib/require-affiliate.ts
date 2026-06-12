import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAffiliateForUser, type AffiliateRecord } from '@/lib/affiliate/portal'

/**
 * Gate a partner-portal server component. Resolves the signed-in user's
 * affiliate record (auto-linking by email), or redirects:
 *   - unauthenticated → /login?next=…
 *   - authenticated but no affiliate → /partners/portal/pending
 */
export async function requireAffiliate(nextPath = '/partners/portal'): Promise<AffiliateRecord> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect(`/login?next=${encodeURIComponent(nextPath)}`)

  const affiliate = await getAffiliateForUser(
    authUser.id,
    authUser.email,
    !!authUser.email_confirmed_at
  )
  // Redirect to a page OUTSIDE this gated layout to avoid a redirect loop.
  if (!affiliate) redirect('/partners/pending')

  return affiliate
}
