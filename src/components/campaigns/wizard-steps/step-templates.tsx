'use client'

import { useEffect, useState } from 'react'
import { FormField, FormLabel, FormSelect } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { CampaignFormData } from '../campaign-wizard'

interface Template {
  id: string
  name: string
  subject: string
  tone: string
  structure: string
  cta_type: string
  target_seniority: string[]
  company_types: string[]
  open_rate?: number
  reply_rate?: number
}

interface StepTemplatesProps {
  formData: CampaignFormData
  updateFormData: (updates: Partial<CampaignFormData>) => void
}

const TONES = ['informal', 'formal', 'energetic', 'humble']
const STRUCTURES = ['problem_solution', 'value_prop_first', 'social_proof', 'question_based']
const CTA_TYPES = ['soft_ask', 'direct_meeting', 'resource_offer', 'question']

export function StepTemplates({ formData, updateFormData }: StepTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    tone: '',
    structure: '',
    cta_type: '',
  })

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const params = new URLSearchParams()
        if (filters.tone) params.set('tone', filters.tone)
        if (filters.structure) params.set('structure', filters.structure)
        if (filters.cta_type) params.set('cta_type', filters.cta_type)

        const response = await fetch(`/api/templates?${params.toString()}`)
        if (response.ok) {
          const result = await response.json()
          setTemplates(result.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [filters])

  const toggleTemplate = (templateId: string) => {
    const current = formData.selected_template_ids
    if (current.includes(templateId)) {
      updateFormData({
        selected_template_ids: current.filter((id) => id !== templateId),
      })
    } else {
      updateFormData({
        selected_template_ids: [...current, templateId],
      })
    }
  }

  const selectAll = () => {
    updateFormData({
      selected_template_ids: templates.map((t) => t.id),
    })
  }

  const clearAll = () => {
    updateFormData({
      selected_template_ids: [],
    })
  }

  return (
    <div className="space-y-6">
      {/* Matching Mode */}
      <FormField>
        <FormLabel>Template Matching Mode</FormLabel>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <button
            type="button"
            onClick={() => updateFormData({ matching_mode: 'intelligent' })}
            className={`p-4 rounded-lg border text-left transition-colors ${
              formData.matching_mode === 'intelligent'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="font-medium text-foreground">Intelligent Matching</span>
            </div>
            <p className="text-xs text-muted-foreground">
              AI selects the best template for each lead based on their profile, industry, and seniority
            </p>
          </button>

          <button
            type="button"
            onClick={() => updateFormData({ matching_mode: 'random' })}
            className={`p-4 rounded-lg border text-left transition-colors ${
              formData.matching_mode === 'random'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-medium text-foreground">Random Selection</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Randomly distribute selected templates across leads for A/B testing
            </p>
          </button>
        </div>
      </FormField>

      {/* Template Filters */}
      <div className="grid grid-cols-3 gap-4">
        <FormField>
          <FormLabel htmlFor="filter-tone">Filter by Tone</FormLabel>
          <FormSelect
            id="filter-tone"
            value={filters.tone}
            onChange={(e) => setFilters({ ...filters, tone: e.target.value })}
          >
            <option value="">All tones</option>
            {TONES.map((tone) => (
              <option key={tone} value={tone}>
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </option>
            ))}
          </FormSelect>
        </FormField>

        <FormField>
          <FormLabel htmlFor="filter-structure">Filter by Structure</FormLabel>
          <FormSelect
            id="filter-structure"
            value={filters.structure}
            onChange={(e) => setFilters({ ...filters, structure: e.target.value })}
          >
            <option value="">All structures</option>
            {STRUCTURES.map((structure) => (
              <option key={structure} value={structure}>
                {structure.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </FormSelect>
        </FormField>

        <FormField>
          <FormLabel htmlFor="filter-cta">Filter by CTA</FormLabel>
          <FormSelect
            id="filter-cta"
            value={filters.cta_type}
            onChange={(e) => setFilters({ ...filters, cta_type: e.target.value })}
          >
            <option value="">All CTAs</option>
            {CTA_TYPES.map((cta) => (
              <option key={cta} value={cta}>
                {cta.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </FormSelect>
        </FormField>
      </div>

      {/* Template Selection Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {formData.selected_template_ids.length} of {templates.length} templates selected
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Template List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No templates found. Adjust your filters or seed templates first.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`p-4 cursor-pointer transition-colors ${
                formData.selected_template_ids.includes(template.id)
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => toggleTemplate(template.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={formData.selected_template_ids.includes(template.id)}
                  onChange={() => toggleTemplate(template.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground truncate">{template.name}</p>
                    {(template.open_rate || template.reply_rate) && (
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {template.open_rate && <span>{template.open_rate}% open</span>}
                        {template.reply_rate && <span>{template.reply_rate}% reply</span>}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-2">{template.subject}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {template.tone}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.structure.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.cta_type.replace(/_/g, ' ')}
                    </Badge>
                    {template.target_seniority?.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info about intelligent matching */}
      {formData.matching_mode === 'intelligent' && (
        <div className="rounded-lg bg-muted p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-muted-foreground">
                With intelligent matching, templates are selected at send time based on each lead's profile.
                Select templates you want available for the AI to choose from, or leave empty to use all.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
