'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Service industries that match lead sources
const SERVICE_INDUSTRIES = [
  'HVAC',
  'Roofing',
  'Plumbing',
  'Electrical',
  'Solar',
  'Real Estate',
  'Insurance',
  'Home Services',
  'Landscaping',
  'Pest Control',
  'Cleaning Services',
  'Auto Services',
  'Legal Services',
  'Financial Services',
  'Healthcare',
  'Other',
]

// US States for service area
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Business info
  const [businessName, setBusinessName] = useState('')
  const [businessSlug, setBusinessSlug] = useState('')
  const [industry, setIndustry] = useState('')
  const [serviceAreas, setServiceAreas] = useState<string[]>([])

  // Auto-generate slug from business name
  const handleBusinessNameChange = (name: string) => {
    setBusinessName(name)
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    setBusinessSlug(slug)
  }

  // Toggle state selection
  const toggleState = (stateCode: string) => {
    setServiceAreas((prev) =>
      prev.includes(stateCode)
        ? prev.filter((s) => s !== stateCode)
        : [...prev, stateCode]
    )
  }

  // Select all / none
  const selectAllStates = () => {
    setServiceAreas(US_STATES.map((s) => s.code))
  }

  const clearAllStates = () => {
    setServiceAreas([])
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

    // Validate inputs
    if (businessSlug.length < 3) {
      setError('Business name is too short')
      setLoading(false)
      return
    }

    if (!industry) {
      setError('Please select your industry')
      setLoading(false)
      return
    }

    if (serviceAreas.length === 0) {
      setError('Please select at least one service area')
      setLoading(false)
      return
    }

    // Check if slug is available
    const { data: existingWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', businessSlug)
      .single()

    if (existingWorkspace) {
      setError('This business name is already taken. Try a different name.')
      setLoading(false)
      return
    }

    try {
      // Create workspace with routing config
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: businessName,
          slug: businessSlug,
          subdomain: businessSlug,
          industry_vertical: industry,
          allowed_industries: [industry],
          allowed_regions: serviceAreas,
          routing_config: {
            enabled: true,
            industry_filter: [industry],
            geographic_filter: {
              countries: ['US'],
              states: serviceAreas,
              regions: [],
            },
            lead_assignment_method: 'round_robin',
          },
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
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-medium text-zinc-900">
            Welcome to LeadMe
          </h2>
          <p className="mt-2 text-[13px] text-zinc-600">
            Set up your account to start receiving leads
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-medium ${
                  step >= s
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className="h-1 w-12 bg-zinc-200 ml-4" />}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-[13px] font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Business Info */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
            <div className="rounded-lg bg-white border border-zinc-200 p-8">
              <h3 className="text-[15px] font-medium text-zinc-900 mb-6">
                Tell us about your business
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => handleBusinessNameChange(e.target.value)}
                    className="w-full h-10 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200"
                    placeholder="Smith HVAC Services"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                    Industry
                  </label>
                  <select
                    required
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-10 px-3 text-[13px] text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-200"
                  >
                    <option value="">Select your industry</option>
                    {SERVICE_INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-[12px] text-zinc-500">
                    We&apos;ll match you with leads in your industry
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!businessName || !industry}
                className="h-10 px-6 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Service Areas */}
        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-6">
            <div className="rounded-lg bg-white border border-zinc-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[15px] font-medium text-zinc-900">
                    Where do you serve?
                  </h3>
                  <p className="text-[12px] text-zinc-500 mt-1">
                    Select the states where you can take on new customers
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllStates}
                    className="text-[12px] text-zinc-600 hover:text-zinc-900 underline"
                  >
                    Select all
                  </button>
                  <span className="text-zinc-300">|</span>
                  <button
                    type="button"
                    onClick={clearAllStates}
                    className="text-[12px] text-zinc-600 hover:text-zinc-900 underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1">
                {US_STATES.map((state) => (
                  <button
                    key={state.code}
                    type="button"
                    onClick={() => toggleState(state.code)}
                    className={`px-3 py-2 text-[12px] font-medium rounded-lg border transition-all ${
                      serviceAreas.includes(state.code)
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {state.code}
                  </button>
                ))}
              </div>

              {serviceAreas.length > 0 && (
                <p className="mt-4 text-[12px] text-zinc-600">
                  Selected: {serviceAreas.length} state{serviceAreas.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-10 px-6 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={serviceAreas.length === 0}
                className="h-10 px-6 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && (
          <form onSubmit={handleCreateWorkspace} className="space-y-6">
            <div className="rounded-lg bg-white border border-zinc-200 p-8">
              <h3 className="text-[15px] font-medium text-zinc-900 mb-6">
                Review your setup
              </h3>

              <dl className="space-y-4">
                <div className="flex justify-between py-3 border-b border-zinc-100">
                  <dt className="text-[13px] text-zinc-600">Business Name</dt>
                  <dd className="text-[13px] font-medium text-zinc-900">{businessName}</dd>
                </div>
                <div className="flex justify-between py-3 border-b border-zinc-100">
                  <dt className="text-[13px] text-zinc-600">Industry</dt>
                  <dd className="text-[13px] font-medium text-zinc-900">{industry}</dd>
                </div>
                <div className="flex justify-between py-3 border-b border-zinc-100">
                  <dt className="text-[13px] text-zinc-600">Service Areas</dt>
                  <dd className="text-[13px] font-medium text-zinc-900">
                    {serviceAreas.length === 50 ? 'All US States' : `${serviceAreas.length} states`}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-[13px] text-zinc-600">Plan</dt>
                  <dd className="text-[13px] font-medium text-emerald-600">
                    Free - 3 leads/day included
                  </dd>
                </div>
              </dl>

              <div className="mt-6 p-4 bg-zinc-50 rounded-lg">
                <p className="text-[12px] text-zinc-600">
                  <strong className="text-zinc-900">How it works:</strong> We&apos;ll automatically match you with {industry} leads in your service areas. You&apos;ll receive up to 3 free leads per day, and you can upgrade anytime to get more.
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                className="h-10 px-6 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-10 px-6 text-[13px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Start Getting Leads'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
