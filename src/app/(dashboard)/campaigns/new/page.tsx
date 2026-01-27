// New Campaign Page

import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { CampaignWizard } from '@/components/campaigns/campaign-wizard'
import { workspaceHasFeature, isWorkspaceWithinLimit } from '@/lib/tier/server'
import Link from 'next/link'

export default async function NewCampaignPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Check if campaigns feature is available
  const hasCampaigns = await workspaceHasFeature(user.workspace_id, 'campaigns')
  if (!hasCampaigns) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
            <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-zinc-900">Upgrade to create campaigns</h3>
          <p className="mt-2 text-sm text-zinc-500">
            Email campaigns require a paid plan. Upgrade to start reaching out to leads at scale.
          </p>
          <Link
            href="/settings/billing"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Upgrade Now
          </Link>
        </div>
      </div>
    )
  }

  // Check if within campaign limit
  const { withinLimit, used, limit } = await isWorkspaceWithinLimit(user.workspace_id, 'campaigns')
  if (!withinLimit) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-amber-800">Campaign limit reached</h3>
          <p className="mt-2 text-sm text-amber-700">
            You've created {used} of {limit} campaigns allowed on your plan.
            Upgrade to create more campaigns.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50"
            >
              View Campaigns
            </Link>
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <CampaignWizard />
}
