'use client'

import { useFormContext } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { OnboardingFormData } from '@/types/onboarding'

export function LegalStep() {
  const { register, formState: { errors } } = useFormContext<OnboardingFormData>()
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Almost done! Just the legal bits</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please review and acknowledge the following terms to complete your onboarding.
        </p>
      </div>

      {/* Legal Checkboxes */}
      <div className="space-y-5 rounded-lg border border-border bg-muted/20 p-6">
        <div className="space-y-1">
          <Checkbox
            label="Statement of Work (SOW) has been signed"
            description="I confirm that the Statement of Work has been reviewed and signed by an authorized representative."
            {...register('sow_signed', { required: 'SOW acknowledgment is required' })}
          />
          {errors.sow_signed && <p className="ml-7 text-sm text-destructive">{errors.sow_signed.message}</p>}
        </div>

        <div className="border-t border-border pt-4 space-y-1">
          <Checkbox
            label="I understand how my data will be used"
            description="Cursive will use the information provided to build audiences, generate leads, and run campaigns on my behalf. Data is stored securely and never shared with third parties without consent."
            {...register('data_usage_ack', { required: 'Data usage acknowledgment is required' })}
          />
          {errors.data_usage_ack && <p className="ml-7 text-sm text-destructive">{errors.data_usage_ack.message}</p>}
        </div>

        <div className="border-t border-border pt-4 space-y-1">
          <Checkbox
            label="I acknowledge the privacy and compliance terms"
            description="All outbound campaigns comply with CAN-SPAM, GDPR, and CCPA regulations. Recipients can opt out at any time. Cursive maintains compliance controls on all sending."
            {...register('privacy_ack', { required: 'Privacy acknowledgment is required' })}
          />
          {errors.privacy_ack && <p className="ml-7 text-sm text-destructive">{errors.privacy_ack.message}</p>}
        </div>

        <div className="border-t border-border pt-4 space-y-1">
          <Checkbox
            label="I agree to the billing terms"
            description="I understand the pricing, billing cadence, and payment terms outlined in my SOW. Recurring charges will be billed according to the agreed schedule."
            {...register('billing_terms_ack', { required: 'Billing terms acknowledgment is required' })}
          />
          {errors.billing_terms_ack && <p className="ml-7 text-sm text-destructive">{errors.billing_terms_ack.message}</p>}
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="additional_notes">Additional Notes or Questions</Label>
        <Textarea
          id="additional_notes"
          placeholder="Anything else we should know? Special requests, timeline constraints, questions..."
          rows={4}
          {...register('additional_notes')}
        />
      </div>

      {/* Digital Signature */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#0F172A]">Digital Signature</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="signature_name">Full Legal Name <span className="text-destructive">*</span></Label>
            <Input
              id="signature_name"
              placeholder="Jane Smith"
              error={errors.signature_name?.message}
              {...register('signature_name', { required: 'Signature is required' })}
            />
            {errors.signature_name && <p className="text-sm text-destructive">{errors.signature_name.message}</p>}
            <p className="text-sm text-muted-foreground">By typing your name, you agree to the terms above.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature_date">Date</Label>
            <Input
              id="signature_date"
              value={today}
              readOnly
              className="bg-muted/50"
              {...register('signature_date')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
