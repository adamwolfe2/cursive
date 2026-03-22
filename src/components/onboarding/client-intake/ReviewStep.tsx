'use client'

import { useFormContext } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PACKAGES, needsOutboundSetup, needsPixelSetup } from '@/types/onboarding'
import type { OnboardingFormData, PendingFile, PackageSlug } from '@/types/onboarding'

interface ReviewStepProps {
  onEditStep: (stepIndex: number) => void
  files: Record<string, PendingFile | null>
}

function SectionHeader({ title, stepIndex, onEdit }: { title: string; stepIndex: number; onEdit: (i: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <CardTitle className="text-base min-w-0 truncate">{title}</CardTitle>
      <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(stepIndex)} className="text-blue-600 hover:text-blue-700 shrink-0">
        Edit
      </Button>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === '' || (Array.isArray(value) && value.length === 0)) return null
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  )
}

function BoolField({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-600">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-300">
          <path fillRule="evenodd" d="M4.28 4.22a.75.75 0 0 0-1.06 1.06L8.94 11l-5.72 5.72a.75.75 0 1 0 1.06 1.06L10 12.06l5.72 5.72a.75.75 0 1 0 1.06-1.06L11.06 11l5.72-5.72a.75.75 0 0 0-1.06-1.06L10 9.94 4.28 4.22Z" clipRule="evenodd" />
        </svg>
      )}
      <span className="text-sm">{label}</span>
    </div>
  )
}

function TagPills({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <span className="text-sm text-muted-foreground">None specified</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Badge key={`${item}-${i}`} variant="default" size="sm">{item}</Badge>
      ))}
    </div>
  )
}

function FileField({ label, file }: { label: string; file: PendingFile | null }) {
  if (!file) return null
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2 text-sm text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-blue-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
        </svg>
        {file.file.name}
      </dd>
    </div>
  )
}

export function ReviewStep({ onEditStep, files }: ReviewStepProps) {
  const { getValues } = useFormContext<OnboardingFormData>()
  const data = getValues()
  const packages = data.packages_selected ?? []
  const showOutbound = needsOutboundSetup(packages)
  const showPixel = needsPixelSetup(packages)

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Review Your Submission</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please review everything below. Click &quot;Edit&quot; on any section to make changes before submitting.
        </p>
      </div>

      {/* Company Info */}
      <Card padding="default">
        <CardHeader>
          <SectionHeader title="Company Info" stepIndex={0} onEdit={onEditStep} />
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company" value={data.company_name} />
            <Field label="Website" value={data.company_website} />
            <Field label="Industry" value={data.industry} />
            <Field label="Contact" value={`${data.primary_contact_name} (${data.primary_contact_email})`} />
            <Field label="Phone" value={data.primary_contact_phone} />
            <Field label="Communication" value={data.communication_channel} />
            {data.billing_contact_name && <Field label="Billing Contact" value={`${data.billing_contact_name} (${data.billing_contact_email})`} />}
            <Field label="Referral Source" value={data.referral_source} />
          </dl>
        </CardContent>
      </Card>

      {/* Packages */}
      <Card padding="default">
        <CardHeader>
          <SectionHeader title="Packages" stepIndex={1} onEdit={onEditStep} />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {packages.map((slug: PackageSlug) => (
              <Badge key={slug} variant="default" size="lg">{PACKAGES[slug]?.label ?? slug}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commercial */}
      <Card padding="default">
        <CardHeader>
          <SectionHeader title="Commercial Details" stepIndex={2} onEdit={onEditStep} />
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Setup Fee" value={data.setup_fee != null ? `$${data.setup_fee}` : undefined} />
            <Field label="Recurring Fee" value={data.recurring_fee != null ? `$${data.recurring_fee}` : undefined} />
            <Field label="Billing Cadence" value={data.billing_cadence} />
            <Field label="Payment Method" value={data.payment_method} />
            {showOutbound && <Field label="Outbound Tier" value={data.outbound_tier} />}
          </dl>
        </CardContent>
      </Card>

      {/* ICP */}
      <Card padding="default">
        <CardHeader>
          <SectionHeader title="Ideal Customer Profile" stepIndex={3} onEdit={onEditStep} />
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <Field label="ICP Description" value={data.icp_description} />
            <div className="space-y-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Target Industries</dt>
              <dd><TagPills items={data.target_industries} /></dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Target Titles</dt>
              <dd><TagPills items={data.target_titles} /></dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Company Sizes</dt>
              <dd><TagPills items={data.target_company_sizes} /></dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Geography</dt>
              <dd><TagPills items={data.target_geography} /></dd>
            </div>
            <Field label="Pain Points" value={data.pain_points} />
            <div className="space-y-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Intent Keywords</dt>
              <dd><TagPills items={data.intent_keywords} /></dd>
            </div>
            <div className="space-y-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Competitors</dt>
              <dd><TagPills items={data.competitor_names} /></dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Email Setup */}
      {showOutbound && (
        <Card padding="default">
          <CardHeader>
            <SectionHeader title="Email Setup" stepIndex={4} onEdit={onEditStep} />
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Sending Volume" value={data.sending_volume} />
              <Field label="Lead Volume" value={data.lead_volume} />
              <Field label="Timeline" value={data.start_timeline} />
              <Field label="Sender Names" value={data.sender_names} />
              <Field label="Domain Variations" value={data.domain_variations} />
              <Field label="Provider" value={data.domain_provider} />
              <Field label="Tone" value={data.copy_tone} />
              <Field label="Primary CTA" value={data.primary_cta} />
              <Field label="Calendar Link" value={data.calendar_link} />
              <Field label="Reply Routing" value={data.reply_routing_email} />
            </dl>
            <FileField label="Email Examples" file={files.examples ?? null} />
          </CardContent>
        </Card>
      )}

      {/* Pixel Setup */}
      {showPixel && (
        <Card padding="default">
          <CardHeader>
            <SectionHeader title="Pixel Setup" stepIndex={showOutbound ? 5 : 4} onEdit={onEditStep} />
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Website URLs" value={data.pixel_urls} />
              <Field label="Uses GTM" value={data.uses_gtm} />
              <Field label="GTM Container" value={data.gtm_container_id} />
              <Field label="Installer" value={data.pixel_installer} />
              <Field label="Traffic Volume" value={data.monthly_traffic} />
              <Field label="Refresh Frequency" value={data.audience_refresh} />
              <div className="sm:col-span-2 space-y-0.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Delivery Methods</dt>
                <dd><TagPills items={data.pixel_delivery} /></dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Use Case */}
      <Card padding="default">
        <CardHeader>
          <SectionHeader
            title="Use Case & Delivery"
            stepIndex={(() => {
              let idx = 4
              if (showOutbound) idx++
              if (showPixel) idx++
              return idx
            })()}
            onEdit={onEditStep}
          />
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="space-y-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data Use Cases</dt>
              <dd><TagPills items={data.data_use_cases} /></dd>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CRM" value={data.primary_crm} />
              <Field label="Data Format" value={data.data_format} />
              <Field label="Audience Count" value={data.audience_count} />
              <Field label="Existing List" value={data.has_existing_list} />
            </div>
            <FileField label="Existing List File" file={files.existing_list ?? null} />
          </dl>
        </CardContent>
      </Card>

      {/* Content Approvals */}
      <Card padding="default">
        <CardHeader>
          <SectionHeader
            title="Content & Approvals"
            stepIndex={(() => {
              let idx = 5
              if (showOutbound) idx++
              if (showPixel) idx++
              return idx
            })()}
            onEdit={onEditStep}
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <BoolField label="Email copy approval" value={data.copy_approval} />
            {showOutbound && <BoolField label="Sender identity approval" value={data.sender_identity_approval} />}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FileField label="Brand Guidelines" file={files.brand_guidelines ?? null} />
              <FileField label="Sales Deck" file={files.deck ?? null} />
              <FileField label="Testimonials" file={files.testimonials ?? null} />
              <FileField label="Sample Offers" file={files.sample_offers ?? null} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal */}
      <Card padding="default">
        <CardHeader>
          <SectionHeader
            title="Legal & Sign-off"
            stepIndex={(() => {
              let idx = 6
              if (showOutbound) idx++
              if (showPixel) idx++
              return idx
            })()}
            onEdit={onEditStep}
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <BoolField label="SOW signed" value={data.sow_signed} />
            <BoolField label="Payment confirmed" value={data.payment_confirmed} />
            <BoolField label="Data usage acknowledged" value={data.data_usage_ack} />
            <BoolField label="Privacy terms acknowledged" value={data.privacy_ack} />
            <BoolField label="Billing terms agreed" value={data.billing_terms_ack} />
            {data.additional_notes && (
              <div className="mt-4">
                <Field label="Additional Notes" value={data.additional_notes} />
              </div>
            )}
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Signed by</p>
              <p className="text-lg font-semibold text-[#0F172A]">{data.signature_name}</p>
              <p className="text-sm text-muted-foreground">{data.signature_date}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
