'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import type { AutoresearchProgram } from '@/types/autoresearch'

const configSchema = z.object({
  targetNiche: z.string().min(1, 'Target niche is required'),
  targetPersona: z.string().min(1, 'Target persona is required'),
  testDurationHours: z.number().int().min(1).max(720),
  minSampleSize: z.number().int().min(10).max(10000),
  maxVariantsPerExperiment: z.number().int().min(2).max(10),
  successMetric: z.enum(['positive_reply_rate', 'reply_rate', 'open_rate']),
  autoApplyWinner: z.boolean(),
  baselineSubject: z.string().min(1, 'Baseline subject is required'),
  baselineBody: z.string().min(1, 'Baseline body is required'),
  emailbisonCampaignId: z.string().optional(),
})

type ConfigFormValues = z.infer<typeof configSchema>

interface Props {
  program: AutoresearchProgram
}

const METRIC_OPTIONS = [
  { value: 'positive_reply_rate', label: 'Positive Reply Rate' },
  { value: 'reply_rate', label: 'Total Reply Rate' },
  { value: 'open_rate', label: 'Open Rate' },
]

export default function ProgramConfigForm({ program }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      targetNiche: program.config.targetNiche,
      targetPersona: program.config.targetPersona,
      testDurationHours: program.config.testDurationHours,
      minSampleSize: program.config.minSampleSize,
      maxVariantsPerExperiment: program.config.maxVariantsPerExperiment,
      successMetric: program.config.successMetric,
      autoApplyWinner: program.config.autoApplyWinner,
      baselineSubject: program.baseline_subject ?? '',
      baselineBody: program.baseline_body ?? '',
      emailbisonCampaignId: program.emailbison_campaign_id ?? '',
    },
  })

  const onSubmit = async (values: ConfigFormValues) => {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch(`/api/autoresearch/programs/${program.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...program.config,
            targetNiche: values.targetNiche,
            targetPersona: values.targetPersona,
            testDurationHours: values.testDurationHours,
            minSampleSize: values.minSampleSize,
            maxVariantsPerExperiment: values.maxVariantsPerExperiment,
            successMetric: values.successMetric,
            autoApplyWinner: values.autoApplyWinner,
          },
          baseline_subject: values.baselineSubject,
          baseline_body: values.baselineBody,
          emailbison_campaign_id: values.emailbisonCampaignId || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to save configuration')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4 text-muted-foreground" />
          Program Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Target Niche
              </label>
              <Input
                {...register('targetNiche')}
                placeholder="e.g., B2B SaaS, Healthcare IT"
                error={errors.targetNiche?.message}
              />
              {errors.targetNiche && (
                <p className="text-xs text-destructive mt-1">{errors.targetNiche.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Target Persona
              </label>
              <Input
                {...register('targetPersona')}
                placeholder="e.g., VP of Sales, CTO"
                error={errors.targetPersona?.message}
              />
              {errors.targetPersona && (
                <p className="text-xs text-destructive mt-1">{errors.targetPersona.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Test Duration (hours)
              </label>
              <Input
                type="number"
                {...register('testDurationHours', { valueAsNumber: true })}
                error={errors.testDurationHours?.message}
              />
              {errors.testDurationHours && (
                <p className="text-xs text-destructive mt-1">{errors.testDurationHours.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Min Sample Size
              </label>
              <Input
                type="number"
                {...register('minSampleSize', { valueAsNumber: true })}
                error={errors.minSampleSize?.message}
              />
              {errors.minSampleSize && (
                <p className="text-xs text-destructive mt-1">{errors.minSampleSize.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Max Variants
              </label>
              <Input
                type="number"
                {...register('maxVariantsPerExperiment', { valueAsNumber: true })}
                error={errors.maxVariantsPerExperiment?.message}
              />
              {errors.maxVariantsPerExperiment && (
                <p className="text-xs text-destructive mt-1">{errors.maxVariantsPerExperiment.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Success Metric
              </label>
              <Select
                {...register('successMetric')}
                options={METRIC_OPTIONS}
              />
            </div>
            <div className="flex items-end pb-2">
              <Checkbox
                {...register('autoApplyWinner')}
                label="Auto-apply winner"
                description="Automatically update baseline when a winner is found"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Baseline Subject
            </label>
            <Textarea
              {...register('baselineSubject')}
              rows={2}
              resize="none"
              placeholder="Current email subject line..."
              error={errors.baselineSubject?.message}
            />
            {errors.baselineSubject && (
              <p className="text-xs text-destructive mt-1">{errors.baselineSubject.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Baseline Body
            </label>
            <Textarea
              {...register('baselineBody')}
              rows={5}
              resize="vertical"
              placeholder="Current email body..."
              error={errors.baselineBody?.message}
            />
            {errors.baselineBody && (
              <p className="text-xs text-destructive mt-1">{errors.baselineBody.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              EmailBison Campaign ID
            </label>
            <Input
              {...register('emailbisonCampaignId')}
              placeholder="Optional campaign ID"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {saved && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Configuration saved successfully.
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              Save Configuration
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
