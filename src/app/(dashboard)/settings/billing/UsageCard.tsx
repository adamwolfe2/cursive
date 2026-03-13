'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UsageCardProps {
  user: {
    credits_remaining?: number
    daily_credit_limit?: number
    plan?: string
  } | undefined
  isPro: boolean
}

export function UsageCard({ user, isPro }: UsageCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Usage</CardTitle>
          <Link
            href="/settings/billing/usage"
            className="text-sm font-medium text-primary hover:underline"
          >
            View Usage History →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Enrichment Credits</span>
              <span className="text-sm text-muted-foreground">
                {user?.credits_remaining || 0} / {user?.daily_credit_limit || (isPro ? 1000 : 3)} remaining
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  (user?.credits_remaining || 0) === 0
                    ? 'bg-red-500'
                    : (user?.credits_remaining || 0) / (user?.daily_credit_limit || (isPro ? 1000 : 3)) <= 0.2
                      ? 'bg-amber-500'
                      : 'bg-primary'
                }`}
                style={{
                  width: `${
                    Math.min(100, Math.max(0, ((user?.credits_remaining || 0) / (user?.daily_credit_limit || (isPro ? 1000 : 3))) * 100))
                  }%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Each enrichment reveals phone, email & LinkedIn. Resets daily at midnight CT.</p>

            {/* Credit system explanation */}
            <div className="mt-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-start gap-2">
                <svg className="h-4 w-4 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">How credits work</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>Each lead enrichment costs 1 credit</li>
                    <li>Free plan: 3 credits/day &nbsp;|&nbsp; Pro plan: 1,000 credits/day</li>
                    <li>Credits reset daily at 8am CT</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Credit usage alerts */}
            {user && (user.credits_remaining || 0) === 0 && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">No credits remaining</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Your daily enrichment credits are used up. They reset at midnight CT.
                      {!isPro && ' Upgrade to Pro for 1,000 credits/day.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {user && (user.credits_remaining || 0) > 0 &&
              (user.credits_remaining || 0) / (user.daily_credit_limit || (isPro ? 1000 : 3)) <= 0.2 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Running low on credits</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      You have {user.credits_remaining} credit{user.credits_remaining === 1 ? '' : 's'} left today.
                      {!isPro && ' Upgrade to Pro for 1,000 credits/day, or buy a credit pack below.'}
                      {isPro && ' Buy a credit pack below for extra enrichments.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
