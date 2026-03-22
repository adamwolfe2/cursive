'use client'

import { useFormContext, useController } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FileUpload } from './FileUpload'
import type { OnboardingFormData, PendingFile } from '@/types/onboarding'

const USE_CASE_OPTIONS = [
  'Cold outbound email',
  'Paid ads retargeting',
  'Audience research',
  'ABM campaigns',
  'List enrichment',
  'CRM enrichment',
  'Lead scoring',
  'Event follow-up',
  'Competitor conquesting',
  'Other',
]

const CRM_OPTIONS = [
  { value: 'hubspot', label: 'HubSpot' },
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'close', label: 'Close' },
  { value: 'pipedrive', label: 'Pipedrive' },
  { value: 'none', label: 'No CRM' },
  { value: 'other', label: 'Other' },
]

const FORMAT_OPTIONS = [
  { value: 'csv', label: 'CSV' },
  { value: 'google_sheet', label: 'Google Sheet' },
  { value: 'crm_sync', label: 'Direct CRM Sync' },
  { value: 'api', label: 'API / Webhook' },
  { value: 'dashboard', label: 'Cursive Dashboard' },
]

const AUDIENCE_COUNT_OPTIONS = [
  { value: '1', label: '1 audience / segment' },
  { value: '2_3', label: '2-3 audiences' },
  { value: '4_6', label: '4-6 audiences' },
  { value: '7_plus', label: '7+ audiences' },
  { value: 'unsure', label: 'Not sure yet' },
]

const EXISTING_LIST_OPTIONS = [
  { value: 'yes', label: 'Yes, I have an existing list to enrich' },
  { value: 'no', label: 'No, build from scratch' },
  { value: 'both', label: 'Both - enrich existing + build new' },
]

interface UseCaseStepProps {
  existingListFile: PendingFile | null
  onExistingListFileChange: (file: PendingFile | null) => void
}

export function UseCaseStep({ existingListFile, onExistingListFileChange }: UseCaseStepProps) {
  const { register, watch, control } = useFormContext<OnboardingFormData>()
  const crmPlatform = watch('primary_crm')
  const hasExistingList = watch('has_existing_list')

  const { field: useCasesField } = useController({ name: 'data_use_cases', control })

  const toggleUseCase = (useCase: string) => {
    const current: string[] = useCasesField.value ?? []
    const next = current.includes(useCase) ? current.filter(u => u !== useCase) : [...current, useCase]
    useCasesField.onChange(next)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">How will you put this data to work?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Help us understand how you plan to use the data so we can optimize delivery and format.
        </p>
      </div>

      {/* Data Use Cases */}
      <div className="space-y-3">
        <Label>How Will You Use the Data?</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {USE_CASE_OPTIONS.map((useCase) => {
            const isChecked = (useCasesField.value ?? []).includes(useCase)
            return (
              <button
                key={useCase}
                type="button"
                onClick={() => toggleUseCase(useCase)}
                className={cn(
                  'rounded-lg border px-4 py-2.5 text-sm font-medium transition-all text-left',
                  isChecked
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-border bg-card text-muted-foreground hover:border-blue-200'
                )}
              >
                {useCase}
              </button>
            )
          })}
        </div>
      </div>

      {/* CRM */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="primary_crm">CRM Platform</Label>
          <Select
            id="primary_crm"
            options={CRM_OPTIONS}
            placeholder="Select CRM"
            {...register('primary_crm')}
          />
        </div>

        {crmPlatform === 'other' && (
          <div className="space-y-2">
            <Label htmlFor="custom_platform">CRM / Platform Name</Label>
            <Input
              id="custom_platform"
              placeholder="e.g. Monday, Zoho, custom system..."
              {...register('custom_platform')}
            />
          </div>
        )}
      </div>

      {/* Delivery Format */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="data_format">Preferred Data Format</Label>
          <Select
            id="data_format"
            options={FORMAT_OPTIONS}
            placeholder="Select format"
            {...register('data_format')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="audience_count">How Many Audiences / Segments?</Label>
          <Select
            id="audience_count"
            options={AUDIENCE_COUNT_OPTIONS}
            placeholder="Select count"
            {...register('audience_count')}
          />
        </div>
      </div>

      {/* Existing List */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="has_existing_list">Do You Have an Existing Contact List?</Label>
          <Select
            id="has_existing_list"
            options={EXISTING_LIST_OPTIONS}
            placeholder="Select option"
            {...register('has_existing_list')}
          />
        </div>

        {(hasExistingList === 'yes' || hasExistingList === 'both') && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-5">
            <FileUpload
              label="Upload Existing List"
              helperText="Upload your contact list. We accept CSV, Excel, and Google Sheet exports."
              accept=".csv,.xlsx,.xls"
              value={existingListFile}
              onChange={onExistingListFileChange}
              fileType="existing_list"
            />
          </div>
        )}
      </div>
    </div>
  )
}
