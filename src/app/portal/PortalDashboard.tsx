'use client'

import { PACKAGES, type PackageSlug } from '@/types/onboarding'

interface PortalClient {
  company_name: string
  status: string
  packages_selected: PackageSlug[]
  setup_fee: number | null
  recurring_fee: number | null
  enrichment_status: string
  copy_generation_status: string
  copy_approval_status: string
  start_timeline: string | null
  created_at: string
  onboarding_complete: boolean
  confirmation_email_sent: boolean
}

interface MilestoneItem {
  label: string
  description: string
  status: 'complete' | 'in_progress' | 'upcoming'
}

function buildMilestones(client: PortalClient): MilestoneItem[] {
  return [
    {
      label: 'Onboarding received',
      description: 'Your onboarding form has been submitted and received by our team.',
      status: client.onboarding_complete ? 'complete' : 'in_progress',
    },
    {
      label: 'ICP analysis',
      description:
        'We are analyzing your ideal customer profile to build targeted audiences.',
      status:
        client.enrichment_status === 'complete'
          ? 'complete'
          : client.enrichment_status === 'processing'
            ? 'in_progress'
            : 'upcoming',
    },
    {
      label: 'Email copy',
      description:
        'Crafting personalized email sequences tailored to your audience.',
      status:
        client.copy_generation_status === 'complete' ||
        client.copy_generation_status === 'not_applicable'
          ? client.copy_approval_status === 'approved' ||
            client.copy_approval_status === 'not_applicable'
            ? 'complete'
            : 'in_progress'
          : client.copy_generation_status === 'processing'
            ? 'in_progress'
            : 'upcoming',
    },
    {
      label: 'Infrastructure setup',
      description:
        'Setting up domains, inboxes, and warming infrastructure for deliverability.',
      status:
        client.status === 'active' || client.status === 'reporting'
          ? 'complete'
          : client.status === 'setup'
            ? 'in_progress'
            : 'upcoming',
    },
    {
      label: 'Campaign launch',
      description: 'Your campaigns are live and generating results.',
      status:
        client.status === 'active' || client.status === 'reporting'
          ? 'complete'
          : 'upcoming',
    },
  ]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function MilestoneIcon({ status }: { status: MilestoneItem['status'] }) {
  if (status === 'complete') {
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
        <svg
          className="h-4 w-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </div>
    )
  }

  if (status === 'in_progress') {
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-50">
        <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white">
      <div className="h-2 w-2 rounded-full bg-gray-300" />
    </div>
  )
}

export function PortalDashboard({ client }: { client: PortalClient }) {
  const milestones = buildMilestones(client)
  const completedCount = milestones.filter((m) => m.status === 'complete').length
  const progressPercent = Math.round(
    (completedCount / milestones.length) * 100
  )

  const packages = (client.packages_selected || []) as PackageSlug[]

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {client.company_name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your onboarding progress and campaign status below.
        </p>
      </div>

      {/* Progress section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Onboarding Progress
          </h2>
          <span className="text-sm font-medium text-blue-600">
            {progressPercent}% complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {completedCount} of {milestones.length} milestones completed
          </p>
        </div>

        {/* Milestones */}
        <div className="space-y-0">
          {milestones.map((milestone, index) => {
            const isLast = index === milestones.length - 1
            return (
              <div key={milestone.label} className="flex gap-4">
                {/* Icon + connector line */}
                <div className="flex flex-col items-center">
                  <MilestoneIcon status={milestone.status} />
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 my-1 ${
                        milestone.status === 'complete'
                          ? 'bg-blue-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                  <p
                    className={`text-sm font-medium ${
                      milestone.status === 'complete'
                        ? 'text-gray-900'
                        : milestone.status === 'in_progress'
                          ? 'text-blue-700'
                          : 'text-gray-400'
                    }`}
                  >
                    {milestone.label}
                    {milestone.status === 'in_progress' && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        In progress
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {milestone.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Package summary + Pricing */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Packages */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Packages
          </h2>
          {packages.length > 0 ? (
            <ul className="space-y-3">
              {packages.map((slug) => {
                const pkg = PACKAGES[slug]
                if (!pkg) return null
                return (
                  <li key={slug} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-blue-50">
                      <svg
                        className="h-3 w-3 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {pkg.label}
                      </p>
                      <p className="text-xs text-gray-400">{pkg.description}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">
              No packages have been assigned yet.
            </p>
          )}
        </div>

        {/* Pricing */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pricing Summary
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Setup Fee</p>
                <p className="text-xs text-gray-400">One-time</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {client.setup_fee != null
                  ? formatCurrency(client.setup_fee)
                  : '--'}
              </p>
            </div>
            <div className="border-t border-gray-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Recurring Fee
                </p>
                <p className="text-xs text-gray-400">Monthly</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {client.recurring_fee != null
                  ? formatCurrency(client.recurring_fee)
                  : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {client.start_timeline && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Estimated Launch Timeline
              </p>
              <p className="mt-0.5 text-sm text-blue-700">
                {client.start_timeline}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Onboarded date */}
      <div className="text-center text-xs text-gray-400">
        Onboarding submitted on {formatDate(client.created_at)}
      </div>

      {/* Support */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          Questions?
        </h3>
        <p className="text-sm text-gray-500">
          Our team is here to help. Reach out anytime at{' '}
          <a
            href="mailto:support@meetcursive.com"
            className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            support@meetcursive.com
          </a>
        </p>
      </div>
    </div>
  )
}
