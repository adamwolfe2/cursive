'use client'

import { Badge } from '@/components/ui/badge'
import type { CampaignFormData } from '../campaign-wizard'

interface StepReviewProps {
  formData: CampaignFormData
}

export function StepReview({ formData }: StepReviewProps) {
  const totalDays =
    formData.days_between_steps.length > 0
      ? formData.days_between_steps.reduce((sum, d) => sum + d, 0)
      : 0

  return (
    <div className="space-y-6">
      {/* Campaign Basics */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Campaign Details</h3>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Name</dt>
            <dd className="text-sm font-medium text-foreground">{formData.name}</dd>
          </div>
          {formData.description && (
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Description</dt>
              <dd className="text-sm text-foreground max-w-xs text-right">{formData.description}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">AI Agent</dt>
            <dd className="text-sm text-foreground">
              {formData.agent_id ? 'Assigned' : 'None (manual replies)'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Targeting */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Targeting</h3>
        {formData.target_industries.length === 0 &&
        formData.target_company_sizes.length === 0 &&
        formData.target_seniorities.length === 0 &&
        formData.target_regions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No targeting filters (all leads)</p>
        ) : (
          <div className="space-y-3">
            {formData.target_industries.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Industries</p>
                <div className="flex flex-wrap gap-1">
                  {formData.target_industries.map((i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {formData.target_company_sizes.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Company Sizes</p>
                <div className="flex flex-wrap gap-1">
                  {formData.target_company_sizes.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {formData.target_seniorities.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Seniority Levels</p>
                <div className="flex flex-wrap gap-1">
                  {formData.target_seniorities.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {formData.target_regions.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Regions</p>
                <div className="flex flex-wrap gap-1">
                  {formData.target_regions.map((r) => (
                    <Badge key={r} variant="secondary" className="text-xs">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Value Props & Trust Signals */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Messaging</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Value Propositions</p>
            {formData.value_propositions.length === 0 ? (
              <p className="text-sm text-muted-foreground">None specified</p>
            ) : (
              <ul className="text-sm text-foreground space-y-1">
                {formData.value_propositions.map((vp) => (
                  <li key={vp.id} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      <strong>{vp.name}:</strong> {vp.description}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Trust Signals</p>
            {formData.trust_signals.length === 0 ? (
              <p className="text-sm text-muted-foreground">None specified</p>
            ) : (
              <ul className="text-sm text-foreground space-y-1">
                {formData.trust_signals.map((ts) => (
                  <li key={ts.id} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {ts.type.replace('_', ' ')}
                    </Badge>
                    <span>{ts.content}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Templates</h3>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Matching Mode</dt>
            <dd className="text-sm font-medium text-foreground capitalize">
              {formData.matching_mode}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Selected Templates</dt>
            <dd className="text-sm text-foreground">
              {formData.selected_template_ids.length === 0
                ? 'All available templates'
                : `${formData.selected_template_ids.length} templates`}
            </dd>
          </div>
        </dl>
      </div>

      {/* Sequence */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Sequence</h3>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Email Steps</dt>
            <dd className="text-sm font-medium text-foreground">{formData.sequence_steps}</dd>
          </div>
          {formData.sequence_steps > 1 && (
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Total Duration</dt>
              <dd className="text-sm text-foreground">{totalDays} days</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-sm text-muted-foreground">Scheduled Start</dt>
            <dd className="text-sm text-foreground">
              {formData.scheduled_start_at
                ? new Date(formData.scheduled_start_at).toLocaleString()
                : 'After approval'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Review Notice */}
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-amber-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Human Review Required
            </h4>
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-300">
              This campaign will be created in <strong>draft</strong> status. You'll need to review
              and approve it before any emails are sent. All AI-generated content will also require
              human approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
