'use client'

import { FormField, FormLabel, FormInput, FormSelect } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { CampaignFormData } from '../campaign-wizard'

interface StepSequenceProps {
  formData: CampaignFormData
  updateFormData: (updates: Partial<CampaignFormData>) => void
}

export function StepSequence({ formData, updateFormData }: StepSequenceProps) {
  const updateDaysBetween = (index: number, value: number) => {
    const newDays = [...formData.days_between_steps]
    newDays[index] = value
    updateFormData({ days_between_steps: newDays })
  }

  const handleStepsChange = (steps: number) => {
    // Adjust days_between_steps array to match new step count
    const currentDays = formData.days_between_steps
    const neededIntervals = steps - 1

    let newDays: number[]
    if (neededIntervals <= 0) {
      newDays = []
    } else if (currentDays.length >= neededIntervals) {
      newDays = currentDays.slice(0, neededIntervals)
    } else {
      // Add more intervals with default value of 3
      newDays = [...currentDays]
      while (newDays.length < neededIntervals) {
        newDays.push(3)
      }
    }

    updateFormData({
      sequence_steps: steps,
      days_between_steps: newDays,
    })
  }

  return (
    <div className="space-y-6">
      {/* Number of Steps */}
      <FormField>
        <FormLabel htmlFor="sequence_steps" required>
          Number of Email Steps
        </FormLabel>
        <FormSelect
          id="sequence_steps"
          value={formData.sequence_steps.toString()}
          onChange={(e) => handleStepsChange(parseInt(e.target.value, 10))}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'email' : 'emails'}
            </option>
          ))}
        </FormSelect>
        <p className="mt-1 text-xs text-muted-foreground">
          How many emails in the sequence (including initial email and follow-ups)
        </p>
      </FormField>

      {/* Days Between Steps */}
      {formData.sequence_steps > 1 && (
        <div>
          <FormLabel>Days Between Each Email</FormLabel>
          <p className="mb-3 text-xs text-muted-foreground">
            Set the waiting period before each follow-up email
          </p>
          <div className="space-y-3">
            {formData.days_between_steps.map((days, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[140px]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>to</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {index + 2}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FormInput
                    type="number"
                    min={1}
                    max={30}
                    value={days}
                    onChange={(e) => updateDaysBetween(index, parseInt(e.target.value, 10) || 1)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Start */}
      <FormField>
        <FormLabel htmlFor="scheduled_start_at">Schedule Start (Optional)</FormLabel>
        <FormInput
          id="scheduled_start_at"
          type="datetime-local"
          value={formData.scheduled_start_at || ''}
          onChange={(e) => updateFormData({ scheduled_start_at: e.target.value || undefined })}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Leave empty to start sending after approval. Emails will only send during business hours.
        </p>
      </FormField>

      {/* Visual Timeline */}
      <div className="rounded-lg bg-muted p-4">
        <h4 className="text-sm font-medium text-foreground mb-4">Campaign Timeline Preview</h4>
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-4">
            {Array.from({ length: formData.sequence_steps }, (_, i) => {
              const dayOffset =
                i === 0
                  ? 0
                  : formData.days_between_steps.slice(0, i).reduce((sum, d) => sum + d, 0)

              return (
                <div key={i} className="relative pl-8">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {i === 0 ? 'Initial Email' : `Follow-up ${i}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dayOffset === 0 ? 'Day 0 (start)' : `Day ${dayOffset}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="rounded-lg border border-border p-4">
        <h4 className="text-sm font-medium text-foreground mb-2">Best Practices</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• 3-5 emails typically works best for cold outreach</li>
          <li>• Space follow-ups 3-7 days apart for optimal response rates</li>
          <li>• First follow-up is the most important - don't wait too long</li>
          <li>• Later follow-ups can be spaced further apart</li>
        </ul>
      </div>
    </div>
  )
}
