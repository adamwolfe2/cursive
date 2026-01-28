/**
 * My Leads Page
 *
 * Shows leads that have been automatically routed to the current user
 * based on their targeting preferences (industry + geography).
 */

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MyLeadsTable } from '@/components/leads/my-leads-table'
import { MyLeadsStats } from '@/components/leads/my-leads-stats'
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

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get user profile
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, workspace_id, full_name, email')
    .eq('auth_user_id', session.user.id)
    .single()

  if (userError || !userData) {
    redirect('/onboarding')
  }

  const user = userData as Pick<User, 'id' | 'workspace_id' | 'full_name' | 'email'>

  // Check if user has targeting preferences set up
  const { data: targetingData } = await supabase
    .from('user_targeting')
    .select('id, target_industries, target_sic_codes, target_states, target_cities, is_active')
    .eq('user_id', user.id)
    .eq('workspace_id', user.workspace_id)
    .single()

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
          <p className="mt-1 text-[13px] text-zinc-500">
            Leads matched to your targeting preferences
          </p>
        </div>
        <Link
          href="/my-leads/preferences"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Targeting Preferences
        </Link>
      </div>

      {/* No targeting setup prompt */}
      {!hasTargeting && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-amber-800">
                Set up your targeting preferences
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                To receive leads, you need to configure your industry and location
                preferences. Leads will be automatically matched and delivered to
                you.
              </p>
              <Link
                href="/my-leads/preferences"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-800 hover:text-amber-900"
              >
                Configure preferences
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-zinc-200 bg-white p-6"
              >
                <div className="h-4 w-20 bg-zinc-200 rounded"></div>
                <div className="mt-2 h-8 w-16 bg-zinc-200 rounded"></div>
              </div>
            ))}
          </div>
        }
      >
        <MyLeadsStats userId={user.id} workspaceId={user.workspace_id} />
      </Suspense>

      {/* Table */}
      <Suspense
        fallback={
          <div className="rounded-lg border border-zinc-200 bg-white p-12">
            <div className="flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600" />
            </div>
          </div>
        }
      >
        <MyLeadsTable userId={user.id} workspaceId={user.workspace_id} />
      </Suspense>
    </div>
  )
}
