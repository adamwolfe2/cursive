'use client'

import * as React from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { OnboardingFormData, PendingFile } from '@/types/onboarding'
import { FileUpload } from './FileUpload'

const VOLUME_OPTIONS = [
  { value: '1000', label: 'Up to 1,000 / day' },
  { value: '2500', label: 'Up to 2,500 / day' },
  { value: '5000', label: 'Up to 5,000 / day' },
  { value: '10000', label: 'Up to 10,000 / day' },
  { value: 'custom', label: 'Custom volume' },
]

const LEAD_VOLUME_OPTIONS = [
  { value: '500', label: '500 leads / month' },
  { value: '1000', label: '1,000 leads / month' },
  { value: '2500', label: '2,500 leads / month' },
  { value: '5000', label: '5,000 leads / month' },
  { value: '10000', label: '10,000+ leads / month' },
]

const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1_week', label: 'Within 1 week' },
  { value: '2_weeks', label: 'Within 2 weeks' },
  { value: '1_month', label: 'Within 1 month' },
  { value: 'flexible', label: 'Flexible / no rush' },
]

const PROVIDER_OPTIONS = [
  { value: 'google', label: 'Google Workspace' },
  { value: 'microsoft', label: 'Microsoft 365' },
  { value: 'other', label: 'Other' },
  { value: 'cursive_manages', label: 'Cursive manages everything' },
]

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional & Formal' },
  { value: 'conversational', label: 'Conversational & Friendly' },
  { value: 'direct', label: 'Direct & To the Point' },
  { value: 'witty', label: 'Witty & Creative' },
  { value: 'consultative', label: 'Consultative / Advisory' },
]

const CTA_OPTIONS = [
  { value: 'book_meeting', label: 'Book a Meeting' },
  { value: 'reply', label: 'Reply to Learn More' },
  { value: 'visit_link', label: 'Visit a Link / Landing Page' },
  { value: 'free_trial', label: 'Start a Free Trial' },
  { value: 'custom', label: 'Custom CTA' },
]

const REPLY_OPTIONS = [
  { value: 'sender_inbox', label: 'Route to sending inbox' },
  { value: 'team_email', label: 'Forward to team email' },
  { value: 'crm', label: 'Route to CRM' },
  { value: 'custom', label: 'Custom routing' },
]

interface EmailSetupStepProps {
  examplesFile: PendingFile | null
  onExamplesFileChange: (file: PendingFile | null) => void
}

export function EmailSetupStep({ examplesFile, onExamplesFileChange }: EmailSetupStepProps) {
  const { register, watch, formState: { errors } } = useFormContext<OnboardingFormData>()
  const primaryCta = watch('primary_cta')

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Let&apos;s set up your outbound engine</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your outbound email campaigns. We handle domain setup, warmup, and sending infrastructure.
        </p>
      </div>

      {/* 5a: Volume & Timeline */}
      <section className="space-y-6">
        <div className="border-b border-border pb-2">
          <h3 className="text-lg font-semibold text-[#0F172A]">Volume & Timeline</h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sending_volume">Daily Sending Volume</Label>
            <Select
              id="sending_volume"
              options={VOLUME_OPTIONS}
              placeholder="Select volume"
              {...register('sending_volume')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead_volume">Target Lead Volume</Label>
            <Select
              id="lead_volume"
              options={LEAD_VOLUME_OPTIONS}
              placeholder="Select volume"
              {...register('lead_volume')}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="start_timeline">When Do You Want to Start Sending?</Label>
            <Select
              id="start_timeline"
              options={TIMELINE_OPTIONS}
              placeholder="Select timeline"
              {...register('start_timeline')}
            />
            <p className="text-sm text-muted-foreground">
              New domains require a 14-21 day warmup period before full volume sending.
            </p>
          </div>
        </div>
      </section>

      {/* 5b: Sender Identity */}
      <section className="space-y-6">
        <div className="border-b border-border pb-2">
          <h3 className="text-lg font-semibold text-[#0F172A]">Sender Identity</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sender_names">Sender Names <span className="text-destructive">*</span></Label>
            <Input
              id="sender_names"
              placeholder="e.g. Jane Smith, JS at Acme, Jane from Acme"
              error={errors.sender_names?.message}
              {...register('sender_names', { required: 'Sender names are required' })}
            />
            <p className="text-sm text-muted-foreground">
              We rotate sender names for deliverability. Provide 2-4 variations.
            </p>
            {errors.sender_names && <p className="text-sm text-destructive">{errors.sender_names.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain_variations">Domain Variations</Label>
            <Input
              id="domain_variations"
              placeholder="e.g. acme.io, getacme.com, tryacme.com"
              {...register('domain_variations')}
            />
            <p className="text-sm text-muted-foreground">
              We purchase sending-specific domains to protect your primary domain reputation. Suggest variations or leave blank and we will create them.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="domain_provider">Email Provider</Label>
              <Select
                id="domain_provider"
                options={PROVIDER_OPTIONS}
                placeholder="Select provider"
                {...register('domain_provider')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="existing_domains">Existing Sending Domains</Label>
              <Input
                id="existing_domains"
                placeholder="e.g. send.acmecorp.com"
                {...register('existing_domains')}
              />
              <p className="text-sm text-muted-foreground">Only if you already have warmed sending domains</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5c: Campaign Preferences */}
      <section className="space-y-6">
        <div className="border-b border-border pb-2">
          <h3 className="text-lg font-semibold text-[#0F172A]">Campaign Preferences</h3>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="copy_tone">Email Tone</Label>
              <Select
                id="copy_tone"
                options={TONE_OPTIONS}
                placeholder="Select tone"
                {...register('copy_tone')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_cta">Primary Call to Action</Label>
              <Select
                id="primary_cta"
                options={CTA_OPTIONS}
                placeholder="Select CTA"
                {...register('primary_cta')}
              />
            </div>
          </div>

          {primaryCta === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="custom_cta">Custom CTA Details</Label>
              <Input
                id="custom_cta"
                placeholder="Describe your preferred call to action..."
                {...register('custom_cta')}
              />
            </div>
          )}

          {(primaryCta === 'book_meeting' || primaryCta === 'free_trial') && (
            <div className="space-y-2">
              <Label htmlFor="calendar_link">Calendar / Booking Link</Label>
              <Input
                id="calendar_link"
                type="url"
                placeholder="https://calendly.com/yourname"
                {...register('calendar_link')}
              />
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reply_routing_email">Reply Routing</Label>
              <Select
                id="reply_routing_email"
                options={REPLY_OPTIONS}
                placeholder="Select routing"
                {...register('reply_routing_email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup_reply_email">Backup Reply Email</Label>
              <Input
                id="backup_reply_email"
                type="email"
                placeholder="team@acmecorp.com"
                {...register('backup_reply_email')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="compliance_disclaimers">Compliance Notes</Label>
            <Textarea
              id="compliance_disclaimers"
              placeholder="Any compliance requirements, disclaimers, or restrictions we should know about..."
              rows={3}
              {...register('compliance_disclaimers')}
            />
          </div>

          <FileUpload
            label="Email Examples or Templates"
            helperText="Upload examples of emails or copy you like. We will use these as reference for tone and style."
            accept=".pdf,.doc,.docx,.txt,.png,.jpg"
            value={examplesFile}
            onChange={onExamplesFileChange}
            fileType="examples"
          />
        </div>
      </section>
    </div>
  )
}
