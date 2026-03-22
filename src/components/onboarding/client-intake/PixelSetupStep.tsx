'use client'

import { useFormContext, useController } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { OnboardingFormData } from '@/types/onboarding'

const GTM_OPTIONS = [
  { value: 'yes', label: 'Yes, we use GTM' },
  { value: 'no', label: 'No, we do not use GTM' },
  { value: 'unsure', label: 'Not sure' },
]

const INSTALLER_OPTIONS = [
  { value: 'self', label: 'We will install it ourselves' },
  { value: 'developer', label: 'Our developer will install it' },
  { value: 'cursive', label: 'Cursive team should install it' },
]

const DELIVERY_OPTIONS = [
  'Dashboard',
  'CRM Sync',
  'Google Sheet',
  'CSV Export',
  'Webhook',
  'Other',
]

const TRAFFIC_OPTIONS = [
  { value: 'under_1k', label: 'Under 1,000 / month' },
  { value: '1k_5k', label: '1,000 - 5,000 / month' },
  { value: '5k_25k', label: '5,000 - 25,000 / month' },
  { value: '25k_100k', label: '25,000 - 100,000 / month' },
  { value: 'over_100k', label: '100,000+ / month' },
  { value: 'unsure', label: 'Not sure' },
]

const REFRESH_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi_weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export function PixelSetupStep() {
  const { register, watch, control, formState: { errors } } = useFormContext<OnboardingFormData>()
  const usesGtm = watch('uses_gtm')
  const installer = watch('pixel_installer')

  const { field: deliveryField } = useController({ name: 'pixel_delivery', control })
  const pixelDeliveryOther = watch('pixel_delivery_other')

  const toggleDelivery = (option: string) => {
    const current: string[] = deliveryField.value ?? []
    const next = current.includes(option) ? current.filter(d => d !== option) : [...current, option]
    deliveryField.onChange(next)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Time to identify your website visitors</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your Super Pixel to identify anonymous website visitors and build targetable audiences.
        </p>
      </div>

      {/* Website & Platform */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="pixel_urls">Website URL(s) to Track <span className="text-destructive">*</span></Label>
          <Textarea
            id="pixel_urls"
            placeholder="https://acmecorp.com&#10;https://blog.acmecorp.com"
            rows={3}
            error={errors.pixel_urls?.message}
            {...register('pixel_urls', { required: 'At least one website URL is required' })}
          />
          <p className="text-sm text-muted-foreground">One URL per line. Include all domains and subdomains to track.</p>
          {errors.pixel_urls && <p className="text-sm text-destructive">{errors.pixel_urls.message}</p>}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="uses_gtm">Do You Use Google Tag Manager?</Label>
            <Select
              id="uses_gtm"
              options={GTM_OPTIONS}
              placeholder="Select option"
              {...register('uses_gtm')}
            />
          </div>

          {usesGtm === 'yes' && (
            <div className="space-y-2">
              <Label htmlFor="gtm_container_id">GTM Container ID</Label>
              <Input
                id="gtm_container_id"
                placeholder="GTM-XXXXXXX"
                {...register('gtm_container_id')}
              />
            </div>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pixel_installer">Who Will Install the Pixel?</Label>
            <Select
              id="pixel_installer"
              options={INSTALLER_OPTIONS}
              placeholder="Select installer"
              {...register('pixel_installer')}
            />
          </div>

          {installer === 'developer' && (
            <div className="space-y-2">
              <Label htmlFor="developer_email">Developer Email</Label>
              <Input
                id="developer_email"
                type="email"
                placeholder="dev@acmecorp.com"
                {...register('developer_email')}
              />
              <p className="text-sm text-muted-foreground">We will send installation instructions directly to your developer.</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Delivery */}
      <div className="space-y-4">
        <Label>How Would You Like to Receive Pixel Data?</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DELIVERY_OPTIONS.map((option) => {
            const isChecked = (deliveryField.value ?? []).includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleDelivery(option)}
                className={cn(
                  'rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                  isChecked
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-border bg-card text-muted-foreground hover:border-blue-200'
                )}
              >
                {option}
              </button>
            )
          })}
        </div>

        {(deliveryField.value ?? []).includes('Other') && (
          <div className="space-y-2">
            <Label htmlFor="pixel_delivery_other">Describe Other Delivery Method</Label>
            <Input
              id="pixel_delivery_other"
              placeholder="How would you like to receive data?"
              {...register('pixel_delivery_other')}
            />
          </div>
        )}

        {(deliveryField.value ?? []).includes('CRM Sync') && (
          <div className="space-y-2">
            <Label htmlFor="pixel_crm_name">CRM Name</Label>
            <Input
              id="pixel_crm_name"
              placeholder="e.g. HubSpot, Salesforce, Close"
              {...register('pixel_crm_name')}
            />
          </div>
        )}
      </div>

      {/* Tracking Preferences */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="conversion_events">Conversion Events to Track</Label>
          <Textarea
            id="conversion_events"
            placeholder="e.g. Form submissions, demo requests, pricing page visits, add to cart..."
            rows={3}
            {...register('conversion_events')}
          />
          <p className="text-sm text-muted-foreground">What actions on your site indicate buying intent?</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="monthly_traffic">Estimated Monthly Website Traffic</Label>
            <Select
              id="monthly_traffic"
              options={TRAFFIC_OPTIONS}
              placeholder="Select range"
              {...register('monthly_traffic')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience_refresh">Audience Refresh Frequency</Label>
            <Select
              id="audience_refresh"
              options={REFRESH_OPTIONS}
              placeholder="Select frequency"
              {...register('audience_refresh')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
