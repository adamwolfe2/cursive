import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAffiliateForUser, type AffiliateRecord } from '@/lib/affiliate/portal'

/**
 * Gate a partner-portal server component. Resolves the signed-in user's
 * affiliate record (auto-linking by email), or redirects:
 *   - unauthenticated → /login?next=…
 *   - authenticated but no affiliate → /partners/portal/pending
 *
 * Wrapped in React `cache()` so the layout + page (which each call this during
 * a single render pass) share ONE `supabase.auth.getUser()` round-trip instead
 * of firing 2–3 concurrent `/user` calls. Concurrent getUser calls race the
 * Supabase refresh-token rotation and can invalidate a freshly-rotated session
 * (observed as `GET /user → 403`), which is what produced the login redirect
 * loop. De-duping the call within a request removes that race.
 */
export const requireAffiliate = cache(async function requireAffiliate(
  nextPath = '/partners/portal'
): Promise<AffiliateRecord> {
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
})
