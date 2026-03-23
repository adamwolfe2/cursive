'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import type { ClientData } from './types'

// ---------------------------------------------------------------------------
// Claude Sonnet 4 pricing (per token)
// ---------------------------------------------------------------------------

const SONNET_INPUT_PRICE = 3 / 1_000_000  // $3 per 1M input tokens
const SONNET_OUTPUT_PRICE = 15 / 1_000_000 // $15 per 1M output tokens

// Estimated token counts per pipeline step
const STEP_ESTIMATES = {
  enrichment: { inputTokens: 2500, outputTokens: 3000, label: 'ICP Enrichment + Copy Research' },
  angle_selection: { inputTokens: 2000, outputTokens: 1500, label: 'Angle Selection' },
  copy_generation: { inputTokens: 4000, outputTokens: 5000, label: 'Copy Writing (3 sequences)' },
  auto_fix: { inputTokens: 3000, outputTokens: 4000, label: 'Auto-Fix (if quality issues)' },
  copy_regeneration: { inputTokens: 5000, outputTokens: 5000, label: 'Copy Regeneration (on feedback)' },
  ai_intake_parse: { inputTokens: 3000, outputTokens: 2000, label: 'AI Intake Parsing' },
} as const

function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * SONNET_INPUT_PRICE) + (outputTokens * SONNET_OUTPUT_PRICE)
}

// ---------------------------------------------------------------------------
// Per-client cost estimation
// ---------------------------------------------------------------------------

interface ClientCost {
  id: string
  company_name: string
  created_at: string
  status: string
  steps: Array<{ step: string; label: string; cost: number; ran: boolean }>
  totalCost: number
  intake_source: string
}

function estimateClientCosts(client: ClientData): ClientCost {
  const log = client.automation_log || []
  const steps: ClientCost['steps'] = []

  // Check which steps ran
  const enrichmentRan = log.some((e) => e.step === 'enrichment' && e.status === 'complete')
  const copyRan = log.some((e) => e.step === 'copy_generation' && e.status === 'complete')
  const regenRan = log.some((e) => e.step === 'copy_regeneration' && e.status === 'complete')
  const isInternalIntake = client.intake_source === 'internal_intake'

  // AI intake parsing (internal intake only)
  if (isInternalIntake) {
    const est = STEP_ESTIMATES.ai_intake_parse
    steps.push({
      step: 'ai_intake_parse',
      label: est.label,
      cost: estimateCost(est.inputTokens, est.outputTokens),
      ran: true,
    })
  }

  // Enrichment
  const enrichEst = STEP_ESTIMATES.enrichment
  steps.push({
    step: 'enrichment',
    label: enrichEst.label,
    cost: estimateCost(enrichEst.inputTokens, enrichEst.outputTokens),
    ran: enrichmentRan,
  })

  // Angle selection (only if copy was generated)
  if (copyRan || client.copy_generation_status === 'complete') {
    const angleEst = STEP_ESTIMATES.angle_selection
    steps.push({
      step: 'angle_selection',
      label: angleEst.label,
      cost: estimateCost(angleEst.inputTokens, angleEst.outputTokens),
      ran: copyRan,
    })

    const copyEst = STEP_ESTIMATES.copy_generation
    steps.push({
      step: 'copy_generation',
      label: copyEst.label,
      cost: estimateCost(copyEst.inputTokens, copyEst.outputTokens),
      ran: copyRan,
    })

    // Assume 30% of runs need auto-fix
    const fixEst = STEP_ESTIMATES.auto_fix
    steps.push({
      step: 'auto_fix',
      label: fixEst.label,
      cost: estimateCost(fixEst.inputTokens, fixEst.outputTokens) * 0.3,
      ran: copyRan,
    })
  }

  // Regeneration
  if (regenRan) {
    const regenEst = STEP_ESTIMATES.copy_regeneration
    steps.push({
      step: 'copy_regeneration',
      label: regenEst.label,
      cost: estimateCost(regenEst.inputTokens, regenEst.outputTokens),
      ran: true,
    })
  }

  const totalCost = steps.filter((s) => s.ran).reduce((sum, s) => sum + s.cost, 0)

  return {
    id: client.id,
    company_name: client.company_name,
    created_at: client.created_at,
    status: client.status,
    steps,
    totalCost,
    intake_source: client.intake_source || 'client_form',
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CostDashboard({ clients }: { clients: ClientData[] }) {
  const clientCosts = useMemo(() => clients.map(estimateClientCosts), [clients])

  const totalSpend = useMemo(
    () => clientCosts.reduce((sum, c) => sum + c.totalCost, 0),
    [clientCosts]
  )

  const thisMonthClients = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return clientCosts.filter((c) => new Date(c.created_at) >= monthStart)
  }, [clientCosts])

  const thisMonthSpend = thisMonthClients.reduce((sum, c) => sum + c.totalCost, 0)

  // Per-step cost breakdown (reference pricing)
  const stepBreakdown = useMemo(() => {
    return Object.entries(STEP_ESTIMATES).map(([key, est]) => ({
      step: key,
      label: est.label,
      inputTokens: est.inputTokens,
      outputTokens: est.outputTokens,
      cost: estimateCost(est.inputTokens, est.outputTokens),
    }))
  }, [])

  // Full pipeline cost estimate
  const fullPipelineCost = useMemo(() => {
    const { enrichment, angle_selection, copy_generation, auto_fix } = STEP_ESTIMATES
    return (
      estimateCost(enrichment.inputTokens, enrichment.outputTokens) +
      estimateCost(angle_selection.inputTokens, angle_selection.outputTokens) +
      estimateCost(copy_generation.inputTokens, copy_generation.outputTokens) +
      estimateCost(auto_fix.inputTokens, auto_fix.outputTokens) * 0.3
    )
  }, [])

  const avgCostPerClient = clientCosts.length > 0 ? totalSpend / clientCosts.length : 0

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500">Total Est. API Spend</p>
            <p className="text-2xl font-bold text-gray-900">${totalSpend.toFixed(2)}</p>
            <p className="text-[10px] text-gray-400">{clientCosts.length} clients</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500">This Month</p>
            <p className="text-2xl font-bold text-gray-900">${thisMonthSpend.toFixed(2)}</p>
            <p className="text-[10px] text-gray-400">{thisMonthClients.length} clients</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500">Avg Cost / Client</p>
            <p className="text-2xl font-bold text-gray-900">${avgCostPerClient.toFixed(3)}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500">Full Pipeline Cost</p>
            <p className="text-2xl font-bold text-green-700">${fullPipelineCost.toFixed(3)}</p>
            <p className="text-[10px] text-gray-400">per client (est.)</p>
          </div>
        </Card>
      </div>

      {/* Projections */}
      <Card padding="sm">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Monthly Projections</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[25, 50, 100, 200].map((count) => (
              <div key={count} className="text-center">
                <p className="text-xs text-gray-500">{count} clients/mo</p>
                <p className="text-lg font-bold text-gray-900">
                  ${(fullPipelineCost * count).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Per-step reference pricing */}
      <Card padding="sm">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Cost Per Pipeline Step (Claude Sonnet 4)
          </h2>
          <p className="text-[10px] text-gray-400 mb-3">
            Input: ${(SONNET_INPUT_PRICE * 1_000_000).toFixed(0)}/1M tokens | Output: ${(SONNET_OUTPUT_PRICE * 1_000_000).toFixed(0)}/1M tokens
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="py-2 pr-4">Step</th>
                  <th className="py-2 pr-4 text-right">Input Tokens</th>
                  <th className="py-2 pr-4 text-right">Output Tokens</th>
                  <th className="py-2 text-right">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {stepBreakdown.map((step) => (
                  <tr key={step.step} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-700">{step.label}</td>
                    <td className="py-2 pr-4 text-right text-gray-500">
                      {step.inputTokens.toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-500">
                      {step.outputTokens.toLocaleString()}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      ${step.cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Per-client breakdown */}
      <Card padding="sm">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Per-Client Cost Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Steps Run</th>
                  <th className="py-2 text-right">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {clientCosts.map((client) => {
                  const stepsRun = client.steps.filter((s) => s.ran).length
                  return (
                    <tr key={client.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium text-gray-700">
                        <a
                          href={`/admin/onboarding/${client.id}`}
                          className="hover:text-blue-600"
                        >
                          {client.company_name}
                        </a>
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-500">
                        {client.intake_source === 'internal_intake' ? 'Internal' : 'Client Form'}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                          {client.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right text-gray-500">{stepsRun}</td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        ${client.totalCost.toFixed(4)}
                      </td>
                    </tr>
                  )
                })}
                {clientCosts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      No clients onboarded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Optimization tips */}
      <Card padding="sm">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Optimization Opportunities</h2>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
            <li>
              <strong>Switch to Haiku 4.5</strong> for AI intake parsing and angle selection
              (~3x cheaper, 90% quality for structured extraction tasks)
            </li>
            <li>
              <strong>Cache template enrichments</strong> — if 4+ clients share the same ICP template,
              cache the copy_research portion and skip re-enrichment
            </li>
            <li>
              <strong>Reduce auto-fix rate</strong> — improve the copy generation prompt to
              reduce quality check failures below 20% (currently ~30%)
            </li>
            <li>
              <strong>Batch enrichment</strong> — group clients onboarded in the same day and
              batch API calls to reduce overhead
            </li>
            <li>
              <strong>Monitor token usage</strong> — add actual token counting from Claude API
              response headers to replace these estimates with real data
            </li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
