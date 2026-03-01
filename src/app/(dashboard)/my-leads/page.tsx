/**
 * My Leads Page
 *
 * Shows leads that have been automatically routed to the current user
 * based on their targeting preferences (industry + geography).
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MyLeadsRealtime } from '@/components/leads/my-leads-realtime'
import { ErrorBoundary } from '@/components/error-boundary'
import { safeError } from '@/lib/utils/log-sanitizer'
import { Settings, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']
type UserTargeting = Database['public']['Tables']['user_targeting']['Row']

export const metadata = {
  title: 'My Leads | Cursive',
  description: 'View leads matched to your targeting preferences',
}

export default async function MyLeadsPage() {
  const supabase = await createClient()

  // Layout already verified auth — get session for user ID (no network call)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Get user profile + targeting preferences in parallel
  // (user profile query is still needed for DB user id)
  const { data: userData } = await supabase
    .from('users')
    .select('id, workspace_id, full_name, email')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()

  if (!userData) {
    redirect('/welcome')
  }

  const userProfile = userData as Pick<User, 'id' | 'workspace_id' | 'full_name' | 'email'>

  // Now fetch targeting (depends on userProfile.id)
  const { data: targetingData } = await supabase
    .from('user_targeting')
    .select('id, target_industries, target_sic_codes, target_states, target_cities, is_active')
    .eq('user_id', userProfile.id)
    .eq('workspace_id', userProfile.workspace_id)
    .maybeSingle()

  const targeting = targetingData as UserTargeting | null

  const hasTargeting =
    targeting &&
    ((targeting.target_industries?.length ?? 0) > 0 ||
      (targeting.target_sic_codes?.length ?? 0) > 0 ||
      (targeting.target_states?.length ?? 0) > 0 ||
      (targeting.target_cities?.length ?? 0) > 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">My Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Leads assigned to you based on your targeting preferences.
          </p>
        </div>
        <Link
          href="/my-leads/preferences"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Targeting Preferences
        </Link>
      </div>

      {/* No targeting setup - prominent CTA */}
      {!hasTargeting && (
        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">
            Tell us what leads you want
          </h3>
          <p className="text-sm text-zinc-600 max-w-md mx-auto mb-6">
            Set your target industries and locations, and we&apos;ll automatically
            match and deliver leads right here. It only takes a minute.
          </p>
          <Link
            href="/my-leads/preferences"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            Set Up Targeting Preferences
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Targeting configured - reassurance message */}
      {hasTargeting && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Targeting is active
              </h3>
              <div className="mt-1 text-sm text-green-700">
                <p>
                  Leads matching your preferences will appear here automatically.{' '}
                  <Link
                    href="/my-leads/preferences"
                    className="font-medium underline hover:text-green-900"
                  >
                    Edit preferences
                  </Link>
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(targeting.target_industries ?? []).map((ind: string) => (
                    <span key={ind} className="inline-flex items-center text-xs bg-green-100 text-green-800 border border-green-200 rounded-full px-2 py-0.5">
                      {ind}
                    </span>
                  ))}
                  {(targeting.target_states ?? []).map((st: string) => (
                    <span key={st} className="inline-flex items-center text-xs bg-green-100 text-green-800 border border-green-200 rounded-full px-2 py-0.5">
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats + Table with realtime updates */}
      <ErrorBoundary
        onError={(error, errorInfo) => {
          safeError('[MyLeadsPage]', 'Component error:', error, errorInfo)
        }}
      >
        <MyLeadsRealtime userId={userProfile.id} workspaceId={userProfile.workspace_id} />
      </ErrorBoundary>
    </div>
  )
}
