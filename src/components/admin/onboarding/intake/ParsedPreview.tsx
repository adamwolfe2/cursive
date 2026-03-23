'use client'

import { useState, useCallback, useMemo } from 'react'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import FieldBadge from './FieldBadge'
import type { ParsedIntakeData, FieldStatus } from '@/types/onboarding-templates'
import { PACKAGES, PACKAGE_SLUGS, type PackageSlug } from '@/types/onboarding'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedPreviewProps {
  data: ParsedIntakeData
  onChange: (updated: ParsedIntakeData) => void
  onSubmit: () => void
  isSubmitting: boolean
}

// ---------------------------------------------------------------------------
// Field status helpers
// ---------------------------------------------------------------------------

function getFieldStatus(
  fieldName: string,
  value: unknown,
  fieldsInferred: string[]
): FieldStatus {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    return 'needs_input'
  }
  if (fieldsInferred.includes(fieldName)) {
    return 'inferred'
  }
  return 'ai_filled'
}

// ---------------------------------------------------------------------------
// Reusable field components
// ---------------------------------------------------------------------------

function TextField({
  label,
  value,
  fieldName,
  onChange,
  status,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  fieldName: string
  onChange: (field: string, value: string) => void
  status: FieldStatus
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <FieldBadge status={status} />
      </div>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(fieldName, e.target.value)}
        placeholder={placeholder || label}
        className={`w-full rounded-md border px-3 py-1.5 text-sm ${
          status === 'needs_input'
            ? 'border-amber-300 bg-amber-50/50'
            : 'border-gray-300 bg-white'
        } focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20`}
      />
    </div>
  )
}

function TextareaField({
  label,
  value,
  fieldName,
  onChange,
  status,
  rows = 3,
}: {
  label: string
  value: string
  fieldName: string
  onChange: (field: string, value: string) => void
  status: FieldStatus
  rows?: number
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <FieldBadge status={status} />
      </div>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(fieldName, e.target.value)}
        rows={rows}
        className={`w-full rounded-md border px-3 py-1.5 text-sm ${
          status === 'needs_input'
            ? 'border-amber-300 bg-amber-50/50'
            : 'border-gray-300 bg-white'
        } focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-y`}
      />
    </div>
  )
}

function TagField({
  label,
  value,
  fieldName,
  onChange,
  status,
  placeholder,
}: {
  label: string
  value: string[]
  fieldName: string
  onChange: (field: string, value: string[]) => void
  status: FieldStatus
  placeholder?: string
}) {
  const [inputValue, setInputValue] = useState('')

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim()
      if (trimmed && !value.includes(trimmed)) {
        onChange(fieldName, [...value, trimmed])
      }
      setInputValue('')
    },
    [fieldName, onChange, value]
  )

  const removeTag = useCallback(
    (index: number) => {
      onChange(
        fieldName,
        value.filter((_, i) => i !== index)
      )
    },
    [fieldName, onChange, value]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault()
        addTag(inputValue)
      } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
        removeTag(value.length - 1)
      }
    },
    [addTag, inputValue, removeTag, value.length]
  )

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <FieldBadge status={status} />
      </div>
      <div
        className={`min-h-[38px] flex flex-wrap gap-1.5 rounded-md border px-2 py-1.5 ${
          status === 'needs_input'
            ? 'border-amber-300 bg-amber-50/50'
            : 'border-gray-300 bg-white'
        } focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20`}
      >
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-blue-400 hover:text-blue-600"
            >
              x
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue.trim() && addTag(inputValue)}
          placeholder={value.length === 0 ? placeholder || `Add ${label.toLowerCase()}...` : ''}
          className="flex-1 min-w-[120px] text-sm bg-transparent outline-none py-0.5"
        />
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  fieldName,
  onChange,
  status,
  prefix,
}: {
  label: string
  value: number | null
  fieldName: string
  onChange: (field: string, value: number | null) => void
  status: FieldStatus
  prefix?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <FieldBadge status={status} />
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) =>
            onChange(fieldName, e.target.value ? Number(e.target.value) : null)
          }
          className={`w-full rounded-md border px-3 py-1.5 text-sm ${prefix ? 'pl-7' : ''} ${
            status === 'needs_input'
              ? 'border-amber-300 bg-amber-50/50'
              : 'border-gray-300 bg-white'
          } focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20`}
        />
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  fieldName,
  onChange,
  status,
  options,
}: {
  label: string
  value: string
  fieldName: string
  onChange: (field: string, value: string) => void
  status: FieldStatus
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <FieldBadge status={status} />
      </div>
      <select
        value={value || ''}
        onChange={(e) => onChange(fieldName, e.target.value)}
        className={`w-full rounded-md border px-3 py-1.5 text-sm ${
          status === 'needs_input'
            ? 'border-amber-300 bg-amber-50/50'
            : 'border-gray-300 bg-white'
        } focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20`}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Collapsible Section
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
      >
        {title}
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">{children}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ParsedPreview({
  data,
  onChange,
  onSubmit,
  isSubmitting,
}: ParsedPreviewProps) {
  const fieldsInferred = data.fields_inferred || []

  // Count field statuses
  const { filledCount, needsInputCount } = useMemo(() => {
    const requiredFields = [
      'company_name',
      'company_website',
      'industry',
      'primary_contact_name',
      'primary_contact_email',
      'packages_selected',
    ]
    let filled = 0
    let needsInput = 0
    for (const field of requiredFields) {
      const val = (data as unknown as Record<string, unknown>)[field]
      if (val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
        needsInput++
      } else {
        filled++
      }
    }
    return { filledCount: filled, needsInputCount: needsInput }
  }, [data])

  const canSubmit =
    data.company_name?.trim() &&
    data.company_website?.trim() &&
    data.industry?.trim() &&
    data.primary_contact_name?.trim() &&
    data.primary_contact_email?.trim() &&
    data.packages_selected?.length > 0

  // Generic field change handler
  const handleChange = useCallback(
    (field: string, value: unknown) => {
      onChange({ ...data, [field]: value })
    },
    [data, onChange]
  )

  const handleStringChange = useCallback(
    (field: string, value: string) => handleChange(field, value),
    [handleChange]
  )

  const handleArrayChange = useCallback(
    (field: string, value: string[]) => handleChange(field, value),
    [handleChange]
  )

  const handleNumberChange = useCallback(
    (field: string, value: number | null) => handleChange(field, value),
    [handleChange]
  )

  // Package toggle handler
  const togglePackage = useCallback(
    (pkg: PackageSlug) => {
      const current = data.packages_selected || []
      const updated = current.includes(pkg)
        ? current.filter((p) => p !== pkg)
        : [...current, pkg]
      handleChange('packages_selected', updated)
    },
    [data.packages_selected, handleChange]
  )

  const fs = useCallback(
    (fieldName: string) =>
      getFieldStatus(
        fieldName,
        (data as unknown as Record<string, unknown>)[fieldName],
        fieldsInferred
      ),
    [data, fieldsInferred]
  )

  const needsOutbound =
    data.packages_selected?.includes('outbound') || data.packages_selected?.includes('bundle')
  const needsPixel =
    data.packages_selected?.includes('super_pixel') || data.packages_selected?.includes('bundle')

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Confidence score */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Confidence:</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                data.confidence_score >= 80
                  ? 'bg-green-100 text-green-700'
                  : data.confidence_score >= 50
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {data.confidence_score}%
            </span>
          </div>
          {/* Field counts */}
          <div className="text-xs text-gray-500">
            <span className="text-green-600 font-medium">{filledCount} filled</span>
            {needsInputCount > 0 && (
              <>
                {' / '}
                <span className="text-amber-600 font-medium">{needsInputCount} needs input</span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Client'
          )}
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          <Section title="Company Info">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField
                label="Company Name *"
                value={data.company_name || ''}
                fieldName="company_name"
                onChange={handleStringChange}
                status={fs('company_name')}
              />
              <TextField
                label="Website *"
                value={data.company_website || ''}
                fieldName="company_website"
                onChange={handleStringChange}
                status={fs('company_website')}
                type="url"
              />
              <TextField
                label="Industry *"
                value={data.industry || ''}
                fieldName="industry"
                onChange={handleStringChange}
                status={fs('industry')}
              />
              <TextField
                label="Contact Name *"
                value={data.primary_contact_name || ''}
                fieldName="primary_contact_name"
                onChange={handleStringChange}
                status={fs('primary_contact_name')}
              />
              <TextField
                label="Contact Email *"
                value={data.primary_contact_email || ''}
                fieldName="primary_contact_email"
                onChange={handleStringChange}
                status={fs('primary_contact_email')}
                type="email"
              />
              <TextField
                label="Contact Phone"
                value={data.primary_contact_phone || ''}
                fieldName="primary_contact_phone"
                onChange={handleStringChange}
                status={fs('primary_contact_phone')}
              />
              <TextField
                label="Billing Contact Name"
                value={data.billing_contact_name || ''}
                fieldName="billing_contact_name"
                onChange={handleStringChange}
                status={fs('billing_contact_name')}
              />
              <TextField
                label="Billing Contact Email"
                value={data.billing_contact_email || ''}
                fieldName="billing_contact_email"
                onChange={handleStringChange}
                status={fs('billing_contact_email')}
                type="email"
              />
            </div>
            <TextField
              label="Team Members"
              value={data.team_members || ''}
              fieldName="team_members"
              onChange={handleStringChange}
              status={fs('team_members')}
            />
            <SelectField
              label="Communication Channel"
              value={data.communication_channel || ''}
              fieldName="communication_channel"
              onChange={handleStringChange}
              status={fs('communication_channel')}
              options={[
                { value: 'Email', label: 'Email' },
                { value: 'Slack', label: 'Slack' },
                { value: 'Text/SMS', label: 'Text/SMS' },
                { value: 'Phone', label: 'Phone' },
              ]}
            />
          </Section>

          <Section title="Package Selection *">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PACKAGE_SLUGS.map((slug) => (
                <label
                  key={slug}
                  className={`flex items-start gap-2 rounded-md border p-2.5 cursor-pointer transition-colors ${
                    data.packages_selected?.includes(slug)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={data.packages_selected?.includes(slug) || false}
                    onChange={() => togglePackage(slug)}
                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {PACKAGES[slug].label}
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {PACKAGES[slug].description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {data.packages_reasoning && (
              <p className="text-xs text-gray-500 italic mt-2">
                AI reasoning: {data.packages_reasoning}
              </p>
            )}
          </Section>

          <Section title="Commercial" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumberField
                label="Setup Fee"
                value={data.setup_fee}
                fieldName="setup_fee"
                onChange={handleNumberChange}
                status={fs('setup_fee')}
                prefix="$"
              />
              <NumberField
                label="Recurring Fee"
                value={data.recurring_fee}
                fieldName="recurring_fee"
                onChange={handleNumberChange}
                status={fs('recurring_fee')}
                prefix="$"
              />
              <SelectField
                label="Billing Cadence"
                value={data.billing_cadence || ''}
                fieldName="billing_cadence"
                onChange={handleStringChange}
                status={fs('billing_cadence')}
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'annual', label: 'Annual' },
                ]}
              />
              <SelectField
                label="Outbound Tier"
                value={data.outbound_tier || ''}
                fieldName="outbound_tier"
                onChange={handleStringChange}
                status={fs('outbound_tier')}
                options={[
                  { value: 'Base', label: 'Base' },
                  { value: 'Growth', label: 'Growth' },
                  { value: 'Scale', label: 'Scale' },
                  { value: 'Custom', label: 'Custom' },
                ]}
              />
              <TextField
                label="Payment Method"
                value={data.payment_method || ''}
                fieldName="payment_method"
                onChange={handleStringChange}
                status={fs('payment_method')}
              />
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Section title="ICP (Ideal Customer Profile)">
            <TextareaField
              label="ICP Description"
              value={data.icp_description || ''}
              fieldName="icp_description"
              onChange={handleStringChange}
              status={fs('icp_description')}
              rows={3}
            />
            <TagField
              label="Target Industries"
              value={data.target_industries || []}
              fieldName="target_industries"
              onChange={handleArrayChange}
              status={fs('target_industries')}
            />
            <TagField
              label="Sub-Industries"
              value={data.sub_industries || []}
              fieldName="sub_industries"
              onChange={handleArrayChange}
              status={fs('sub_industries')}
            />
            <TagField
              label="Target Company Sizes"
              value={data.target_company_sizes || []}
              fieldName="target_company_sizes"
              onChange={handleArrayChange}
              status={fs('target_company_sizes')}
              placeholder="e.g. 1-10, 11-50, 51-200"
            />
            <TagField
              label="Target Titles"
              value={data.target_titles || []}
              fieldName="target_titles"
              onChange={handleArrayChange}
              status={fs('target_titles')}
            />
            <TagField
              label="Target Geography"
              value={data.target_geography || []}
              fieldName="target_geography"
              onChange={handleArrayChange}
              status={fs('target_geography')}
              placeholder="e.g. US Only, Global"
            />
            <TextField
              label="Specific Regions"
              value={data.specific_regions || ''}
              fieldName="specific_regions"
              onChange={handleStringChange}
              status={fs('specific_regions')}
            />
            <TextareaField
              label="Pain Points"
              value={data.pain_points || ''}
              fieldName="pain_points"
              onChange={handleStringChange}
              status={fs('pain_points')}
            />
            <TextField
              label="Must-Have Traits"
              value={data.must_have_traits || ''}
              fieldName="must_have_traits"
              onChange={handleStringChange}
              status={fs('must_have_traits')}
            />
            <TextField
              label="Exclusion Criteria"
              value={data.exclusion_criteria || ''}
              fieldName="exclusion_criteria"
              onChange={handleStringChange}
              status={fs('exclusion_criteria')}
            />
            <TagField
              label="Intent Keywords"
              value={data.intent_keywords || []}
              fieldName="intent_keywords"
              onChange={handleArrayChange}
              status={fs('intent_keywords')}
            />
            <TagField
              label="Competitors"
              value={data.competitor_names || []}
              fieldName="competitor_names"
              onChange={handleArrayChange}
              status={fs('competitor_names')}
            />
            <TextField
              label="Best Customers"
              value={data.best_customers || ''}
              fieldName="best_customers"
              onChange={handleStringChange}
              status={fs('best_customers')}
            />
            <TextField
              label="Sample Accounts"
              value={data.sample_accounts || ''}
              fieldName="sample_accounts"
              onChange={handleStringChange}
              status={fs('sample_accounts')}
            />
          </Section>

          {needsOutbound && (
            <Section title="Email Setup">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField
                  label="Sending Volume"
                  value={data.sending_volume || ''}
                  fieldName="sending_volume"
                  onChange={handleStringChange}
                  status={fs('sending_volume')}
                />
                <TextField
                  label="Lead Volume"
                  value={data.lead_volume || ''}
                  fieldName="lead_volume"
                  onChange={handleStringChange}
                  status={fs('lead_volume')}
                />
                <TextField
                  label="Start Timeline"
                  value={data.start_timeline || ''}
                  fieldName="start_timeline"
                  onChange={handleStringChange}
                  status={fs('start_timeline')}
                />
                <TextField
                  label="Sender Names"
                  value={data.sender_names || ''}
                  fieldName="sender_names"
                  onChange={handleStringChange}
                  status={fs('sender_names')}
                />
                <TextField
                  label="Domain Variations"
                  value={data.domain_variations || ''}
                  fieldName="domain_variations"
                  onChange={handleStringChange}
                  status={fs('domain_variations')}
                />
                <TextField
                  label="Domain Provider"
                  value={data.domain_provider || ''}
                  fieldName="domain_provider"
                  onChange={handleStringChange}
                  status={fs('domain_provider')}
                />
              </div>
              <SelectField
                label="Copy Tone"
                value={data.copy_tone || ''}
                fieldName="copy_tone"
                onChange={handleStringChange}
                status={fs('copy_tone')}
                options={[
                  { value: 'Professional/Formal', label: 'Professional/Formal' },
                  { value: 'Conversational', label: 'Conversational' },
                  { value: 'Direct/Bold', label: 'Direct/Bold' },
                  { value: 'Friendly/Casual', label: 'Friendly/Casual' },
                ]}
              />
              <SelectField
                label="Primary CTA"
                value={data.primary_cta || ''}
                fieldName="primary_cta"
                onChange={handleStringChange}
                status={fs('primary_cta')}
                options={[
                  { value: 'Book a call', label: 'Book a call' },
                  { value: 'Reply to learn more', label: 'Reply to learn more' },
                  { value: 'Visit landing page', label: 'Visit landing page' },
                  { value: 'Custom', label: 'Custom' },
                ]}
              />
              <TextField
                label="Calendar Link"
                value={data.calendar_link || ''}
                fieldName="calendar_link"
                onChange={handleStringChange}
                status={fs('calendar_link')}
                type="url"
              />
              <TextField
                label="Reply Routing Email"
                value={data.reply_routing_email || ''}
                fieldName="reply_routing_email"
                onChange={handleStringChange}
                status={fs('reply_routing_email')}
                type="email"
              />
            </Section>
          )}

          {needsPixel && (
            <Section title="Pixel Setup">
              <TextField
                label="Pixel URLs"
                value={data.pixel_urls || ''}
                fieldName="pixel_urls"
                onChange={handleStringChange}
                status={fs('pixel_urls')}
              />
              <SelectField
                label="Uses GTM?"
                value={data.uses_gtm || ''}
                fieldName="uses_gtm"
                onChange={handleStringChange}
                status={fs('uses_gtm')}
                options={[
                  { value: 'Yes', label: 'Yes' },
                  { value: 'No', label: 'No' },
                  { value: 'Not sure', label: 'Not sure' },
                ]}
              />
              <TextField
                label="Pixel Installer"
                value={data.pixel_installer || ''}
                fieldName="pixel_installer"
                onChange={handleStringChange}
                status={fs('pixel_installer')}
              />
              <TextField
                label="Monthly Traffic"
                value={data.monthly_traffic || ''}
                fieldName="monthly_traffic"
                onChange={handleStringChange}
                status={fs('monthly_traffic')}
              />
            </Section>
          )}

          <Section title="Use Case & Delivery" defaultOpen={false}>
            <TagField
              label="Data Use Cases"
              value={data.data_use_cases || []}
              fieldName="data_use_cases"
              onChange={handleArrayChange}
              status={fs('data_use_cases')}
              placeholder="e.g. Cold email, CRM enrichment"
            />
            <TextField
              label="Primary CRM"
              value={data.primary_crm || ''}
              fieldName="primary_crm"
              onChange={handleStringChange}
              status={fs('primary_crm')}
            />
            <SelectField
              label="Data Format"
              value={data.data_format || ''}
              fieldName="data_format"
              onChange={handleStringChange}
              status={fs('data_format')}
              options={[
                { value: 'CSV', label: 'CSV' },
                { value: 'Google Sheet', label: 'Google Sheet' },
                { value: 'Direct CRM sync', label: 'Direct CRM sync' },
                { value: 'API', label: 'API' },
              ]}
            />
            <TextField
              label="Audience Count"
              value={data.audience_count || ''}
              fieldName="audience_count"
              onChange={handleStringChange}
              status={fs('audience_count')}
            />
          </Section>
        </div>
      </div>

      {/* Bottom section */}
      {(data.additional_context || (data.missing_critical_fields && data.missing_critical_fields.length > 0)) && (
        <div className="space-y-3">
          {data.missing_critical_fields && data.missing_critical_fields.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <h4 className="text-sm font-semibold text-amber-800 mb-1">Missing Critical Fields</h4>
              <ul className="list-disc list-inside text-xs text-amber-700 space-y-0.5">
                {data.missing_critical_fields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          {data.additional_context && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Additional Context</h4>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{data.additional_context}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
