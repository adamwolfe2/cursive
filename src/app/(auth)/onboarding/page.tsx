'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Workspace data
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [industryVertical, setIndustryVertical] = useState('')

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'E-commerce',
    'Marketing',
    'Real Estate',
    'Manufacturing',
    'Other',
  ]

  // Auto-generate slug from workspace name
  const handleWorkspaceNameChange = (name: string) => {
    setWorkspaceName(name)
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    setWorkspaceSlug(slug)
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    // Validate slug
    if (workspaceSlug.length < 3) {
      setError('Workspace slug must be at least 3 characters')
      setLoading(false)
      return
    }

    // Check if slug is available
    const { data: existingWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', workspaceSlug)
      .single()

    if (existingWorkspace) {
      setError('This workspace slug is already taken')
      setLoading(false)
      return
    }

    try {
      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceName,
          slug: workspaceSlug,
          subdomain: workspaceSlug,
          industry_vertical: industryVertical || null,
        } as any)
        .select()
        .single()

      if (workspaceError || !workspace) {
        throw workspaceError || new Error('Failed to create workspace')
      }

      // Create user profile
      const { error: userError } = await supabase.from('users').insert({
        auth_user_id: session.user.id,
        workspace_id: (workspace as any).id,
        email: session.user.email!,
        full_name:
          session.user.user_metadata.full_name ||
          session.user.user_metadata.name ||
          null,
        role: 'owner',
        plan: 'free',
        daily_credit_limit: 3,
      } as any)

      if (userError) {
        // Rollback workspace creation
        await supabase.from('workspaces').delete().eq('id', (workspace as any).id)
        throw userError
      }

      // Success! Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome to OpenInfo
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Let&apos;s set up your workspace to get started
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              step === 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            1
          </div>
          <div className="h-1 w-16 bg-gray-200" />
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              step === 2
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            2
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Workspace Details */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
            <div className="rounded-lg bg-white p-8 shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Workspace Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="workspace-name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Workspace Name
                  </label>
                  <input
                    id="workspace-name"
                    type="text"
                    required
                    value={workspaceName}
                    onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                    className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Acme Corporation"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    This will be displayed throughout the platform
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="workspace-slug"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Workspace Slug
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      id="workspace-slug"
                      type="text"
                      required
                      value={workspaceSlug}
                      onChange={(e) => setWorkspaceSlug(e.target.value)}
                      className="block w-full rounded-l-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="acme-corp"
                      pattern="[a-z0-9-]+"
                    />
                    <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 px-3 text-gray-500 sm:text-sm">
                      .openinfo.com
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Your workspace URL: {workspaceSlug || 'your-slug'}.openinfo.com
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="industry"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Industry (Optional)
                  </label>
                  <select
                    id="industry"
                    value={industryVertical}
                    onChange={(e) => setIndustryVertical(e.target.value)}
                    className="block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  >
                    <option value="">Select an industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Review & Create */}
        {step === 2 && (
          <form onSubmit={handleCreateWorkspace} className="space-y-6">
            <div className="rounded-lg bg-white p-8 shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Review & Create
              </h3>

              <dl className="divide-y divide-gray-100">
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    Workspace Name
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {workspaceName}
                  </dd>
                </div>
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    Workspace URL
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    {workspaceSlug}.openinfo.com
                  </dd>
                </div>
                {industryVertical && (
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm font-medium leading-6 text-gray-900">
                      Industry
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {industryVertical}
                    </dd>
                  </div>
                )}
                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium leading-6 text-gray-900">
                    Plan
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                    Free (3 credits/day)
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating workspace...' : 'Create Workspace'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
