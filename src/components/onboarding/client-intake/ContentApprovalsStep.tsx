'use client'

import { useFormContext } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { FileUpload } from './FileUpload'
import { needsOutboundSetup } from '@/types/onboarding'
import type { OnboardingFormData, PendingFile } from '@/types/onboarding'

interface ContentApprovalsStepProps {
  brandGuidelinesFile: PendingFile | null
  onBrandGuidelinesChange: (file: PendingFile | null) => void
  deckFile: PendingFile | null
  onDeckChange: (file: PendingFile | null) => void
  testimonialsFile: PendingFile | null
  onTestimonialsChange: (file: PendingFile | null) => void
  sampleOffersFile: PendingFile | null
  onSampleOffersChange: (file: PendingFile | null) => void
}

export function ContentApprovalsStep({
  brandGuidelinesFile,
  onBrandGuidelinesChange,
  deckFile,
  onDeckChange,
  testimonialsFile,
  onTestimonialsChange,
  sampleOffersFile,
  onSampleOffersChange,
}: ContentApprovalsStepProps) {
  const { register, watch } = useFormContext<OnboardingFormData>()
  const packages = watch('packages_selected') ?? []
  const showSenderApproval = needsOutboundSetup(packages)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Content & Approvals</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload brand assets and approve content settings. These help us create campaigns that match your voice.
        </p>
      </div>

      {/* File Uploads */}
      <div className="space-y-6">
        <FileUpload
          label="Brand Guidelines"
          helperText="Upload your brand guide, style guide, or any document that outlines your visual identity and tone."
          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg"
          value={brandGuidelinesFile}
          onChange={onBrandGuidelinesChange}
          fileType="brand_guidelines"
        />

        <FileUpload
          label="Sales Deck or One-Pager"
          helperText="Your pitch deck or product one-pager helps us understand your positioning and value props."
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          value={deckFile}
          onChange={onDeckChange}
          fileType="deck"
        />

        <FileUpload
          label="Testimonials or Case Studies"
          helperText="Social proof assets we can reference in outreach copy."
          accept=".pdf,.doc,.docx,.png,.jpg,.txt"
          value={testimonialsFile}
          onChange={onTestimonialsChange}
          fileType="testimonials"
        />

        <FileUpload
          label="Sample Offers or Promotions"
          helperText="Any current offers, free trials, or promotions you would like us to include in outreach."
          accept=".pdf,.doc,.docx,.png,.jpg,.txt"
          value={sampleOffersFile}
          onChange={onSampleOffersChange}
          fileType="sample_offers"
        />
      </div>

      {/* Approvals */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#0F172A]">Content Approvals</h3>
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-5">
          <Checkbox
            label="I approve Cursive to draft email copy on my behalf"
            description="We will write email sequences based on your ICP, brand, and tone preferences. You will review and approve all copy before it goes live."
            {...register('copy_approval')}
          />

          {showSenderApproval && (
            <Checkbox
              label="I approve the sender identity and domain setup described above"
              description="Cursive will purchase and configure sending domains and inboxes as specified in the Email Setup section."
              {...register('sender_identity_approval')}
            />
          )}
        </div>
      </div>
    </div>
  )
}
