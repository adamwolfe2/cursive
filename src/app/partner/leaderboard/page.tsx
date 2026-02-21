/**
 * Partner Leaderboard Page
 * /partner/leaderboard
 *
 * Full-page view of the partner leaderboard, showing top performers
 * by revenue, leads sold, and conversion rate across configurable periods.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PartnerLeaderboard } from '@/components/partner/PartnerLeaderboard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PartnerLeaderboardPage() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  const authUser = session?.user ?? null
  if (!authUser) redirect('/login')

  const { data: user } = await supabase
    .from('users')
    .select('id, role, partner_approved')
    .eq('auth_user_id', authUser.id)
    .maybeSingle()

  if (!user) redirect('/login')
  if (user.role !== 'partner') redirect('/dashboard')

  if (!user.partner_approved) {
    redirect('/login?error=Partner account not approved')
  }

  const now = new Date()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href="/partner/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex-shrink-0">
            <Trophy className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Partner Leaderboard</h1>
            <p className="text-muted-foreground mt-1">
              Top performing partners ranked by revenue, leads sold, and conversion rate.
              Partner names are partially anonymized to protect privacy.
            </p>
          </div>
        </div>

        {/* Leaderboard component (full-featured with period/category selectors) */}
        <PartnerLeaderboard month={now.toISOString()} isAdmin={false} />

        {/* Tier info */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border border-border p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                Gold
              </span>
              <span className="font-medium text-foreground">Gold Partner</span>
            </div>
            <p className="text-muted-foreground text-xs">
              Top 10% of partners by monthly revenue. Includes priority support and higher commission rates.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                Silver
              </span>
              <span className="font-medium text-foreground">Silver Partner</span>
            </div>
            <p className="text-muted-foreground text-xs">
              Top 25% of partners. Access to advanced analytics and monthly partner calls.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-300">
                Bronze
              </span>
              <span className="font-medium text-foreground">Bronze Partner</span>
            </div>
            <p className="text-muted-foreground text-xs">
              All active partners start here. Upload quality leads consistently to advance to Silver.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
