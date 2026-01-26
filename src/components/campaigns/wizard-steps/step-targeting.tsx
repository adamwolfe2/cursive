'use client'

import { FormField, FormLabel } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CampaignFormData } from '../campaign-wizard'

interface StepTargetingProps {
  formData: CampaignFormData
  updateFormData: (updates: Partial<CampaignFormData>) => void
}

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Manufacturing',
  'Retail',
  'Professional Services',
  'Real Estate',
  'Education',
  'Media & Entertainment',
  'Energy',
]

const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1001-5000 employees',
  '5000+ employees',
]

const SENIORITIES = [
  'C-Level',
  'VP',
  'Director',
  'Manager',
  'Individual Contributor',
]

const REGIONS = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Middle East & Africa',
]

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  hint,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  hint?: string
}) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <FormField>
      <FormLabel>{label}</FormLabel>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggleOption(option)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              selected.includes(option)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary/50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Selected:</span>
          <div className="flex flex-wrap gap-1">
            {selected.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChange([])}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </FormField>
  )
}

export function StepTargeting({ formData, updateFormData }: StepTargetingProps) {
  return (
    <div className="space-y-8">
      <MultiSelect
        label="Target Industries"
        options={INDUSTRIES}
        selected={formData.target_industries}
        onChange={(selected) => updateFormData({ target_industries: selected })}
        hint="Select industries you want to target. Leave empty to target all."
      />

      <MultiSelect
        label="Company Size"
        options={COMPANY_SIZES}
        selected={formData.target_company_sizes}
        onChange={(selected) => updateFormData({ target_company_sizes: selected })}
        hint="Select company sizes to focus on."
      />

      <MultiSelect
        label="Seniority Level"
        options={SENIORITIES}
        selected={formData.target_seniorities}
        onChange={(selected) => updateFormData({ target_seniorities: selected })}
        hint="Select the seniority levels of contacts to target."
      />

      <MultiSelect
        label="Regions"
        options={REGIONS}
        selected={formData.target_regions}
        onChange={(selected) => updateFormData({ target_regions: selected })}
        hint="Select geographic regions to target."
      />

      {/* Summary */}
      <div className="rounded-lg bg-muted p-4">
        <h4 className="text-sm font-medium text-foreground mb-2">Targeting Summary</h4>
        <div className="text-sm text-muted-foreground">
          {formData.target_industries.length === 0 &&
          formData.target_company_sizes.length === 0 &&
          formData.target_seniorities.length === 0 &&
          formData.target_regions.length === 0 ? (
            <p>No targeting filters applied. This campaign will match all leads.</p>
          ) : (
            <ul className="space-y-1">
              {formData.target_industries.length > 0 && (
                <li>{formData.target_industries.length} industries selected</li>
              )}
              {formData.target_company_sizes.length > 0 && (
                <li>{formData.target_company_sizes.length} company sizes selected</li>
              )}
              {formData.target_seniorities.length > 0 && (
                <li>{formData.target_seniorities.length} seniority levels selected</li>
              )}
              {formData.target_regions.length > 0 && (
                <li>{formData.target_regions.length} regions selected</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
