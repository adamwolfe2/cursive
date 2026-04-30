'use client'

import * as React from 'react'
import { useFormContext, useController } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { TagInput } from './TagInput'
import type { OnboardingFormData } from '@/types/onboarding'
import { Sparkles } from 'lucide-react'

const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+',
]

const GEOGRAPHY_OPTIONS = [
  'United States',
  'Canada',
  'United Kingdom',
  'Europe (EU)',
  'Australia / NZ',
  'Latin America',
  'Asia Pacific',
  'Global',
]

interface ICPSuggestions {
  titles: string[]
  pain_points: string[]
  keywords: string[]
}

export function ICPIntakeStep() {
  const { register, watch, control, formState: { errors } } = useFormContext<OnboardingFormData>()
  const [suggestions, setSuggestions] = React.useState<ICPSuggestions | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false)
  const [showSuggestions, setShowSuggestions] = React.useState(true)

  const industry = watch('industry')

  // Fetch suggestions when step loads and industry is available
  React.useEffect(() => {
    if (!industry || industry.length < 2) return
    setLoadingSuggestions(true)
    fetch('/api/onboarding/icp-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry }),
    })
      .then((res) => res.json())
      .then((json) => setSuggestions(json.data))
      .catch(() => {})
      .finally(() => setLoadingSuggestions(false))
  }, [industry])

  const icpDescription = watch('icp_description') ?? ''
  const geography = watch('target_geography') ?? []

  const { field: industriesField } = useController({ name: 'target_industries', control, rules: { validate: (v: string[]) => v.length > 0 || 'At least one target industry is required' } })
  const { field: subIndustriesField } = useController({ name: 'sub_industries', control })
  const { field: titlesField } = useController({ name: 'target_titles', control, rules: { validate: (v: string[]) => v.length > 0 || 'At least one target title is required' } })
  const { field: sizesField } = useController({ name: 'target_company_sizes', control })
  const { field: geoField } = useController({ name: 'target_geography', control })
  const { field: intentField } = useController({ name: 'intent_keywords', control })
  const { field: competitorField } = useController({ name: 'competitor_names', control })

  const toggleSize = (size: string) => {
    const current: string[] = sizesField.value ?? []
    const next = current.includes(size) ? current.filter(s => s !== size) : [...current, size]
    sizesField.onChange(next)
  }

  const toggleGeo = (geo: string) => {
    const current: string[] = geoField.value ?? []
    const next = current.includes(geo) ? current.filter(g => g !== geo) : [...current, geo]
    geoField.onChange(next)
  }

  const showSpecificStates = geography.includes('United States') || geography.includes('Canada')

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Ideal Customer Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is the most important section. The more detail you provide, the better we can target your ideal buyers.
        </p>
        <p className="mt-2 text-sm font-medium text-blue-600">Let&apos;s get specific about who you want to reach.</p>
      </div>

      {/* AI Suggestions Panel */}
      {suggestions && showSuggestions && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
              <Sparkles className="h-4 w-4" />
              AI Suggestions for {industry}
            </div>
            <button type="button" onClick={() => setShowSuggestions(false)} className="text-xs text-gray-400 hover:text-gray-600">
              Dismiss
            </button>
          </div>

          <div className="space-y-3">
            {suggestions.titles.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1.5">Suggested titles — click to add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.titles.map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => {
                        const current = titlesField.value ?? []
                        if (!current.includes(title)) titlesField.onChange([...current, title])
                      }}
                      disabled={(titlesField.value ?? []).includes(title)}
                      className={`rounded-full px-3 py-1 text-xs transition-colors ${
                        (titlesField.value ?? []).includes(title)
                          ? 'bg-blue-200 text-blue-800 cursor-default'
                          : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {(titlesField.value ?? []).includes(title) ? '+ ' : ''}{title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {suggestions.pain_points.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1.5">Common pain points — click to append:</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.pain_points.map((pain) => (
                    <button
                      key={pain}
                      type="button"
                      onClick={() => {
                        const current = watch('pain_points') ?? ''
                        const separator = current.trim() ? '. ' : ''
                        register('pain_points').onChange({ target: { value: current + separator + pain, name: 'pain_points' } })
                      }}
                      className="rounded-full px-3 py-1 text-xs bg-white text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      {pain}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {suggestions.keywords.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1.5">Suggested keywords — click to add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.keywords.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        const current = intentField.value ?? []
                        if (!current.includes(kw)) intentField.onChange([...current, kw])
                      }}
                      disabled={(intentField.value ?? []).includes(kw)}
                      className={`rounded-full px-3 py-1 text-xs transition-colors ${
                        (intentField.value ?? []).includes(kw)
                          ? 'bg-blue-200 text-blue-800 cursor-default'
                          : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loadingSuggestions && (
        <div className="text-center py-2">
          <p className="text-xs text-blue-500 animate-pulse">Loading AI suggestions...</p>
        </div>
      )}

      {/* ICP Description */}
      <div className="space-y-2">
        <Label htmlFor="icp_description">
          Who&apos;s your dream customer? Paint us a picture in 2-3 sentences. <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="icp_description"
          placeholder="Describe the company and buyer you are trying to reach. Include any context about your value proposition and what makes a great-fit customer..."
          rows={5}
          error={errors.icp_description?.message}
          {...register('icp_description', {
            required: 'ICP description is required',
            maxLength: { value: 2000, message: 'Maximum 2000 characters' },
          })}
        />
        <div className="flex items-center justify-between">
          {errors.icp_description && <p className="text-sm text-destructive">{errors.icp_description.message}</p>}
          <p className={cn('ml-auto text-xs', icpDescription.length > 1800 ? 'text-warning' : 'text-muted-foreground')}>
            {icpDescription.length}/2000
          </p>
        </div>
      </div>

      {/* Industries */}
      <div className="space-y-2">
        <Label>Top Target Industries <span className="text-destructive">*</span></Label>
        <TagInput
          value={industriesField.value ?? []}
          onChange={industriesField.onChange}
          placeholder="e.g. SaaS, Healthcare, Financial Services..."
        />
        {errors.target_industries && <p className="text-sm text-destructive">{errors.target_industries.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Sub-Industries or Niches</Label>
        <TagInput
          value={subIndustriesField.value ?? []}
          onChange={subIndustriesField.onChange}
          placeholder="e.g. Dental practices, FinTech startups..."
        />
        <p className="text-sm text-muted-foreground">Optional. Helps us narrow targeting further.</p>
      </div>

      {/* Company Size */}
      <div className="space-y-3">
        <Label>Target Company Size (Employees)</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COMPANY_SIZES.map((size) => {
            const isChecked = (sizesField.value ?? []).includes(size)
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={cn(
                  'rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                  isChecked
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-border bg-card text-muted-foreground hover:border-blue-200'
                )}
              >
                {size}
              </button>
            )
          })}
        </div>
      </div>

      {/* Buyer Titles */}
      <div className="space-y-2">
        <Label>Target Buyer Titles <span className="text-destructive">*</span></Label>
        <TagInput
          value={titlesField.value ?? []}
          onChange={titlesField.onChange}
          placeholder="e.g. VP of Marketing, CTO, Head of Revenue..."
        />
        {errors.target_titles && <p className="text-sm text-destructive">{errors.target_titles.message}</p>}
      </div>

      {/* Geography */}
      <div className="space-y-3">
        <Label>Target Geography</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GEOGRAPHY_OPTIONS.map((geo) => {
            const isChecked = (geoField.value ?? []).includes(geo)
            return (
              <button
                key={geo}
                type="button"
                onClick={() => toggleGeo(geo)}
                className={cn(
                  'rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                  isChecked
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-border bg-card text-muted-foreground hover:border-blue-200'
                )}
              >
                {geo}
              </button>
            )
          })}
        </div>
      </div>

      {showSpecificStates && (
        <div className="space-y-2">
          <Label htmlFor="specific_regions">Specific States or Regions</Label>
          <Input
            id="specific_regions"
            placeholder="e.g. California, Texas, Northeast US, Ontario..."
            {...register('specific_regions')}
          />
          <p className="text-sm text-muted-foreground">Leave blank to target all regions in selected countries.</p>
        </div>
      )}

      <p className="text-sm font-medium text-blue-600">Great, just a few more details...</p>

      {/* Traits & Exclusions */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="must_have_traits">Must-Have Traits</Label>
          <Textarea
            id="must_have_traits"
            placeholder="e.g. Must have a marketing team, must use HubSpot, annual revenue > $5M..."
            rows={3}
            {...register('must_have_traits')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exclusion_criteria">Exclusion Criteria</Label>
          <Textarea
            id="exclusion_criteria"
            placeholder="e.g. No agencies, no companies under 10 employees, exclude existing customers..."
            rows={3}
            {...register('exclusion_criteria')}
          />
        </div>
      </div>

      {/* Pain Points */}
      <div className="space-y-2">
        <Label htmlFor="pain_points">What keeps your ideal customer up at night? <span className="text-destructive">*</span></Label>
        <Textarea
          id="pain_points"
          placeholder="What problems do your best customers have that led them to buy? What triggers a purchase?"
          rows={4}
          error={errors.pain_points?.message}
          {...register('pain_points', { required: 'Pain points are required to build effective targeting' })}
        />
        {errors.pain_points && <p className="text-sm text-destructive">{errors.pain_points.message}</p>}
      </div>

      {/* Intent & Competitors */}
      <div className="space-y-2">
        <Label>Intent Keywords</Label>
        <TagInput
          value={intentField.value ?? []}
          onChange={intentField.onChange}
          placeholder="e.g. lead generation software, ABM platform, sales automation..."
        />
        <p className="text-sm text-muted-foreground">Keywords your ideal buyer would search for when experiencing the pain points above.</p>
      </div>

      <div className="space-y-2">
        <Label>Competitor Names</Label>
        <TagInput
          value={competitorField.value ?? []}
          onChange={competitorField.onChange}
          placeholder="e.g. ZoomInfo, Apollo, Lusha..."
        />
        <p className="text-sm text-muted-foreground">We can target prospects researching your competitors.</p>
      </div>

      <p className="text-sm font-medium text-blue-600">Almost there!</p>

      {/* Reference Data */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="best_customers">Your Best Customers</Label>
          <Textarea
            id="best_customers"
            placeholder="List 3-5 of your best customers and why they are a great fit..."
            rows={3}
            {...register('best_customers')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sample_accounts">Sample Target Accounts</Label>
          <Textarea
            id="sample_accounts"
            placeholder="List company names you would love to close but have not yet..."
            rows={3}
            {...register('sample_accounts')}
          />
        </div>
      </div>
    </div>
  )
}
