'use client'

import { useState } from 'react'
import {
  ArrowRight, ArrowLeft, Sparkles,
  Target, Building2, Users, Mail,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/hooks/use-toast'
import { cn } from '@/lib/design-system'
import type { CampaignForm } from './types'
import {
  INDUSTRIES, JOB_TITLES, GEOGRAPHIES, COMPANY_SIZES,
  BUDGET_RANGES, CAMPAIGN_GOALS, AUDIENCE_SOURCES,
  MESSAGE_TONES, CAMPAIGN_STEPS,
} from './constants'
import { ICON_MAP } from './IconMap'
import { StepIndicator } from './StepIndicator'
import { Chip } from './Chip'
import { SectionHeader } from './SectionHeader'

export function CampaignWizard({
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
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit')
      }
      onSuccess()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
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
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Outbound Campaign Launcher</h2>
        </div>
        <StepIndicator current={step} total={4} labels={CAMPAIGN_STEPS} />
      </div>

      <form className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm" onSubmit={(e) => { e.preventDefault(); if (step < 3) { if (canAdvance) setStep((s) => s + 1) } else { if (canAdvance && !submitting) handleSubmit() } }}>

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
                {['100\u2013500', '500\u20132,000', '2,000\u20135,000', '5,000+'].map((v) => (
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
                {[{ v: false, l: 'No \u2014 write it for me' }, { v: true, l: 'Yes \u2014 I have copy to share' }].map(({ v, l }) => (
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

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button type="button" variant="outline" onClick={step === 0 ? onBack : () => setStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          {step < 3 ? (
            <Button type="submit" disabled={!canAdvance}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={submitting || !canAdvance}
              className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-white gap-2"
            >
              {submitting ? 'Submitting...' : (
                <><Sparkles className="h-4 w-4" /> Launch Campaign Request</>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
