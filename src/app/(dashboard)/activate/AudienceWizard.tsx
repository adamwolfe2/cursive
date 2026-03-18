'use client'

import { useState } from 'react'
import {
  ArrowRight, ArrowLeft, Sparkles,
  Target, Building2, Briefcase, Users,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/hooks/use-toast'
import { cn } from '@/lib/design-system'
import type { AudienceForm } from './types'
import {
  INDUSTRIES, JOB_TITLES, GEOGRAPHIES, COMPANY_SIZES,
  BUDGET_RANGES, AUDIENCE_STEPS,
} from './constants'
import { ICON_MAP } from './IconMap'
import { StepIndicator } from './StepIndicator'
import { Chip } from './Chip'
import { SectionHeader } from './SectionHeader'

export function AudienceWizard({
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
        const data = await res.json().catch(() => ({}))
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
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Lookalike Audience Builder</h2>
        </div>
        <StepIndicator current={step} total={4} labels={AUDIENCE_STEPS} />
      </div>

      <form className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm" onSubmit={(e) => { e.preventDefault(); if (step < 3) { if (canAdvance) setStep((s) => s + 1) } else { if (canAdvance && !submitting) handleSubmit() } }}>

        {/* Step 0: Audience type */}
        {step === 0 && (
          <div className="space-y-6">
            <SectionHeader icon={Target} title="What kind of audience do you want?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { value: 'lookalike', label: 'Lookalike Audience', icon: 'target', desc: 'Mirror my best visitors / customers \u2014 find people just like them' },
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
                placeholder="e.g. B2B SaaS companies using HubSpot, 50\u2013200 employees, VP-level and above, US-based..."
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
                {['100\u2013500', '500\u20131,000', '1,000\u20135,000', '5,000\u201325,000', '25,000+'].map((v) => (
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
                <><Sparkles className="h-4 w-4" /> Submit Request</>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
