'use client'

/**
 * Setup Wizard — client component
 *
 * Owns the multi-step state for the 3-step onboarding flow:
 *   1. URL paste → creates pixel + runs AI ICP extraction
 *   2. Confirm ICP (industries + geography) → saves to user_targeting
 *   3. Pixel install with live verification → redirects to /dashboard
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/hooks/use-toast'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2, Sparkles, Globe, Target, Code2 } from 'lucide-react'
import { PixelInstallTabs } from '@/components/pixel/PixelInstallTabs'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExistingPixel {
  pixel_id: string
  domain: string | null
  install_url: string | null
  snippet: string | null
  trial_status: string | null
  trial_ends_at: string | null
}

interface ExistingTargeting {
  target_industries: string[]
  target_states: string[]
}

interface IcpSuggestions {
  company_name: string
  company_summary: string
  icp_description: string
  target_industries: string[]
  target_titles: string[]
  target_company_sizes: string[]
  target_geography: string[]
  intent_keywords: string[]
  pain_points: string
  value_prop: string
  site_preview: {
    title: string | null
    description: string | null
    image: string | null
    favicon: string
  }
}

interface SetupWizardProps {
  initialStep: 1 | 2 | 3
  initialUrl: string
  userName: string | null
  existingPixel: ExistingPixel | null
  existingTargeting: ExistingTargeting | null
}

// ─── US states — aligned with existing /api/leads/targeting schema ────────────
const US_STATES: Array<{ code: string; name: string }> = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
]

// ─── Main component ───────────────────────────────────────────────────────────

export function SetupWizard({
  initialStep,
  initialUrl,
  userName,
  existingPixel,
  existingTargeting,
}: SetupWizardProps) {
  const router = useRouter()
  const toast = useToast()

  const [step, setStep] = useState<1 | 2 | 3>(initialStep)
  const [url, setUrl] = useState(initialUrl)
  const [loading, setLoading] = useState(false)
  const [pixel, setPixel] = useState<ExistingPixel | null>(existingPixel)
  const [icp, setIcp] = useState<IcpSuggestions | null>(null)
  const [industries, setIndustries] = useState<string[]>(existingTargeting?.target_industries ?? [])
  const [states, setStates] = useState<string[]>(existingTargeting?.target_states ?? [])
  const [saving, setSaving] = useState(false)

  // Whether the URL field was pre-filled from an auto-provisioned pixel.
  // Step 1 surfaces a "we guessed this from your email — change it if needed"
  // banner so users don't silently end up tracking the wrong domain.
  const wasPrefilledFromEmail = !!existingPixel?.domain && !!initialUrl

  const firstName = userName?.split(' ')[0] || 'there'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Let&apos;s get you set up, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          3 quick steps to start identifying your website visitors and building your lead database.
        </p>
      </div>

      {/* Progress rail */}
      <StepRail currentStep={step} />

      {/* Step content */}
      <div className="mt-8">
        {step === 1 && (
          <StepOneUrl
            url={url}
            setUrl={setUrl}
            loading={loading}
            setLoading={setLoading}
            wasPrefilledFromEmail={wasPrefilledFromEmail}
            existingDomain={existingPixel?.domain ?? null}
            onComplete={(newPixel, newIcp) => {
              setPixel(newPixel)
              setIcp(newIcp)
              // Pre-fill targeting from ICP if the user hasn't set any yet
              if (!existingTargeting?.target_industries?.length) {
                setIndustries(newIcp.target_industries.slice(0, 3))
              }
              // Default to US if target_geography includes United States
              if (!existingTargeting?.target_states?.length &&
                  newIcp.target_geography.includes('United States')) {
                // Leave states empty — user picks specific ones or skips for "all US"
              }
              setStep(2)
            }}
          />
        )}

        {step === 2 && (
          <StepTwoIcp
            icp={icp}
            pixel={pixel}
            industries={industries}
            setIndustries={setIndustries}
            states={states}
            setStates={setStates}
            saving={saving}
            onSave={async () => {
              setSaving(true)
              try {
                const res = await fetch('/api/leads/targeting', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    target_industries: industries,
                    target_states: states,
                    is_active: true,
                  }),
                })
                if (!res.ok) {
                  const body = await res.json().catch(() => ({}))
                  throw new Error(body.error || 'Failed to save preferences')
                }
                toast.success('Preferences saved')
                setStep(3)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to save preferences')
              } finally {
                setSaving(false)
              }
            }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && pixel && (
          <StepThreePixel
            pixel={pixel}
            onDone={() => {
              router.push('/dashboard?onboarding=complete')
            }}
            onBack={() => setStep(2)}
          />
        )}
      </div>

      {/* Skip link — always available, nothing is blocking */}
      <div className="mt-10 text-center">
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now → go to dashboard
        </Link>
      </div>
    </div>
  )
}

// ─── Progress rail ────────────────────────────────────────────────────────────

function StepRail({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Your site', icon: Globe },
    { n: 2, label: 'Your ICP', icon: Target },
    { n: 3, label: 'Install pixel', icon: Code2 },
  ]
  return (
    <div className="flex items-center gap-2">
      {steps.map(({ n, label, icon: Icon }, idx) => {
        const isCurrent = currentStep === n
        const isComplete = currentStep > n
        return (
          <div key={n} className="flex flex-1 items-center gap-2">
            <div
              className={[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                isComplete
                  ? 'bg-primary text-primary-foreground'
                  : isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
              ].join(' ')}
            >
              {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            <span
              className={[
                'text-sm font-medium',
                isCurrent ? 'text-foreground' : 'text-muted-foreground',
              ].join(' ')}
            >
              {label}
            </span>
            {idx < steps.length - 1 && (
              <div className="ml-2 h-px flex-1 bg-border" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Paste URL ────────────────────────────────────────────────────────

interface StepOneUrlProps {
  url: string
  setUrl: (v: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
  wasPrefilledFromEmail: boolean
  existingDomain: string | null
  onComplete: (pixel: ExistingPixel, icp: IcpSuggestions) => void
}

function StepOneUrl({
  url,
  setUrl,
  loading,
  setLoading,
  wasPrefilledFromEmail,
  existingDomain,
  onComplete,
}: StepOneUrlProps) {
  const toast = useToast()
  const [phase, setPhase] = useState<'idle' | 'creating-pixel' | 'analyzing-site'>('idle')

  // Did the user actually change the URL since it was pre-filled? Used to
  // show different copy on the submit button + a confirmation hint when
  // they're about to swap their pixel domain.
  const inputDomain = (() => {
    try {
      const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`
      return new URL(normalized).hostname.replace(/^www\./, '')
    } catch {
      return null
    }
  })()
  const isReplacingPixel =
    wasPrefilledFromEmail &&
    !!existingDomain &&
    !!inputDomain &&
    inputDomain !== existingDomain

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) {
      toast.error('Please enter your website URL')
      return
    }
    // Auto-prefix https:// if missing
    let normalized = url.trim()
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`
    }
    try {
      new URL(normalized)
    } catch {
      toast.error('Please enter a valid website URL')
      return
    }

    setLoading(true)
    setPhase('creating-pixel')

    try {
      // Run both in parallel — provisioning the pixel is independent of the
      // LLM analysis so we don't pay for the slowest path twice.
      const [pixelRes, icpRes] = await Promise.all([
        fetch('/api/pixel/provision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website_url: normalized }),
        }),
        (async () => {
          setPhase('analyzing-site')
          return fetch('/api/onboarding/icp-from-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: normalized }),
          })
        })(),
      ])

      if (!pixelRes.ok) {
        const body = await pixelRes.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to create pixel')
      }
      const pixelData = await pixelRes.json()

      if (!icpRes.ok) {
        // Non-fatal — we can still proceed without ICP pre-fill
        const fallback: IcpSuggestions = {
          company_name: '',
          company_summary: '',
          icp_description: '',
          target_industries: [],
          target_titles: [],
          target_company_sizes: [],
          target_geography: [],
          intent_keywords: [],
          pain_points: '',
          value_prop: '',
          site_preview: {
            title: null,
            description: null,
            image: null,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(normalized).hostname}&sz=128`,
          },
        }
        onComplete(
          {
            pixel_id: pixelData.pixel_id,
            domain: pixelData.domain,
            install_url: pixelData.install_url,
            snippet: pixelData.snippet,
            trial_status: 'trial',
            trial_ends_at: null,
          },
          fallback,
        )
        return
      }

      const icpBody = await icpRes.json()
      onComplete(
        {
          pixel_id: pixelData.pixel_id,
          domain: pixelData.domain,
          install_url: pixelData.install_url,
          snippet: pixelData.snippet,
          trial_status: 'trial',
          trial_ends_at: null,
        },
        icpBody.data as IcpSuggestions,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setPhase('idle')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">What&apos;s your website?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll install your tracking pixel and use AI to draft your ideal customer profile from your homepage.
        </p>
      </div>

      {/* Pre-fill notice — surfaces when we guessed the URL from the user's
          email domain. Critical so users don't silently end up tracking the
          wrong site (e.g. signed up with darren@gmail.com but actually run
          acme.com, or signed up with adam@parent-co.com for subsidiary.com). */}
      {wasPrefilledFromEmail && !isReplacingPixel && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-foreground">
              We pre-filled this from your email — is this your actual marketing site?
            </p>
            <p className="text-muted-foreground mt-0.5">
              Change it if your customers visit a different domain than the one in your email address.
            </p>
          </div>
        </div>
      )}

      {isReplacingPixel && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-amber-900">
              Replacing your tracking pixel
            </p>
            <p className="text-amber-800 mt-0.5">
              We&apos;ll deactivate the pixel for <strong>{existingDomain}</strong> and create a new one for <strong>{inputDomain}</strong>. Your trial status carries over.
            </p>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="url" className="block text-sm font-medium text-foreground mb-2">
          Website URL
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="url"
            type="text"
            autoFocus
            placeholder="yourcompany.com"
            className="block w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          We&apos;ll use this to identify anonymous visitors and pre-fill your ICP.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !url}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {phase === 'creating-pixel' && (isReplacingPixel ? 'Replacing your pixel...' : 'Setting up your pixel...')}
            {phase === 'analyzing-site' && 'Analyzing your site with AI...'}
            {phase === 'idle' && 'Working...'}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {isReplacingPixel ? 'Confirm new domain' : wasPrefilledFromEmail ? 'Yes, this is correct' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  )
}

// ─── Step 2: Confirm ICP ──────────────────────────────────────────────────────

interface StepTwoIcpProps {
  icp: IcpSuggestions | null
  pixel: ExistingPixel | null
  industries: string[]
  setIndustries: (v: string[]) => void
  states: string[]
  setStates: (v: string[]) => void
  saving: boolean
  onSave: () => void
  onBack: () => void
}

function StepTwoIcp({
  icp,
  pixel,
  industries,
  setIndustries,
  states,
  setStates,
  saving,
  onSave,
  onBack,
}: StepTwoIcpProps) {
  const [industryInput, setIndustryInput] = useState('')

  const addIndustry = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || industries.includes(trimmed)) return
    setIndustries([...industries, trimmed])
    setIndustryInput('')
  }

  const removeIndustry = (value: string) => {
    setIndustries(industries.filter((i) => i !== value))
  }

  const toggleState = (code: string) => {
    if (states.includes(code)) {
      setStates(states.filter((s) => s !== code))
    } else {
      setStates([...states, code])
    }
  }

  return (
    <div className="space-y-6">
      {/* AI-generated company summary */}
      {icp && (icp.company_summary || icp.value_prop) && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            {icp.site_preview.favicon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={icp.site_preview.favicon}
                alt=""
                className="h-8 w-8 shrink-0 rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  AI-generated from your site
                </span>
              </div>
              {icp.company_name && (
                <p className="mt-1.5 font-semibold text-foreground">{icp.company_name}</p>
              )}
              {icp.company_summary && (
                <p className="mt-1 text-sm text-muted-foreground">{icp.company_summary}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ICP description readout (read-only, for context) */}
      {icp?.icp_description && (
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Suggested ideal customer
            </span>
          </div>
          <p className="text-sm text-foreground">{icp.icp_description}</p>
        </div>
      )}

      {/* Industries */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <label className="block text-sm font-semibold text-foreground mb-1">
          Target industries
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Industries you want to target. We&apos;ve pre-filled suggestions — tweak them if you like.
        </p>

        {/* Selected industries as chips */}
        {industries.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {industries.map((industry) => (
              <span
                key={industry}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {industry}
                <button
                  type="button"
                  onClick={() => removeIndustry(industry)}
                  className="text-primary/70 hover:text-primary"
                  aria-label={`Remove ${industry}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add-new input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add an industry (e.g. SaaS, HVAC, Real Estate)..."
            value={industryInput}
            onChange={(e) => setIndustryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addIndustry(industryInput)
              }
            }}
            className="block flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => addIndustry(industryInput)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Add
          </button>
        </div>

        {/* AI suggestions that aren't selected yet */}
        {icp && icp.target_industries.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1.5">Click to add:</p>
            <div className="flex flex-wrap gap-1.5">
              {icp.target_industries
                .filter((i) => !industries.includes(i))
                .slice(0, 8)
                .map((industry) => (
                  <button
                    key={industry}
                    type="button"
                    onClick={() => addIndustry(industry)}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    + {industry}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* US states (optional) */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <label className="block text-sm font-semibold text-foreground mb-1">
          Target US states <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Leave blank to target all US states. Pick specific states if you only sell regionally.
        </p>

        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-8">
          {US_STATES.map(({ code, name }) => {
            const selected = states.includes(code)
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleState(code)}
                title={name}
                className={[
                  'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40',
                ].join(' ')}
              >
                {code}
              </button>
            )
          })}
        </div>
      </div>

      {/* Pixel status badge — reassures the user it's already done */}
      {pixel && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            Your pixel is ready — install it in the next step.
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || industries.length === 0}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Install pixel with verification ──────────────────────────────────

type VerifyState = 'idle' | 'polling' | 'verified' | 'timeout'

interface StepThreePixelProps {
  pixel: ExistingPixel
  onDone: () => void
  onBack: () => void
}

function StepThreePixel({ pixel, onDone, onBack }: StepThreePixelProps) {
  const [verifyState, setVerifyState] = useState<VerifyState>('idle')
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCountRef = useRef(0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  const handleVerify = useCallback(async () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    pollCountRef.current = 0
    setVerifyState('polling')

    const doPoll = async () => {
      try {
        const response = await fetch('/api/pixel/verify')
        if (!response.ok) throw new Error('Verification request failed')
        const result: { verified: boolean } = await response.json()
        pollCountRef.current += 1

        if (result.verified) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setVerifyState('verified')
          return
        }

        // 24 attempts × 5s = 2 minutes
        if (pollCountRef.current >= 24) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setVerifyState('timeout')
        }
      } catch {
        // Network error — keep polling, will hit timeout naturally
      }
    }

    await doPoll()
    pollIntervalRef.current = setInterval(doPoll, 5_000)
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Install your pixel</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the snippet below to your site. Once installed, we&apos;ll identify anonymous visitors in real-time and turn them into enriched leads you can follow up with.
        </p>

        <div className="mt-5">
          <PixelInstallTabs pixelId={pixel.pixel_id} />
        </div>

        {/* Verification */}
        <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
          {verifyState === 'verified' ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-foreground">
                Pixel verified! You&apos;re ready to go.
              </span>
            </div>
          ) : verifyState === 'polling' ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Listening for pixel events... visit any page on your site in a new tab.
              </span>
            </div>
          ) : verifyState === 'timeout' ? (
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                No events yet. Make sure the snippet is in your <code className="rounded bg-muted px-1 text-xs">&lt;head&gt;</code> and try again, or skip and come back later.
              </p>
              <button
                type="button"
                onClick={handleVerify}
                className="text-xs font-medium text-primary hover:underline"
              >
                Check again
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                Already installed? Verify it&apos;s working.
              </span>
              <button
                type="button"
                onClick={handleVerify}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                Verify installation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          {verifyState === 'verified' ? 'Go to dashboard' : 'I\'ll install it later'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
