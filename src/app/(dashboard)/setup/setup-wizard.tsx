'use client'

/**
 * Setup Wizard — single-page aha-moment flow
 *
 * The user enters their URL once. We then orchestrate four backend calls
 * in sequence (pixel + AI ICP run in parallel first, then targeting save,
 * then lead population) and surface real, enriched leads on the same
 * page before the user ever lands on /dashboard.
 *
 * Phases:
 *   idle      → URL form (pre-filled from auto-provisioned pixel domain)
 *   working   → loading checklist (animated as each step completes)
 *   done      → success screen with sample leads + CTA into dashboard
 *   error     → recoverable error with retry
 *
 * Pixel install is intentionally NOT a step here. It's surfaced as a
 * secondary CTA on the dashboard for users who want to also track their
 * own website visitors. The aha moment is "I see real leads NOW" — the
 * pixel is a value-multiplier, not a gate.
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/hooks/use-toast'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Globe,
  AlertCircle,
} from 'lucide-react'

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

interface SampleLead {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  job_title: string | null
  company_name: string | null
  email: string | null
  city: string | null
  state: string | null
}

interface SetupWizardProps {
  initialUrl: string
  userName: string | null
  /** True when AutoSubmitOnboarding flagged a targeting save failure on the
   *  POST /api/onboarding/setup call. Surfaced as a banner so the user knows
   *  the wizard's "save preferences" step is the recovery path. */
  targetingFailed?: boolean
  existingPixel: ExistingPixel | null
  existingTargeting: ExistingTargeting | null
  /** True when the user previously visited /setup but didn't complete it.
   *  Triggers "welcome back" copy instead of first-time copy. */
  isReturning?: boolean
}

// ─── Phase machine ────────────────────────────────────────────────────────────

type Phase =
  | 'idle'
  | 'creating-pixel'
  | 'analyzing-site'
  | 'saving-icp'
  | 'finding-leads'
  | 'done'
  | 'error'

interface SetupResult {
  pixel: ExistingPixel
  icp: IcpSuggestions
  leadCount: number
  sampleLeads: SampleLead[]
  pendingSetup: boolean
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SetupWizard({
  initialUrl,
  userName,
  targetingFailed = false,
  existingPixel,
  existingTargeting: _existingTargeting,
  isReturning = false,
}: SetupWizardProps) {
  const router = useRouter()
  const toast = useToast()

  const [url, setUrl] = useState(initialUrl)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SetupResult | null>(null)

  const wasPrefilledFromEmail = !!existingPixel?.domain && !!initialUrl
  const firstName = userName?.split(' ')[0] || 'there'
  const isWorking =
    phase === 'creating-pixel' ||
    phase === 'analyzing-site' ||
    phase === 'saving-icp' ||
    phase === 'finding-leads'

  // ── Run the full setup pipeline ──────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!url) {
        toast.error('Please enter your website URL')
        return
      }

      // Auto-prefix https:// and validate
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

      try {
        // ── Phase 1: pixel + ICP in parallel ──────────────────────────────
        setPhase('creating-pixel')

        const [pixelRes, icpRes] = await Promise.all([
          fetch('/api/pixel/provision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ website_url: normalized }),
          }),
          // Bump phase as soon as the AI call kicks off so the user sees
          // forward progress instead of staring at "creating pixel" for the
          // full duration.
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
          throw new Error(body.error || 'Failed to set up your pixel. Please try again.')
        }
        const pixelData = await pixelRes.json()

        // ICP failure is non-fatal — we can still pull leads using a default
        // industry/state, the user just won't see AI-generated context.
        let icp: IcpSuggestions
        if (icpRes.ok) {
          const icpBody = await icpRes.json()
          icp = icpBody.data as IcpSuggestions
        } else {
          icp = {
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
        }

        // ── Phase 2: save targeting from AI suggestions ────────────────────
        // /api/leads/targeting also writes users.industry_segment +
        // users.location_segment, which is what populate-initial reads.
        // This MUST complete before we call populate-initial.
        setPhase('saving-icp')

        const industriesToSave =
          icp.target_industries.length > 0
            ? icp.target_industries.slice(0, 5)
            : ['Technology'] // sensible default if AI returned nothing

        const targetingRes = await fetch('/api/leads/targeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_industries: industriesToSave,
            target_states: [], // empty = nationwide US — broadest match
            is_active: true,
          }),
        })

        // Targeting failure is also non-fatal — we'll still try populate-initial
        // and rely on its fallback chain.
        if (!targetingRes.ok) {
          // log but don't throw
          // eslint-disable-next-line no-console
          console.warn('[setup] targeting save failed, continuing')
        }

        // ── Phase 3: pull real leads from AudienceLab ──────────────────────
        setPhase('finding-leads')

        let leadCount = 0
        let pendingSetup = false
        try {
          const populateRes = await fetch('/api/leads/populate-initial', {
            method: 'POST',
          })
          if (populateRes.ok) {
            const populateData = await populateRes.json()
            leadCount = populateData.count ?? 0
            pendingSetup = populateData.pending_setup === true
          }
        } catch {
          // Network or timeout — continue, user will see the "preparing" state
        }

        // ── Phase 4: fetch a few sample leads to show in the success screen
        let sampleLeads: SampleLead[] = []
        if (leadCount > 0) {
          try {
            const sampleRes = await fetch('/api/leads?per_page=3&page=1')
            if (sampleRes.ok) {
              const sampleData = await sampleRes.json()
              const rawLeads: unknown =
                sampleData?.data?.leads ?? sampleData?.leads ?? sampleData?.data ?? []
              const arr = Array.isArray(rawLeads) ? rawLeads : []
              sampleLeads = arr.slice(0, 3).map((l: Record<string, unknown>) => ({
                id: String(l.id ?? ''),
                full_name: (l.full_name as string | null) ?? null,
                first_name: (l.first_name as string | null) ?? null,
                last_name: (l.last_name as string | null) ?? null,
                job_title: (l.job_title as string | null) ?? null,
                company_name: (l.company_name as string | null) ?? null,
                email: (l.email as string | null) ?? null,
                city: (l.city as string | null) ?? null,
                state: (l.state as string | null) ?? null,
              }))
            }
          } catch {
            // sample leads are nice-to-have, not required
          }
        }

        // ── Done ───────────────────────────────────────────────────────────
        setResult({
          pixel: {
            pixel_id: pixelData.pixel_id,
            domain: pixelData.domain,
            install_url: pixelData.install_url,
            snippet: pixelData.snippet,
            trial_status: 'trial',
            trial_ends_at: null,
          },
          icp,
          leadCount,
          sampleLeads,
          pendingSetup,
        })
        setPhase('done')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        setError(message)
        setPhase('error')
      }
    },
    [url, toast],
  )

  const goToDashboard = () => {
    router.push('/dashboard?onboarding=complete')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {isReturning
            ? `Welcome back, ${firstName} — let's finish where you left off`
            : `Let's find your first leads, ${firstName}`}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isReturning
            ? 'One more step. Enter your website and we\'ll pull your first batch of enriched leads.'
            : 'One step. Enter your website and we\'ll set up your pixel, analyze your site, and pull your first batch of enriched leads.'}
        </p>
      </div>

      {/* Targeting failure recovery banner — surfaced when AutoSubmitOnboarding
          flagged a targeting save failure on the workspace creation call.
          Without this, users land on the wizard with no idea their initial
          targeting wasn't saved and just see "Find My First Leads" with no
          context. Completing the wizard recovers the failed state. */}
      {targetingFailed && phase === 'idle' && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-amber-900">
              We didn&apos;t finish saving your targeting from signup
            </p>
            <p className="text-amber-800 mt-0.5">
              No worries — completing this step rebuilds your audience from your URL and pulls your first leads.
            </p>
          </div>
        </div>
      )}

      {/* Idle / form */}
      {phase === 'idle' && (
        <FormCard
          url={url}
          setUrl={setUrl}
          onSubmit={handleSubmit}
          wasPrefilledFromEmail={wasPrefilledFromEmail}
          existingDomain={existingPixel?.domain ?? null}
        />
      )}

      {/* Working / loading checklist */}
      {isWorking && <WorkingChecklist phase={phase} />}

      {/* Error */}
      {phase === 'error' && (
        <ErrorCard
          message={error ?? 'Something went wrong.'}
          onRetry={() => {
            setError(null)
            setPhase('idle')
          }}
        />
      )}

      {/* Done */}
      {phase === 'done' && result && (
        <SuccessCard result={result} onContinue={goToDashboard} />
      )}

      {/* Skip — only visible while idle, never during work */}
      {phase === 'idle' && (
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now → go to dashboard
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Form card (idle state) ──────────────────────────────────────────────────

interface FormCardProps {
  url: string
  setUrl: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  wasPrefilledFromEmail: boolean
  existingDomain: string | null
}

function FormCard({
  url,
  setUrl,
  onSubmit,
  wasPrefilledFromEmail,
  existingDomain,
}: FormCardProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
      {wasPrefilledFromEmail && existingDomain && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-medium text-foreground">
              We pre-filled this from your email — change it if your marketing site is different.
            </p>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="url" className="block text-sm font-medium text-foreground mb-2">
          Your website URL
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
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          We&apos;ll use this to identify your audience and set up your tracking pixel. No code required from you.
        </p>
      </div>

      <button
        type="submit"
        disabled={!url}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" />
        Find My First Leads
        <ArrowRight className="h-4 w-4" />
      </button>

      <p className="text-center text-[11px] text-muted-foreground">
        Takes about 30 seconds. No credit card required.
      </p>
    </form>
  )
}

// ─── Working checklist ───────────────────────────────────────────────────────

interface ChecklistStep {
  key: Phase
  label: string
  workingLabel: string
}

const STEPS: ChecklistStep[] = [
  { key: 'creating-pixel', label: 'Tracking pixel ready', workingLabel: 'Setting up your tracking pixel' },
  { key: 'analyzing-site', label: 'Analyzed your site', workingLabel: 'Analyzing your homepage with AI' },
  { key: 'saving-icp', label: 'Audience configured', workingLabel: 'Configuring your target audience' },
  { key: 'finding-leads', label: 'Pulled enriched leads', workingLabel: 'Finding leads matching your audience' },
]

const PHASE_ORDER: Phase[] = ['creating-pixel', 'analyzing-site', 'saving-icp', 'finding-leads']

function WorkingChecklist({ phase }: { phase: Phase }) {
  const currentIdx = PHASE_ORDER.indexOf(phase)

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-base font-medium text-foreground">Working on it...</span>
      </div>
      <ol className="space-y-3.5">
        {STEPS.map((step, idx) => {
          const isComplete = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isPending = idx > currentIdx

          return (
            <li key={step.key} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {isComplete && <CheckCircle2 className="h-5 w-5 text-primary" />}
                {isCurrent && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {isPending && (
                  <div className="h-4 w-4 rounded-full border-2 border-muted" />
                )}
              </div>
              <span
                className={[
                  'text-sm',
                  isComplete && 'text-foreground',
                  isCurrent && 'text-foreground font-medium',
                  isPending && 'text-muted-foreground',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {isCurrent ? step.workingLabel : step.label}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Hang tight — usually 10–30 seconds.
      </p>
    </div>
  )
}

// ─── Success card ────────────────────────────────────────────────────────────

interface SuccessCardProps {
  result: SetupResult
  onContinue: () => void
}

function SuccessCard({ result, onContinue }: SuccessCardProps) {
  const { pixel, icp, leadCount, sampleLeads, pendingSetup } = result
  const hasLeads = leadCount > 0 && sampleLeads.length > 0

  return (
    <div className="space-y-5">
      {/* AI summary card */}
      {(icp.company_summary || icp.value_prop) && (
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
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  AI-generated from your site
                </span>
              </div>
              {icp.company_name && (
                <p className="mt-1 font-semibold text-foreground">{icp.company_name}</p>
              )}
              {icp.icp_description && (
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {icp.icp_description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lead count + sample leads */}
      {hasLeads ? (
        <div className="rounded-xl border-2 border-primary/30 bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {leadCount} enriched lead{leadCount === 1 ? '' : 's'} ready
              </h2>
              <p className="text-xs text-muted-foreground">
                Real people, verified contact info, matched to your audience.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {sampleLeads.map((lead) => {
              const name =
                lead.full_name ||
                [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
                'Unknown'
              const initials = name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase()
              const location = [lead.city, lead.state].filter(Boolean).join(', ')

              return (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[lead.job_title, lead.company_name].filter(Boolean).join(' · ') || '—'}
                      {location && <span className="ml-1">· {location}</span>}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            View All {leadCount} Lead{leadCount === 1 ? '' : 's'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* No leads yet — pending setup or empty audience */
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Your audience is set up</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {pendingSetup
              ? "Your targeting is being processed. Most users see leads within minutes — we'll email you the moment your first matches arrive. If we need more info to dial in your audience, we'll reach out within a few hours."
              : 'Your targeting is configured. New leads will appear in your dashboard as we identify matches.'}
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Pixel install — secondary CTA. Not gating anything. */}
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Want to track YOUR website visitors too?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Install the tracking pixel on{' '}
              <strong className="text-foreground">{pixel.domain || 'your site'}</strong>{' '}
              to identify anonymous visitors in real time. Takes 2 minutes — copy a snippet
              into your &lt;head&gt;.
            </p>
            <Link
              href="/settings/pixel"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Install pixel →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Error card ──────────────────────────────────────────────────────────────

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-foreground">Setup hit a snag</h2>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
