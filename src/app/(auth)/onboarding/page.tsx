'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

// URL validation helpers
const normalizeUrl = (url: string): string => {
  let normalized = url.trim().toLowerCase()
  if (!normalized) return ''
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized
  }
  return normalized
}

const isValidUrl = (url: string): boolean => {
  if (!url) return true // Empty is valid (optional field)
  try {
    const normalized = normalizeUrl(url)
    const urlObj = new URL(normalized)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

// Extract domain from URL
const extractDomain = (url: string): string | null => {
  try {
    const normalized = normalizeUrl(url)
    if (!normalized) return null
    const urlObj = new URL(normalized)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

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
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [serviceAreas, setServiceAreas] = useState<string[]>([])

  // Company enrichment
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [companyData, setCompanyData] = useState<{
    name?: string
    industry?: string
    description?: string
  } | null>(null)
  const [enrichmentLoading, setEnrichmentLoading] = useState(false)

  // Debounce website URL for logo fetching
  const debouncedWebsiteUrl = useDebounce(websiteUrl, 500)

  // Fetch company logo when website URL changes
  const fetchCompanyInfo = useCallback(async () => {
    const domain = extractDomain(debouncedWebsiteUrl)
    if (!domain) {
      setCompanyLogo(null)
      setCompanyData(null)
      return
    }

    setEnrichmentLoading(true)
    try {
      const response = await fetch(`/api/enrich/company?domain=${encodeURIComponent(domain)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setCompanyLogo(data.data.logoUrl || data.data.faviconUrl || null)
          setCompanyData({
            name: data.data.name,
            industry: data.data.industry,
            description: data.data.description,
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch company info:', err)
    } finally {
      setEnrichmentLoading(false)
    }
  }, [debouncedWebsiteUrl])

  useEffect(() => {
    fetchCompanyInfo()
  }, [fetchCompanyInfo])

  // Auto-fill business name from enrichment data
  useEffect(() => {
    if (companyData?.name && !businessName) {
      handleBusinessNameChange(companyData.name)
    }
  }, [companyData?.name])

  // Auto-fill industry from enrichment data
  useEffect(() => {
    if (companyData?.industry && !industry) {
      const matchedIndustry = SERVICE_INDUSTRIES.find(
        ind => companyData.industry?.toLowerCase().includes(ind.toLowerCase())
      )
      if (matchedIndustry) {
        setIndustry(matchedIndustry)
      }
    }
  }, [companyData?.industry])

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
      // Prepare website URL
      const normalizedWebsiteUrl = websiteUrl ? normalizeUrl(websiteUrl) : null

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
          website_url: normalizedWebsiteUrl,
          scrape_status: normalizedWebsiteUrl ? 'pending' : null,
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

      // Trigger company enrichment if URL was provided
      if (normalizedWebsiteUrl) {
        try {
          // First, try to enrich and save company data
          await fetch('/api/enrich/company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              website: normalizedWebsiteUrl,
              saveToWorkspace: true,
            }),
          })
        } catch (enrichError) {
          // Non-blocking - don't fail onboarding if enrichment fails
          console.error('Failed to enrich company:', enrichError)
        }

        // Also trigger background website scraping for additional data
        try {
          await fetch('/api/inngest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'workspace/scrape-website',
              data: {
                workspaceId: (workspace as any).id,
                websiteUrl: normalizedWebsiteUrl,
              },
            }),
          })
        } catch (scrapeError) {
          // Non-blocking - don't fail onboarding if scrape fails to trigger
          console.error('Failed to trigger website scrape:', scrapeError)
        }
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
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Cursive"
              width={90}
              height={90}
              priority
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome to Cursive
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up your account to start receiving leads
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`h-1 w-12 ml-4 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1: Business Info */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
            <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Tell us about your business
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => handleBusinessNameChange(e.target.value)}
                    className="w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                    placeholder="Smith HVAC Services"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    required
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                  >
                    <option value="">Select your industry</option>
                    {SERVICE_INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    We&apos;ll match you with leads in your industry
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex gap-3">
                    {/* Logo preview */}
                    <div className="flex-shrink-0">
                      {enrichmentLoading ? (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      ) : companyLogo ? (
                        <img
                          src={companyLogo}
                          alt="Company logo"
                          className="w-12 h-12 rounded-lg object-contain border border-gray-200 bg-white"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : websiteUrl && isValidUrl(websiteUrl) ? (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className={`w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ${
                          websiteUrl && !isValidUrl(websiteUrl) ? 'ring-red-500' : 'ring-gray-300'
                        } placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm`}
                        placeholder="https://yourcompany.com"
                      />
                      {websiteUrl && !isValidUrl(websiteUrl) && (
                        <p className="mt-1 text-xs text-red-600">Please enter a valid URL</p>
                      )}
                    </div>
                  </div>
                  {companyData?.name && (
                    <p className="mt-2 text-xs text-green-600">
                      Found: {companyData.name}{companyData.industry ? ` - ${companyData.industry}` : ''}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    We&apos;ll analyze your site to better understand your business
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!businessName || !industry || (websiteUrl && !isValidUrl(websiteUrl))}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Service Areas */}
        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-6">
            <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Where do you serve?
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Select the states where you can take on new customers
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllStates}
                    className="text-xs text-gray-600 hover:text-gray-900 underline"
                  >
                    Select all
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={clearAllStates}
                    className="text-xs text-gray-600 hover:text-gray-900 underline"
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
                    className={`px-3 py-2 text-xs font-medium rounded-md border transition-all ${
                      serviceAreas.includes(state.code)
                        ? 'bg-blue-600 text-white border-transparent'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {state.code}
                  </button>
                ))}
              </div>

              {serviceAreas.length > 0 && (
                <p className="mt-4 text-xs text-gray-600">
                  Selected: {serviceAreas.length} state{serviceAreas.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-md bg-white px-6 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={serviceAreas.length === 0}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && (
          <form onSubmit={handleCreateWorkspace} className="space-y-6">
            <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Review your setup
              </h3>

              <dl className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <dt className="text-sm text-gray-600">Business Name</dt>
                  <dd className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {companyLogo && (
                      <img
                        src={companyLogo}
                        alt=""
                        className="w-6 h-6 rounded object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    )}
                    {businessName}
                  </dd>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <dt className="text-sm text-gray-600">Industry</dt>
                  <dd className="text-sm font-medium text-gray-900">{industry}</dd>
                </div>
                {websiteUrl && (
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <dt className="text-sm text-gray-600">Website</dt>
                    <dd className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {normalizeUrl(websiteUrl)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <dt className="text-sm text-gray-600">Service Areas</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {serviceAreas.length === 50 ? 'All US States' : `${serviceAreas.length} states`}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm text-gray-600">Plan</dt>
                  <dd className="text-sm font-medium text-blue-600">
                    Free - 3 leads/day included
                  </dd>
                </div>
              </dl>

              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <p className="text-xs text-gray-600">
                  <strong className="text-gray-900">How it works:</strong> We&apos;ll automatically match you with {industry} leads in your service areas. You&apos;ll receive up to 3 free leads per day, and you can upgrade anytime to get more.
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                className="rounded-md bg-white px-6 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
