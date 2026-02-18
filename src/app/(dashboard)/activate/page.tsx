'use client'

/**
 * Activate Page
 *
 * Two premium upsell flows triggered from the Website Visitors page:
 *   1. Lookalike Audience Builder — define ICP, we build the list
 *   2. Outbound Campaign Launcher — we run cold email on your behalf
 *
 * Multi-step wizard. On submit → Slack alert fires to Cursive team.
 */

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Users, Mail, ArrowRight, ArrowLeft, CheckCircle2,
  Sparkles, Target, Building2, MapPin, Briefcase,
  Zap, DollarSign, Clock, MessageSquare, Globe,
  ChevronRight, Star, Eye, Calendar, ClipboardList, Leaf,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ReactNode> = {
  calendar: <Calendar className="h-5 w-5" />,
  dollar: <DollarSign className="h-5 w-5" />,
  clipboard: <ClipboardList className="h-5 w-5" />,
  sprout: <Leaf className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />,
  eye: <Eye className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
}
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/design-system'
import { useToast } from '@/lib/hooks/use-toast'

// ─── Constants ─────────────────────────────────────────────

const INDUSTRIES = [
  'SaaS / Software', 'Financial Services', 'Healthcare', 'Real Estate',
  'E-commerce / Retail', 'Marketing / Agencies', 'Legal', 'Insurance',
  'Manufacturing', 'Construction / Trades', 'Consulting', 'Education',
  'Logistics / Supply Chain', 'HR / Recruiting', 'Other',
]

const JOB_TITLES = [
  'CEO / Founder', 'CTO', 'CFO', 'CMO', 'COO',
  'VP of Sales', 'VP of Marketing', 'Director of Operations',
  'Sales Manager', 'Marketing Manager', 'Business Owner',
  'Head of Growth', 'IT Manager', 'HR Director', 'Other',
]

const GEOGRAPHIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia',
  'Western Europe', 'DACH (Germany/Austria/Switzerland)',
  'Nordics', 'APAC', 'Latin America', 'Global',
]

const COMPANY_SIZES = [
  { value: '1-10', label: '1–10 (Solo/Startup)' },
  { value: '11-50', label: '11–50 (Small)' },
  { value: '51-200', label: '51–200 (Mid-Market)' },
  { value: '201-1000', label: '201–1,000 (Growth)' },
  { value: '1001+', label: '1,001+ (Enterprise)' },
]

const BUDGET_RANGES = [
  '$500–$1,000 / mo', '$1,000–$2,500 / mo',
  '$2,500–$5,000 / mo', '$5,000+ / mo', 'One-time project',
]

const CAMPAIGN_GOALS = [
  { value: 'book_demos', label: 'Book Demo Calls', icon: 'calendar', desc: 'Fill your calendar with qualified sales conversations' },
  { value: 'close_sales', label: 'Close Sales Directly', icon: 'dollar', desc: 'Drive revenue from cold outreach' },
  { value: 'grow_list', label: 'Grow Email List', icon: 'clipboard', desc: 'Build a warm, opt-in audience for long-term nurture' },
  { value: 'nurture', label: 'Nurture Pipeline', icon: 'sprout', desc: 'Stay top-of-mind until prospects are ready to buy' },
  { value: 'other', label: 'Something else', icon: 'sparkles', desc: "Tell us — we'll figure it out together" },
]

const AUDIENCE_SOURCES = [
  { value: 'website_visitors', label: 'My Website Visitors', icon: 'eye', desc: 'People your pixel already identified on your site' },
  { value: 'custom_audience', label: 'Build a Custom List', icon: 'target', desc: 'We build a fresh, targeted list from our database' },
  { value: 'both', label: 'Both', icon: 'zap', desc: 'Website visitors + custom prospecting list' },
]

const MESSAGE_TONES = [
  { value: 'professional', label: 'Professional', desc: 'Formal, authoritative, trust-building' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm, approachable, conversational' },
  { value: 'casual', label: 'Casual', desc: 'Relaxed, peer-to-peer, no fluff' },
  { value: 'bold', label: 'Bold', desc: 'Direct, confident, pattern-interrupting' },
]

// ─── Types ─────────────────────────────────────────────────

type FlowType = 'audience' | 'campaign' | null

interface AudienceForm {
  request_type: 'audience' | 'lookalike'
  industries: string[]
  job_titles: string[]
  geographies: string[]
  company_size: string
  seniority_levels: string[]
  icp_description: string
  use_case: string
  data_sources: string[]
  desired_volume: string
  budget_range: string
  timeline: string
  contact_name: string
  contact_email: string
  website_url: string
  additional_notes: string
}

interface CampaignForm {
  campaign_goal: string
  target_audience: string
  value_prop: string
  message_tone: string
  industries: string[]
  geographies: string[]
  job_titles: string[]
  company_size: string
  monthly_volume: string
  has_existing_copy: boolean
  existing_copy: string
  budget_range: string
  contact_name: string
  contact_email: string
  website_url: string
  additional_notes: string
}

// ─── Step indicator ────────────────────────────────────────

function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all',
            i < current ? 'bg-primary text-white' :
            i === current ? 'bg-primary text-white ring-4 ring-primary/20' :
            'bg-gray-100 text-gray-400'
          )}>
            {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          <span className={cn(
            'ml-1.5 text-xs hidden sm:block',
            i === current ? 'text-gray-900 font-medium' : 'text-gray-400'
          )}>
            {labels[i]}
          </span>
          {i < total - 1 && (
            <div className={cn('mx-2 h-px w-6 sm:w-10', i < current ? 'bg-primary' : 'bg-gray-200')} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Toggle chip ───────────────────────────────────────────

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3.5 py-2 rounded-full text-sm border transition-all',
        selected
          ? 'bg-primary text-white border-primary font-medium shadow-sm'
          : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40 hover:text-primary'
      )}
    >
      {label}
    </button>
  )
}

// ─── Section header ────────────────────────────────────────

function SectionHeader({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {sub && <p className="text-sm text-gray-500 ml-8">{sub}</p>}
    </div>
  )
}

// ─── Success screen ────────────────────────────────────────

function SuccessScreen({ flow, onReset }: { flow: FlowType; onReset: () => void }) {
  const router = useRouter()
  return (
    <div className="max-w-lg mx-auto text-center py-12 space-y-6">
      <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {flow === 'audience' ? "You're on the list!" : "Campaign request sent!"}
        </h2>
        <p className="text-gray-500">
          {flow === 'audience'
            ? "Our team has been notified and will reach out within 24 hours to scope your custom audience."
            : "Our team has been notified and will contact you within 24 hours to discuss your campaign."}
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-left space-y-3">
        <p className="text-sm font-semibold text-gray-700">What happens next</p>
        {(flow === 'audience' ? [
          'Our team reviews your ICP and data sources',
          'We scope the audience size and confirm pricing',
          'Sample of 25 leads delivered within 48 hours',
          'Full delivery on your timeline',
        ] : [
          'Our team reviews your brief and targeting',
          'We scope the campaign and confirm pricing',
          'Copy drafted and sent to you for approval',
          'Sends begin within your agreed timeline',
        ]).map((step, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold text-primary">{i + 1}</span>
            </div>
            <p className="text-sm text-gray-600">{step}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => router.push('/website-visitors')}>
          <Eye className="h-4 w-4 mr-2" />
          Back to Visitors
        </Button>
        <Button onClick={onReset}>
          Submit Another Request
        </Button>
      </div>
    </div>
  )
}

// ─── Flow selector ─────────────────────────────────────────

function FlowSelector({ onSelect, stats }: { onSelect: (f: FlowType) => void; stats: any }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Premium Activation</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Activate Your Audience</h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Turn your leads into revenue. Build a lookalike audience or launch managed outbound.
        </p>
        {stats && (stats.pixel_visitors > 0 || stats.enriched > 0) && (
          <div className="flex items-center justify-center gap-4 mt-5">
            {stats.pixel_visitors > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1">
                <Eye className="h-3.5 w-3.5" />
                {stats.pixel_visitors} website visitors
              </span>
            )}
            {stats.enriched > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1">
                <Zap className="h-3.5 w-3.5" />
                {stats.enriched} enriched leads
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Audience */}
        <button
          onClick={() => onSelect('audience')}
          className="group text-left bg-white rounded-2xl border-2 border-gray-200 p-7 hover:border-primary hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-primary/10 transition-colors">
              <Target className="h-7 w-7 text-blue-600 group-hover:text-primary transition-colors" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lookalike Audience</h2>
          <p className="text-gray-500 text-sm mb-5">
            Define your ideal customer profile and we&apos;ll build a targeted list of thousands of matching prospects from our 280M+ database.
          </p>
          <div className="space-y-2">
            {[
              'Define ICP by industry, title, location',
              '25-lead sample in 48 hours',
              'Full list of 500–5,000+ verified contacts',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100">
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
              From $0.10 / contact
            </Badge>
          </div>
        </button>

        {/* Campaign */}
        <button
          onClick={() => onSelect('campaign')}
          className="group text-left bg-white rounded-2xl border-2 border-gray-200 p-7 hover:border-primary hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-primary/10 transition-colors">
              <Mail className="h-7 w-7 text-blue-600 group-hover:text-primary transition-colors" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Outbound Campaign</h2>
          <p className="text-gray-500 text-sm mb-5">
            We run personalised cold email campaigns to your website visitors or custom audience — you just close the deals that come in.
          </p>
          <div className="space-y-2">
            {[
              'We write the copy and manage sends',
              'Targets your pixel visitors or custom list',
              'Full reply handling and warm handoffs',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100">
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
              Starting at $500 / mo
            </Badge>
          </div>
        </button>
      </div>
    </div>
  )
}

// ─── Audience Form ─────────────────────────────────────────

const AUDIENCE_STEPS = ['Audience Type', 'ICP', 'Volume & Budget', 'Contact']

function AudienceWizard({
  onBack,
  onSuccess,
  defaultEmail,
  defaultName,
}: {
  onBack: () => void
  onSuccess: () => void
  defaultEmail: string
  defaultName: string
}) {
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<AudienceForm>({
    request_type: 'lookalike',
    industries: [],
    job_titles: [],
    geographies: [],
    company_size: '',
    seniority_levels: [],
    icp_description: '',
    use_case: '',
    data_sources: [],
    desired_volume: '',
    budget_range: '',
    timeline: '',
    contact_name: defaultName,
    contact_email: defaultEmail,
    website_url: '',
    additional_notes: '',
  })

  function toggle<T extends keyof AudienceForm>(field: T, value: string) {
    const arr = form[field] as string[]
    setForm((f) => ({
      ...f,
      [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    }))
  }

  function set<T extends keyof AudienceForm>(field: T, value: AudienceForm[T]) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const canAdvance = [
    form.industries.length > 0 || form.request_type === 'lookalike',
    form.industries.length > 0,
    true,
    form.contact_name.trim() && form.contact_email.trim(),
  ][step]

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/activate/audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
          <ArrowLeft className="h-4 w-4" /> Back to options
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-50">
            <Target className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Lookalike Audience Builder</h2>
        </div>
        <StepIndicator current={step} total={4} labels={AUDIENCE_STEPS} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

        {/* Step 0: Audience type */}
        {step === 0 && (
          <div className="space-y-6">
            <SectionHeader icon={Target} title="What kind of audience do you want?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { value: 'lookalike', label: 'Lookalike Audience', icon: 'target', desc: 'Mirror my best visitors / customers — find people just like them' },
                { value: 'audience', label: 'Custom List Build', icon: 'clipboard', desc: 'Build a fresh targeted list based on my ICP from scratch' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('request_type', t.value as 'audience' | 'lookalike')}
                  className={cn(
                    'text-left p-4 rounded-xl border-2 transition-all',
                    form.request_type === t.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="text-primary mb-2">{ICON_MAP[t.icon] || t.icon}</div>
                  <div className="font-semibold text-gray-900 text-sm mb-1">{t.label}</div>
                  <div className="text-xs text-gray-500">{t.desc}</div>
                </button>
              ))}
            </div>

            {form.request_type === 'lookalike' && (
              <div>
                <SectionHeader icon={Briefcase} title="What data do we use to build it?" sub="Check all that apply" />
                <div className="flex flex-wrap gap-2">
                  {['Website Visitors (Pixel)', 'Enriched Leads', 'My Existing Customer List', 'Top Performers in CRM'].map((s) => (
                    <Chip key={s} label={s} selected={form.data_sources.includes(s)} onClick={() => toggle('data_sources', s)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: ICP */}
        {step === 1 && (
          <div className="space-y-6">
            <SectionHeader icon={Building2} title="Define your ideal customer" sub="We use this to find the best matching prospects" />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Industries <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((i) => (
                  <Chip key={i} label={i} selected={form.industries.includes(i)} onClick={() => toggle('industries', i)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Job Titles / Decision Makers</label>
              <div className="flex flex-wrap gap-2">
                {JOB_TITLES.map((t) => (
                  <Chip key={t} label={t} selected={form.job_titles.includes(t)} onClick={() => toggle('job_titles', t)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Geography</label>
              <div className="flex flex-wrap gap-2">
                {GEOGRAPHIES.map((g) => (
                  <Chip key={g} label={g} selected={form.geographies.includes(g)} onClick={() => toggle('geographies', g)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Company Size</label>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map((s) => (
                  <Chip key={s.value} label={s.label} selected={form.company_size === s.value} onClick={() => set('company_size', s.value)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Describe your ideal customer in your own words</label>
              <textarea
                rows={3}
                placeholder="e.g. B2B SaaS companies using HubSpot, 50–200 employees, VP-level and above, US-based..."
                value={form.icp_description}
                onChange={(e) => set('icp_description', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 2: Volume & Budget */}
        {step === 2 && (
          <div className="space-y-6">
            <SectionHeader icon={DollarSign} title="Volume, budget & use case" />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">How many contacts do you need?</label>
              <div className="flex flex-wrap gap-2">
                {['100–500', '500–1,000', '1,000–5,000', '5,000–25,000', '25,000+'].map((v) => (
                  <Chip key={v} label={v} selected={form.desired_volume === v} onClick={() => set('desired_volume', v)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">What will you use this audience for?</label>
              <div className="flex flex-wrap gap-2">
                {['Cold Email Outreach', 'LinkedIn Ads', 'Google / Facebook Ads', 'Direct Mail', 'Sales Prospecting', 'Account-Based Marketing'].map((u) => (
                  <Chip key={u} label={u} selected={form.use_case === u} onClick={() => set('use_case', u)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Monthly budget</label>
              <div className="flex flex-wrap gap-2">
                {BUDGET_RANGES.map((b) => (
                  <Chip key={b} label={b} selected={form.budget_range === b} onClick={() => set('budget_range', b)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Timeline</label>
              <div className="flex flex-wrap gap-2">
                {['ASAP', 'Within 1 week', 'Within 1 month', 'Flexible'].map((t) => (
                  <Chip key={t} label={t} selected={form.timeline === t} onClick={() => set('timeline', t)} />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Anything else we should know?</label>
              <textarea
                rows={2}
                placeholder="Specific requirements, do-not-contact lists, exclusions, etc."
                value={form.additional_notes}
                onChange={(e) => set('additional_notes', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Step 3: Contact */}
        {step === 3 && (
          <div className="space-y-5">
            <SectionHeader icon={Users} title="Where should we send the sample?" sub="Our team will reach out within 24 hours" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Name</label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={(e) => set('contact_name', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => set('contact_email', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="jane@company.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Website URL</label>
              <input
                type="url"
                value={form.website_url}
                onChange={(e) => set('website_url', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="https://yourcompany.com"
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mt-2">
              <p className="text-sm font-semibold text-gray-700 mb-3">Request summary</p>
              <div className="space-y-1.5 text-sm text-gray-600">
                {form.industries.length > 0 && <div><span className="text-gray-400">Industries:</span> {form.industries.slice(0, 3).join(', ')}{form.industries.length > 3 ? ` +${form.industries.length - 3}` : ''}</div>}
                {form.job_titles.length > 0 && <div><span className="text-gray-400">Titles:</span> {form.job_titles.slice(0, 2).join(', ')}{form.job_titles.length > 2 ? ` +${form.job_titles.length - 2}` : ''}</div>}
                {form.geographies.length > 0 && <div><span className="text-gray-400">Geography:</span> {form.geographies[0]}{form.geographies.length > 1 ? ` +${form.geographies.length - 1}` : ''}</div>}
                {form.desired_volume && <div><span className="text-gray-400">Volume:</span> {form.desired_volume} contacts</div>}
                {form.budget_range && <div><span className="text-gray-400">Budget:</span> {form.budget_range}</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={step === 0 ? onBack : () => setStep((s) => s - 1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            Continue <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || !canAdvance}
            className="bg-gradient-to-r from-blue-600 to-primary hover:opacity-90 text-white gap-2"
          >
            {submitting ? 'Submitting...' : (
              <><Sparkles className="h-4 w-4" /> Submit Request</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Campaign Form ─────────────────────────────────────────

const CAMPAIGN_STEPS = ['Campaign Goal', 'Targeting', 'Message & Copy', 'Contact']

function CampaignWizard({
  onBack,
  onSuccess,
  defaultEmail,
  defaultName,
}: {
  onBack: () => void
  onSuccess: () => void
  defaultEmail: string
  defaultName: string
}) {
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CampaignForm>({
    campaign_goal: '',
    target_audience: '',
    value_prop: '',
    message_tone: 'professional',
    industries: [],
    geographies: [],
    job_titles: [],
    company_size: '',
    monthly_volume: '',
    has_existing_copy: false,
    existing_copy: '',
    budget_range: '',
    contact_name: defaultName,
    contact_email: defaultEmail,
    website_url: '',
    additional_notes: '',
  })

  function toggle<T extends keyof CampaignForm>(field: T, value: string) {
    const arr = form[field] as string[]
    setForm((f) => ({ ...f, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] }))
  }

  function set<T extends keyof CampaignForm>(field: T, value: CampaignForm[T]) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const canAdvance = [
    !!form.campaign_goal && !!form.target_audience,
    form.industries.length > 0,
    form.value_prop.trim().length >= 10,
    form.contact_name.trim() && form.contact_email.trim(),
  ][step]

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/activate/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
          <ArrowLeft className="h-4 w-4" /> Back to options
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-50">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Outbound Campaign Launcher</h2>
        </div>
        <StepIndicator current={step} total={4} labels={CAMPAIGN_STEPS} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

        {/* Step 0: Goal + Audience source */}
        {step === 0 && (
          <div className="space-y-6">
            <SectionHeader icon={Target} title="What's the goal of this campaign?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CAMPAIGN_GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => set('campaign_goal', g.value)}
                  className={cn(
                    'text-left p-4 rounded-xl border-2 transition-all',
                    form.campaign_goal === g.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <span className="text-primary">{ICON_MAP[g.icon] || g.icon}</span>
                  <div className="font-semibold text-sm text-gray-900 mt-1">{g.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{g.desc}</div>
                </button>
              ))}
            </div>

            <div>
              <SectionHeader icon={Users} title="Who should we send to?" sub="Choose your target audience" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {AUDIENCE_SOURCES.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => set('target_audience', a.value)}
                    className={cn(
                      'text-left p-4 rounded-xl border-2 transition-all',
                      form.target_audience === a.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <span className="text-primary">{ICON_MAP[a.icon] || a.icon}</span>
                    <div className="font-semibold text-sm text-gray-900 mt-1">{a.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Targeting */}
        {step === 1 && (
          <div className="space-y-6">
            <SectionHeader icon={Building2} title="Who are we targeting?" sub="Define your ideal prospect" />
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Industries <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((i) => (
                  <Chip key={i} label={i} selected={form.industries.includes(i)} onClick={() => toggle('industries', i)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Job Titles</label>
              <div className="flex flex-wrap gap-2">
                {JOB_TITLES.map((t) => (
                  <Chip key={t} label={t} selected={form.job_titles.includes(t)} onClick={() => toggle('job_titles', t)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Geography</label>
              <div className="flex flex-wrap gap-2">
                {GEOGRAPHIES.map((g) => (
                  <Chip key={g} label={g} selected={form.geographies.includes(g)} onClick={() => toggle('geographies', g)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Company Size</label>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map((s) => (
                  <Chip key={s.value} label={s.label} selected={form.company_size === s.value} onClick={() => set('company_size', s.value)} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Emails per month</label>
              <div className="flex flex-wrap gap-2">
                {['100–500', '500–2,000', '2,000–5,000', '5,000+'].map((v) => (
                  <Chip key={v} label={v} selected={form.monthly_volume === v} onClick={() => set('monthly_volume', v)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Message & Copy */}
        {step === 2 && (
          <div className="space-y-6">
            <SectionHeader icon={MessageSquare} title="What&apos;s your offer?" sub="What should prospects want to do after reading your email?" />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Your value proposition <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="e.g. We help B2B SaaS companies reduce churn by 30% in 90 days using our onboarding software. Our clients include Acme Corp and TechCo. Book a 20-min demo to see how..."
                value={form.value_prop}
                onChange={(e) => set('value_prop', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <p className="text-xs text-gray-400 mt-1">{form.value_prop.length} / 1,000 chars. Be specific — the best copy leads with a concrete outcome.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Message tone</label>
              <div className="grid grid-cols-2 gap-3">
                {MESSAGE_TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('message_tone', t.value)}
                    className={cn(
                      'text-left p-3 rounded-xl border-2 transition-all',
                      form.message_tone === t.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="font-semibold text-sm text-gray-900">{t.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Do you have existing copy to share?</label>
              <div className="flex gap-3">
                {[{ v: false, l: 'No — write it for me' }, { v: true, l: 'Yes — I have copy to share' }].map(({ v, l }) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => set('has_existing_copy', v)}
                    className={cn(
                      'flex-1 py-2.5 text-sm rounded-lg border-2 font-medium transition-all',
                      form.has_existing_copy === v ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {form.has_existing_copy && (
                <textarea
                  rows={4}
                  placeholder="Paste your email copy here..."
                  value={form.existing_copy}
                  onChange={(e) => set('existing_copy', e.target.value)}
                  className="w-full mt-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Monthly budget</label>
              <div className="flex flex-wrap gap-2">
                {BUDGET_RANGES.map((b) => (
                  <Chip key={b} label={b} selected={form.budget_range === b} onClick={() => set('budget_range', b)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact */}
        {step === 3 && (
          <div className="space-y-5">
            <SectionHeader icon={Users} title="Where should we reach you?" sub="Our campaign team will contact you within 24 hours" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Name</label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={(e) => set('contact_name', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => set('contact_email', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="jane@company.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Website URL</label>
              <input
                type="url"
                value={form.website_url}
                onChange={(e) => set('website_url', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="https://yourcompany.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Anything else?</label>
              <textarea
                rows={2}
                value={form.additional_notes}
                onChange={(e) => set('additional_notes', e.target.value)}
                placeholder="Additional context, specific requests, timing, etc."
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Campaign summary</p>
              <div className="space-y-1.5 text-sm text-gray-600">
                {form.campaign_goal && <div><span className="text-gray-400">Goal:</span> {CAMPAIGN_GOALS.find(g => g.value === form.campaign_goal)?.label}</div>}
                {form.target_audience && <div><span className="text-gray-400">Audience:</span> {AUDIENCE_SOURCES.find(a => a.value === form.target_audience)?.label}</div>}
                {form.industries.length > 0 && <div><span className="text-gray-400">Industries:</span> {form.industries.slice(0,3).join(', ')}{form.industries.length > 3 ? ` +${form.industries.length-3}` : ''}</div>}
                {form.monthly_volume && <div><span className="text-gray-400">Volume:</span> {form.monthly_volume} emails/mo</div>}
                {form.budget_range && <div><span className="text-gray-400">Budget:</span> {form.budget_range}</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={step === 0 ? onBack : () => setStep((s) => s - 1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            Continue <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || !canAdvance}
            className="bg-gradient-to-r from-blue-600 to-primary hover:opacity-90 text-white gap-2"
          >
            {submitting ? 'Submitting...' : (
              <><Sparkles className="h-4 w-4" /> Launch Campaign Request</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────

export default function ActivatePage() {
  const searchParams = useSearchParams()
  const initialFlow = (searchParams.get('flow') as FlowType) ?? null
  const [flow, setFlow] = useState<FlowType>(initialFlow)
  const [done, setDone] = useState(false)

  const { data: userData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await fetch('/api/auth/user')
      if (!res.ok) return null
      return res.json()
    },
    staleTime: 60_000,
  })

  const { data: visitorStats } = useQuery({
    queryKey: ['visitors-stats'],
    queryFn: async () => {
      const res = await fetch('/api/visitors?limit=1')
      if (!res.ok) return null
      const data = await res.json()
      return { pixel_visitors: data.stats?.total ?? 0, enriched: data.stats?.enriched ?? 0 }
    },
    staleTime: 60_000,
  })

  const defaultEmail = userData?.user?.email ?? ''
  const defaultName = userData?.user?.user_metadata?.full_name?.split(' ')[0] ?? ''

  if (done) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SuccessScreen flow={flow} onReset={() => { setDone(false); setFlow(null) }} />
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="py-6">
        <FlowSelector onSelect={setFlow} stats={visitorStats} />
      </div>
    )
  }

  if (flow === 'audience') {
    return (
      <div className="py-6">
        <AudienceWizard
          onBack={() => setFlow(null)}
          onSuccess={() => setDone(true)}
          defaultEmail={defaultEmail}
          defaultName={defaultName}
        />
      </div>
    )
  }

  return (
    <div className="py-6">
      <CampaignWizard
        onBack={() => setFlow(null)}
        onSuccess={() => setDone(true)}
        defaultEmail={defaultEmail}
        defaultName={defaultName}
      />
    </div>
  )
}
