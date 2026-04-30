'use client'

import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SampleStreamPerson } from '@/lib/copilot/types'
import type { UnmaskedSamplePerson } from './SampleLeadList'

type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+'
type UseCase = 'cold_email' | 'paid_ads' | 'direct_mail' | 'enrichment' | 'other'
type Timeline = 'this_week' | 'this_month' | 'exploring'

interface QualifierAnswers {
  company_size: CompanySize
  use_case: UseCase
  timeline: Timeline
}

interface QualifierSuccessData {
  revealedCount: number
  reveals: UnmaskedSamplePerson[]
  stillMasked: SampleStreamPerson[]
}

interface QualifierModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sampleViewId: string
  token: string
  onSuccess: (data: QualifierSuccessData) => void
}

const COMPANY_SIZE_OPTIONS: Array<{ value: CompanySize; label: string }> = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '500+', label: '500+' },
]

const USE_CASE_OPTIONS: Array<{ value: UseCase; label: string }> = [
  { value: 'cold_email', label: 'Cold email' },
  { value: 'paid_ads', label: 'Paid ads' },
  { value: 'direct_mail', label: 'Direct mail' },
  { value: 'enrichment', label: 'Enrichment' },
  { value: 'other', label: 'Other' },
]

const TIMELINE_OPTIONS: Array<{ value: Timeline; label: string }> = [
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'exploring', label: 'Just exploring' },
]

export function QualifierModal({
  open,
  onOpenChange,
  sampleViewId,
  token,
  onSuccess,
}: QualifierModalProps) {
  const [companySize, setCompanySize] = useState<CompanySize | null>(null)
  const [useCase, setUseCase] = useState<UseCase | null>(null)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset the modal whenever it closes
  useEffect(() => {
    if (!open) {
      setCompanySize(null)
      setUseCase(null)
      setTimeline(null)
      setIsSubmitting(false)
      setError(null)
    }
  }, [open])

  const canSubmit =
    Boolean(companySize) &&
    Boolean(useCase) &&
    Boolean(timeline) &&
    !isSubmitting

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !companySize || !useCase || !timeline) return

    setIsSubmitting(true)
    setError(null)

    const answers: QualifierAnswers = {
      company_size: companySize,
      use_case: useCase,
      timeline,
    }

    try {
      const res = await fetch('/api/public/copilot/reveal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sample_view_id: sampleViewId,
          trigger: 'qualifier',
          qualifier_answers: answers,
        }),
      })

      if (!res.ok) {
        let message = `Unlock failed (${res.status}). Please try again.`
        try {
          const body = await res.json()
          if (body?.message) message = body.message
        } catch {
          /* noop */
        }
        setError(message)
        return
      }

      const data = await res.json()

      if (!data?.success) {
        setError('Something went wrong. Please try again.')
        return
      }

      onSuccess({
        revealedCount: Number(data.revealed_count ?? 0),
        reveals: Array.isArray(data.reveals) ? data.reveals : [],
        stillMasked: Array.isArray(data.still_masked) ? data.still_masked : [],
      })
      onOpenChange(false)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    canSubmit,
    companySize,
    useCase,
    timeline,
    sampleViewId,
    token,
    onSuccess,
    onOpenChange,
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-white">
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <DialogTitle className="text-base font-semibold text-[#0F172A]">
            Quick qualifier — unlock 5 more leads
          </DialogTitle>
          <p className="mt-1 text-[13px] text-slate-500">
            Takes 15 seconds. No email followups unless you ask.
          </p>
        </div>

        <div className="space-y-5 px-6 py-5">
          <QuestionGroup
            label="How big is your company?"
            options={COMPANY_SIZE_OPTIONS}
            value={companySize}
            onChange={setCompanySize}
            name="company_size"
          />

          <QuestionGroup
            label="What are you using this audience for?"
            options={USE_CASE_OPTIONS}
            value={useCase}
            onChange={setUseCase}
            name="use_case"
          />

          <QuestionGroup
            label="When do you want to launch?"
            options={TIMELINE_OPTIONS}
            value={timeline}
            onChange={setTimeline}
            name="timeline"
          />
        </div>

        {error && (
          <div className="mx-6 mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/40 px-6 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Unlocking…
              </>
            ) : (
              <>
                Unlock 5 more leads
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Pill-style radio group ────────────────────────────────────────────

interface QuestionGroupProps<T extends string> {
  label: string
  options: Array<{ value: T; label: string }>
  value: T | null
  onChange: (v: T) => void
  name: string
}

function QuestionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  name,
}: QuestionGroupProps<T>) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-[#0F172A]">{label}</p>
      <div
        className="flex flex-wrap gap-1.5"
        role="radiogroup"
        aria-label={label}
      >
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={`${name}-${opt.value}`}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
