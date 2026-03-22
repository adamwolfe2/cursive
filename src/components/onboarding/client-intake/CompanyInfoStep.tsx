'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { OnboardingFormData } from '@/types/onboarding'

const COMMUNICATION_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'slack', label: 'Slack' },
  { value: 'text', label: 'Text / SMS' },
  { value: 'other', label: 'Other' },
]

const HOW_HEARD_OPTIONS = [
  { value: 'google', label: 'Google Search' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'referral', label: 'Referral' },
  { value: 'social', label: 'Social Media' },
  { value: 'event', label: 'Event / Conference' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'cold_email', label: 'Cold Email from Cursive' },
  { value: 'other', label: 'Other' },
]

export function CompanyInfoStep() {
  const { register, watch, formState: { errors } } = useFormContext<OnboardingFormData>()
  const commChannel = watch('communication_channel')
  const howHeard = watch('referral_source')

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Company Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about your company so we can tailor our setup to your needs.
        </p>
      </div>

      {/* Company Details */}
      <div className="grid gap-6 rounded-lg border border-slate-100 bg-slate-50/50 p-5 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name <span className="text-destructive">*</span></Label>
          <Input
            id="company_name"
            placeholder="Your company name"
            error={errors.company_name?.message}
            {...register('company_name', { required: 'Company name is required' })}
          />
          {errors.company_name && <p className="text-sm text-destructive">{errors.company_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_website">Website <span className="text-destructive">*</span></Label>
          <Input
            id="company_website"
            type="url"
            placeholder="https://yourcompany.com"
            error={errors.company_website?.message}
            {...register('company_website', {
              required: 'Website is required',
              pattern: { value: /^https?:\/\/.+\..+/, message: 'Please enter a valid URL' },
            })}
          />
          {errors.company_website && <p className="text-sm text-destructive">{errors.company_website.message}</p>}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="industry">Industry <span className="text-destructive">*</span></Label>
          <Input
            id="industry"
            placeholder="e.g. SaaS, Healthcare, Financial Services"
            error={errors.industry?.message}
            {...register('industry', { required: 'Industry is required' })}
          />
          {errors.industry && <p className="text-sm text-destructive">{errors.industry.message}</p>}
        </div>
      </div>

      {/* Primary Contact */}
      <div>
        <h3 className="mb-4 border-l-4 border-blue-500 pl-3 text-lg font-semibold text-[#0F172A]">Primary Contact</h3>
        <div className="grid gap-6 rounded-lg border border-slate-100 bg-slate-50/50 p-5 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primary_contact_name">Full Name <span className="text-destructive">*</span></Label>
            <Input
              id="primary_contact_name"
              placeholder="Full name"
              error={errors.primary_contact_name?.message}
              {...register('primary_contact_name', { required: 'Contact name is required' })}
            />
            {errors.primary_contact_name && <p className="text-sm text-destructive">{errors.primary_contact_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_contact_email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="primary_contact_email"
              type="email"
              placeholder="name@company.com"
              error={errors.primary_contact_email?.message}
              {...register('primary_contact_email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
              })}
            />
            {errors.primary_contact_email && <p className="text-sm text-destructive">{errors.primary_contact_email.message}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="primary_contact_phone">Phone</Label>
            <Input
              id="primary_contact_phone"
              type="tel"
              placeholder="(555) 123-4567"
              {...register('primary_contact_phone')}
            />
          </div>
        </div>
      </div>

      {/* Billing Contact */}
      <div>
        <h3 className="mb-1 border-l-4 border-blue-500 pl-3 text-lg font-semibold text-[#0F172A]">Billing Contact</h3>
        <p className="mb-4 pl-3 text-sm text-muted-foreground">Only if different from primary contact</p>
        <div className="grid gap-6 rounded-lg border border-slate-100 bg-slate-50/50 p-5 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="billing_contact_name">Billing Contact Name</Label>
            <Input
              id="billing_contact_name"
              placeholder="Full name"
              {...register('billing_contact_name')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_contact_email">Billing Contact Email</Label>
            <Input
              id="billing_contact_email"
              type="email"
              placeholder="billing@company.com"
              {...register('billing_contact_email')}
            />
          </div>
        </div>
      </div>

      {/* Team & Communication */}
      <div>
        <h3 className="mb-4 border-l-4 border-blue-500 pl-3 text-lg font-semibold text-[#0F172A]">Team &amp; Communication</h3>
      </div>
      <div className="space-y-6 rounded-lg border border-slate-100 bg-slate-50/50 p-5 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
        <div className="space-y-2">
          <Label htmlFor="team_members">Team Members Who Need Access</Label>
          <Textarea
            id="team_members"
            placeholder="List names and email addresses, one per line"
            rows={3}
            {...register('team_members')}
          />
          <p className="text-sm text-muted-foreground">These team members will be added to your workspace.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="communication_channel">Preferred Communication <span className="text-destructive">*</span></Label>
            <Select
              id="communication_channel"
              options={COMMUNICATION_OPTIONS}
              placeholder="Select channel"
              error={errors.communication_channel?.message}
              {...register('communication_channel', { required: 'Please select a communication channel' })}
            />
            {errors.communication_channel && <p className="text-sm text-destructive">{errors.communication_channel.message}</p>}
          </div>

          {commChannel === 'slack' && (
            <div className="space-y-2">
              <Label htmlFor="slack_url">Slack Workspace URL</Label>
              <Input
                id="slack_url"
                placeholder="https://yourteam.slack.com"
                {...register('slack_url')}
              />
              <p className="text-sm text-muted-foreground">We will create a shared Slack channel for updates.</p>
            </div>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="referral_source">How did you hear about Cursive?</Label>
            <Select
              id="referral_source"
              options={HOW_HEARD_OPTIONS}
              placeholder="Select source"
              {...register('referral_source')}
            />
          </div>

          {howHeard === 'referral' && (
            <div className="space-y-2">
              <Label htmlFor="referral_detail">Referral Source</Label>
              <Input
                id="referral_detail"
                placeholder="Who referred you?"
                {...register('referral_detail')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
