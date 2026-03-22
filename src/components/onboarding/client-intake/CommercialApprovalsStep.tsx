'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { needsOutboundSetup, needsAudienceAck, needsPixelSetup } from '@/types/onboarding'
import type { OnboardingFormData } from '@/types/onboarding'

const BILLING_CADENCE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
]

const PAYMENT_METHOD_OPTIONS = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'ach', label: 'ACH / Bank Transfer' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'other', label: 'Other' },
]

const OUTBOUND_TIER_OPTIONS = [
  { value: 'starter', label: 'Starter - Up to 5,000 emails/mo' },
  { value: 'growth', label: 'Growth - Up to 15,000 emails/mo' },
  { value: 'scale', label: 'Scale - Up to 50,000 emails/mo' },
  { value: 'enterprise', label: 'Enterprise - 50,000+ emails/mo' },
  { value: 'custom', label: 'Custom' },
]

export function CommercialApprovalsStep() {
  const { register, watch, formState: { errors } } = useFormContext<OnboardingFormData>()
  const packages = watch('packages_selected') ?? []
  const paymentMethod = watch('payment_method')
  const outboundTier = watch('outbound_tier')

  const showOutbound = needsOutboundSetup(packages)
  const showAudienceAck = needsAudienceAck(packages)
  const showPixelAck = needsPixelSetup(packages)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Commercial Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm your pricing, billing, and package-specific acknowledgments.
        </p>
      </div>

      {/* Pricing */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#0F172A]">Pricing</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="setup_fee">Setup Fee</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="setup_fee"
                type="number"
                min={0}
                step={1}
                placeholder="1,500"
                className="pl-7"
                {...register('setup_fee', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurring_fee">Recurring Fee</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="recurring_fee"
                type="number"
                min={0}
                step={1}
                placeholder="Optional"
                className="pl-7"
                {...register('recurring_fee', { valueAsNumber: true })}
              />
            </div>
            <p className="text-sm text-muted-foreground">Leave blank if included in setup fee</p>
          </div>
        </div>
      </div>

      {/* Billing */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#0F172A]">Billing</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="billing_cadence">Billing Cadence</Label>
            <Select
              id="billing_cadence"
              options={BILLING_CADENCE_OPTIONS}
              placeholder="Select cadence"
              {...register('billing_cadence')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select
              id="payment_method"
              options={PAYMENT_METHOD_OPTIONS}
              placeholder="Select method"
              {...register('payment_method')}
            />
          </div>

          {paymentMethod === 'invoice' && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="invoice_email">Invoice Email</Label>
              <Input
                id="invoice_email"
                type="email"
                placeholder="ap@acmecorp.com"
                {...register('invoice_email')}
              />
              <p className="text-sm text-muted-foreground">Where should we send invoices?</p>
            </div>
          )}
        </div>
      </div>

      {/* Outbound Tier */}
      {showOutbound && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-[#0F172A]">Outbound Tier</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="outbound_tier">Select Your Tier <span className="text-destructive">*</span></Label>
              <Select
                id="outbound_tier"
                options={OUTBOUND_TIER_OPTIONS}
                placeholder="Select tier"
                error={errors.outbound_tier?.message}
                {...register('outbound_tier', {
                  validate: (v: string) => {
                    if (showOutbound && !v) return 'Please select an outbound tier'
                    return true
                  },
                })}
              />
              {errors.outbound_tier && <p className="text-sm text-destructive">{errors.outbound_tier.message}</p>}
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-[#0F172A]">Tier Details</p>
              <ul className="mt-2 space-y-1.5">
                <li><span className="font-medium">Starter:</span> 3 sending domains, 6 inboxes, up to 5K emails/mo</li>
                <li><span className="font-medium">Growth:</span> 5 sending domains, 15 inboxes, up to 15K emails/mo</li>
                <li><span className="font-medium">Scale:</span> 10 sending domains, 30 inboxes, up to 50K emails/mo</li>
                <li><span className="font-medium">Enterprise:</span> Unlimited domains and custom volume</li>
              </ul>
            </div>

            {outboundTier === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="custom_tier_details">Custom Tier Details</Label>
                <Textarea
                  id="custom_tier_details"
                  placeholder="Describe your custom volume and requirements..."
                  rows={3}
                  {...register('custom_tier_details')}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Acknowledgments */}
      {(showOutbound || showAudienceAck || showPixelAck) && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-[#0F172A]">Acknowledgments</h3>
          <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-5">
            {showOutbound && (
              <Checkbox
                label="I understand that sending domains are purchased separately (~$12/domain/year) and managed by Cursive."
                description="Domain costs are billed at-cost, no markup."
                {...register('domain_cost_acknowledged')}
              />
            )}

            {showAudienceAck && (
              <Checkbox
                label="I understand that audience/enrichment data is delivered within 3-5 business days after ICP approval."
                description="Rush delivery may be available for an additional fee."
                {...register('audience_cost_acknowledged')}
              />
            )}

            {showPixelAck && (
              <Checkbox
                label="I understand that pixel data requires 48-72 hours of traffic collection before meaningful results appear."
                description="We will guide you through the installation process."
                {...register('pixel_cost_acknowledged')}
              />
            )}

            {showAudienceAck && (
              <Checkbox
                label="I understand that additional audience segments beyond my plan may incur extra charges."
                {...register('additional_audience_noted')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
