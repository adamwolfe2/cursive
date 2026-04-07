'use client'

/**
 * Outbound Workflow Setup Form
 * ----------------------------
 * Used by /outbound/new and /outbound/[id]/edit. Three textareas (ICP, persona,
 * product) plus a name + tone + cap_per_run. The "Generate ICP" button calls
 * /api/outbound/icp/generate to fill in industries/seniority/etc.
 *
 * Pattern: react-hook-form + Zod, mirroring `new-agent-form.tsx`.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Sparkles, AlertCircle, CheckCircle2, Rocket } from 'lucide-react'
import type { OutboundAgent, OutboundFilters, IcpGenerationResult, SeniorityLevel } from '@/types/outbound'

const setupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  product_text: z.string().min(10, 'Describe what you sell (min 10 chars)').max(4000),
  icp_text: z.string().max(8000).optional(),
  persona_text: z.string().max(8000).optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'formal']),
  cap_per_run: z.coerce.number().int().min(1, 'Min 1').max(100, 'Max 100'),
})

type SetupFormData = z.infer<typeof setupSchema>

export interface SetupFormProps {
  mode: 'create' | 'edit'
  initialAgent?: OutboundAgent
}

export function SetupForm({ mode, initialAgent }: SetupFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [generatingIcp, setGeneratingIcp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedFilters, setGeneratedFilters] = useState<Partial<IcpGenerationResult> | null>(
    initialAgent?.outbound_filters
      ? {
          industries: (initialAgent.outbound_filters as { industries?: string[] }).industries,
          seniority_levels: (initialAgent.outbound_filters as { seniority_levels?: SeniorityLevel[] }).seniority_levels,
          states: (initialAgent.outbound_filters as { states?: string[] }).states,
          job_titles: (initialAgent.outbound_filters as { job_titles?: string[] }).job_titles,
          company_sizes: (initialAgent.outbound_filters as { company_sizes?: string[] }).company_sizes,
          departments: (initialAgent.outbound_filters as { departments?: string[] }).departments,
        }
      : null
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    mode: 'onBlur',
    defaultValues: {
      name: initialAgent?.name ?? '',
      product_text: initialAgent?.product_text ?? '',
      icp_text: initialAgent?.icp_text ?? '',
      persona_text: initialAgent?.persona_text ?? '',
      tone: ((initialAgent?.tone as SetupFormData['tone']) ?? 'professional'),
      cap_per_run: ((initialAgent?.outbound_filters as { cap_per_run?: number })?.cap_per_run ?? 25),
    },
  })

  const productText = watch('product_text')

  const handleGenerateIcp = async () => {
    if (!productText || productText.trim().length < 10) {
      setError('Please describe what you sell first (at least 10 characters).')
      return
    }
    setError(null)
    setGeneratingIcp(true)
    try {
      const response = await fetch('/api/outbound/icp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_text: productText }),
      })
      if (!response.ok) {
        const j = await response.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to generate ICP')
      }
      const { data } = await response.json() as { data: IcpGenerationResult }

      setValue('icp_text', data.icp_summary, { shouldValidate: true })
      setValue('persona_text', data.persona_summary, { shouldValidate: true })
      setGeneratedFilters({
        industries: data.industries,
        seniority_levels: data.seniority_levels,
        states: data.states,
        job_titles: data.job_titles,
        company_sizes: data.company_sizes,
        departments: data.departments,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ICP')
    } finally {
      setGeneratingIcp(false)
    }
  }

  const onSubmit = async (data: SetupFormData) => {
    setSubmitting(true)
    setError(null)
    try {
      const filters: OutboundFilters = {
        industries: generatedFilters?.industries,
        seniority_levels: generatedFilters?.seniority_levels as SeniorityLevel[] | undefined,
        states: generatedFilters?.states,
        job_titles: generatedFilters?.job_titles,
        company_sizes: generatedFilters?.company_sizes,
        departments: generatedFilters?.departments,
        cap_per_run: data.cap_per_run,
      }

      // Strip undefined arrays
      Object.keys(filters).forEach(k => {
        if ((filters as any)[k] === undefined) delete (filters as any)[k]
      })

      const url =
        mode === 'create'
          ? '/api/outbound/workflows'
          : `/api/outbound/workflows/${initialAgent!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          icp_text: data.icp_text || null,
          persona_text: data.persona_text || null,
          product_text: data.product_text,
          tone: data.tone,
          outbound_filters: filters,
        }),
      })

      if (!response.ok) {
        const j = await response.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to save workflow')
      }
      const { data: created } = await response.json() as { data: OutboundAgent }
      router.push(`/outbound/${created.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={mode === 'create' ? 'New Outbound Workflow' : 'Edit Workflow'}
        description={
          mode === 'create'
            ? 'Define your ICP and let Cursive prospect, enrich, and draft emails for you.'
            : 'Update your workflow settings.'
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Outbound Agent', href: '/outbound' },
          { label: mode === 'create' ? 'New' : 'Edit' },
        ]}
      />

      <Card className="max-w-3xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name */}
          <FormField error={errors.name?.message}>
            <FormLabel htmlFor="name" required>Workflow name</FormLabel>
            <FormInput
              id="name"
              type="text"
              placeholder="e.g., Enterprise Software VPs"
              disabled={submitting}
              error={errors.name}
              {...register('name')}
            />
          </FormField>

          {/* What you're selling */}
          <FormField error={errors.product_text?.message}>
            <FormLabel htmlFor="product_text" required hint="Describe your product or service in 1-3 sentences. Used to generate the ICP and write the cold emails.">
              What are you selling?
            </FormLabel>
            <FormTextarea
              id="product_text"
              rows={3}
              placeholder="e.g., We sell autonomous SDR software that prospects, enriches, and emails B2B SaaS leads on autopilot."
              disabled={submitting}
              error={errors.product_text}
              {...register('product_text')}
            />
          </FormField>

          {/* AI generate button */}
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">AI-generate your ICP</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cursive uses Claude to extract industries, seniority levels, and target titles from your product description.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateIcp}
                loading={generatingIcp}
                disabled={submitting || generatingIcp || !productText || productText.length < 10}
                className="mt-3"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                {generatingIcp ? 'Generating…' : 'Generate ICP'}
              </Button>
            </div>
          </div>

          {/* ICP */}
          <FormField error={errors.icp_text?.message}>
            <FormLabel htmlFor="icp_text" optional hint="Plain-English description of your target customer.">
              Ideal Customer Profile (ICP)
            </FormLabel>
            <FormTextarea
              id="icp_text"
              rows={3}
              placeholder="e.g., Series A-C B2B SaaS companies in the US with 50-500 employees, where the VP of Sales owns pipeline."
              disabled={submitting}
              error={errors.icp_text}
              {...register('icp_text')}
            />
          </FormField>

          {/* Persona */}
          <FormField error={errors.persona_text?.message}>
            <FormLabel htmlFor="persona_text" optional hint="Who specifically inside the target company?">
              Buyer Persona
            </FormLabel>
            <FormTextarea
              id="persona_text"
              rows={3}
              placeholder="e.g., VPs of Sales who own quota and care about pipeline efficiency. They're frustrated by SDRs missing quota and tired of hiring."
              disabled={submitting}
              error={errors.persona_text}
              {...register('persona_text')}
            />
          </FormField>

          {/* Generated filter chips */}
          {generatedFilters && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                AudienceLab filters
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                These will be sent to AudienceLab when you click Run.
              </p>
              <div className="mt-3 space-y-2">
                {generatedFilters.industries?.length ? (
                  <FilterChipRow label="Industries" values={generatedFilters.industries} variant="info" />
                ) : null}
                {generatedFilters.seniority_levels?.length ? (
                  <FilterChipRow label="Seniority" values={generatedFilters.seniority_levels} variant="muted" />
                ) : null}
                {generatedFilters.job_titles?.length ? (
                  <FilterChipRow label="Job Titles" values={generatedFilters.job_titles} variant="muted" />
                ) : null}
                {generatedFilters.states?.length ? (
                  <FilterChipRow label="States" values={generatedFilters.states} variant="muted" />
                ) : null}
                {generatedFilters.company_sizes?.length ? (
                  <FilterChipRow label="Company Size" values={generatedFilters.company_sizes} variant="muted" />
                ) : null}
                {generatedFilters.departments?.length ? (
                  <FilterChipRow label="Departments" values={generatedFilters.departments} variant="muted" />
                ) : null}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Tone */}
            <FormField error={errors.tone?.message}>
              <FormLabel htmlFor="tone" required>Email tone</FormLabel>
              <FormSelect id="tone" disabled={submitting} error={errors.tone} {...register('tone')}>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </FormSelect>
            </FormField>

            {/* Cap per run */}
            <FormField error={errors.cap_per_run?.message}>
              <FormLabel htmlFor="cap_per_run" required hint="Max leads per Run click. Each lead costs 0.5 credits.">
                Leads per run
              </FormLabel>
              <FormInput
                id="cap_per_run"
                type="number"
                min={1}
                max={100}
                disabled={submitting}
                error={errors.cap_per_run}
                {...register('cap_per_run')}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/outbound')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              <Rocket className="h-4 w-4 mr-1.5" />
              {mode === 'create' ? 'Create Workflow' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  )
}

function FilterChipRow({
  label,
  values,
  variant,
}: {
  label: string
  values: string[]
  variant: 'info' | 'muted'
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground min-w-[90px]">{label}:</span>
      {values.map(v => (
        <Badge key={v} variant={variant} className="text-xs">
          {v}
        </Badge>
      ))}
    </div>
  )
}
