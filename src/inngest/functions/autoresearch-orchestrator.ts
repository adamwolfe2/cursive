// Autoresearch Orchestrator — Karpathy Loop
// Chains through experiment lifecycle: generate -> wait -> evaluate -> repeat

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { AutoresearchProgramRepository } from '@/lib/repositories/autoresearch-program.repository'
import { AutoresearchExperimentRepository } from '@/lib/repositories/autoresearch-experiment.repository'
import { AutoresearchResultRepository } from '@/lib/repositories/autoresearch-result.repository'
import { WinningPatternRepository } from '@/lib/repositories/winning-pattern.repository'
import {
  generateExperimentPlan,
  selectNextElement,
  validateVariant,
} from '@/lib/services/autoresearch/variant-generator'
import { classifySentiment } from '@/lib/services/autoresearch/sentiment-classifier'
import { determineWinner } from '@/lib/services/autoresearch/experiment-metrics'
import {
  createVariant,
  createExperiment,
  applyWinner,
} from '@/lib/services/campaign/ab-testing.service'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import type { AutoresearchSentiment } from '@/types/autoresearch'

// ---------------------------------------------------------------------------
// Function 1: Start Autoresearch Program
// ---------------------------------------------------------------------------

export const startAutoresearchProgram = inngest.createFunction(
  {
    id: 'autoresearch-program-start',
    name: 'Start Autoresearch Program',
    retries: 3,
    timeouts: { finish: '2m' },
    onFailure: async ({ error, event }) => {
      const programId = (event?.data?.event?.data as { program_id?: string })?.program_id
      try {
        await sendSlackAlert({
          type: 'inngest_failure',
          severity: 'critical',
          message: `Autoresearch: Program start failed for ${programId ?? 'unknown'}`,
          metadata: {
            program_id: programId ?? 'unknown',
            error: error?.message ?? 'Unknown error',
          },
        })
      } catch {
        // Failure handler must not throw
      }
    },
  },
  { event: 'autoresearch/program.start' },
  async ({ event, step, logger }) => {
    const { program_id, workspace_id } = event.data

    // Step 1: Load and validate the program
    const program = await step.run('load-program', async () => {
      const repo = new AutoresearchProgramRepository()
      const found = await repo.findById(program_id, workspace_id)

      if (!found) {
        throw new Error(`Program ${program_id} not found`)
      }

      if (!found.baseline_subject || !found.baseline_body) {
        throw new Error('Program requires a baseline subject and body before starting')
      }

      if (!found.emailbison_campaign_id && !found.campaign_id) {
        throw new Error('Program requires an EmailBison or internal campaign')
      }

      return found
    })

    // Step 2: Activate the program
    await step.run('activate-program', async () => {
      const repo = new AutoresearchProgramRepository()
      await repo.update(program_id, workspace_id, { status: 'active' })
    })

    logger.info(
      `Autoresearch program ${program_id} activated for workspace ${workspace_id}`
    )

    // Step 3: Kick off first experiment generation
    await step.run('emit-generate-event', async () => {
      await inngest.send({
        name: 'autoresearch/experiment.generate',
        data: { program_id, workspace_id },
      })
    })

    return {
      success: true,
      program_id,
      program_name: program.name,
      status: 'active',
    }
  }
)

// ---------------------------------------------------------------------------
// Function 2: Generate Autoresearch Experiment
// ---------------------------------------------------------------------------

export const generateAutoresearchExperiment = inngest.createFunction(
  {
    id: 'autoresearch-experiment-generate',
    name: 'Generate Autoresearch Experiment',
    retries: 3,
    timeouts: { finish: '5m' },
    onFailure: async ({ error, event }) => {
      const programId = (event?.data?.event?.data as { program_id?: string })?.program_id
      try {
        await sendSlackAlert({
          type: 'system_event',
          severity: 'critical',
          message: 'Autoresearch: Experiment generation failed',
          metadata: {
            program_id: programId ?? 'unknown',
            error: error?.message ?? 'Unknown error',
          },
        })
      } catch {
        // Swallow - failure handler must not throw
      }
    },
  },
  { event: 'autoresearch/experiment.generate' },
  async ({ event, step, logger }) => {
    const { program_id, workspace_id } = event.data

    // Step 1: Load program context and winning patterns
    const { program, winningPatterns } = await step.run('load-context', async () => {
      const programRepo = new AutoresearchProgramRepository()
      const patternRepo = new WinningPatternRepository()

      const [found, patterns] = await Promise.all([
        programRepo.findById(program_id, workspace_id),
        patternRepo.findByProgram(program_id),
      ])

      if (!found) {
        throw new Error(`Program ${program_id} not found`)
      }

      if (found.status !== 'active') {
        throw new Error(`Program ${program_id} is not active (status: ${found.status})`)
      }

      return { program: found, winningPatterns: patterns }
    })

    // Step 2: Select the next element to test
    const elementToTest = await step.run('select-element', async () => {
      return selectNextElement({
        elementRotation: program.config.elementRotation,
        lastElementTested: program.last_element_tested ?? null,
        experimentCount: program.total_experiments_run,
      })
    })

    logger.info(
      `Program ${program_id}: testing element "${elementToTest}" (experiment #${program.total_experiments_run + 1})`
    )

    // Step 3: Generate challenger variants via Claude
    const plan = await step.run('generate-variants', async () => {
      const generated = await generateExperimentPlan({
        program,
        elementToTest,
        winningPatterns,
        variantCount: program.config.maxVariantsPerExperiment ?? 2,
      })

      // Validate each variant
      const validatedVariants = generated.variants.map((v) => {
        const validation = validateVariant(v, program)
        if (!validation.valid) {
          logger.warn(
            `Variant "${v.name}" has quality issues: ${validation.issues.join(', ')}`
          )
        }
        return v
      })

      return { ...generated, variants: validatedVariants }
    })

    // Step 4: Create variants in the A/B testing infrastructure
    const abExperiment = await step.run('create-ab-experiment', async () => {
      const campaignId = program.campaign_id ?? program.emailbison_campaign_id
      if (!campaignId) {
        throw new Error('No campaign ID found on program')
      }

      // Create control variant from baseline
      const controlResult = await createVariant(campaignId, workspace_id, {
        name: 'Control (Baseline)',
        variantKey: 'control',
        subjectTemplate: plan.controlSubject,
        bodyTemplate: plan.controlBody,
        isControl: true,
        weight: Math.floor(100 / (plan.variants.length + 1)),
      })

      if (!controlResult.success || !controlResult.variant) {
        throw new Error(`Failed to create control variant: ${controlResult.error}`)
      }

      // Create challenger variants
      const challengerVariantIds: string[] = []
      const challengerWeight = Math.floor(
        (100 - Math.floor(100 / (plan.variants.length + 1))) / plan.variants.length
      )

      for (const variant of plan.variants) {
        const result = await createVariant(campaignId, workspace_id, {
          name: variant.name,
          variantKey: `challenger-${challengerVariantIds.length + 1}`,
          subjectTemplate: variant.subject,
          bodyTemplate: variant.body,
          isControl: false,
          weight: challengerWeight,
          description: variant.hypothesis,
        })

        if (!result.success || !result.variant) {
          logger.warn(`Failed to create challenger variant "${variant.name}": ${result.error}`)
          continue
        }

        challengerVariantIds.push(result.variant.id)
      }

      if (challengerVariantIds.length === 0) {
        throw new Error('Failed to create any challenger variants')
      }

      // Create the A/B experiment
      const experimentResult = await createExperiment(campaignId, workspace_id, {
        name: `Autoresearch #${program.total_experiments_run + 1}: ${elementToTest}`,
        hypothesis: plan.hypothesis,
        testType: elementToTest === 'subject' ? 'subject' : 'body',
        successMetric: 'reply_rate',
        minimumSampleSize: program.config.minSampleSize,
        confidenceLevel: 95,
      })

      if (!experimentResult.success || !experimentResult.experiment) {
        throw new Error(`Failed to create A/B experiment: ${experimentResult.error}`)
      }

      return {
        abExperimentId: experimentResult.experiment.id,
        controlVariantId: controlResult.variant.id,
        challengerVariantIds,
      }
    })

    // Step 5: Create autoresearch_experiments row
    const experimentNumber = await step.run(
      'create-autoresearch-experiment',
      async () => {
        const experimentRepo = new AutoresearchExperimentRepository()
        const nextNumber = await experimentRepo.getNextExperimentNumber(program_id)

        const variantCopies: Record<string, unknown> = {
          control: {
            subject: plan.controlSubject,
            body: plan.controlBody,
          },
        }

        for (const [idx, variant] of plan.variants.entries()) {
          variantCopies[`challenger-${idx + 1}`] = {
            name: variant.name,
            subject: variant.subject,
            body: variant.body,
            hypothesis: variant.hypothesis,
          }
        }

        const evaluationAt = new Date(
          Date.now() + program.config.testDurationHours * 60 * 60 * 1000
        ).toISOString()

        await experimentRepo.create({
          program_id,
          workspace_id,
          experiment_number: nextNumber,
          hypothesis: plan.hypothesis,
          element_tested: elementToTest,
          status: 'active',
          ab_experiment_id: abExperiment.abExperimentId,
          control_variant_id: abExperiment.controlVariantId,
          challenger_variant_ids: abExperiment.challengerVariantIds,
          started_at: new Date().toISOString(),
          evaluation_at: evaluationAt,
          generation_prompt: plan.hypothesis,
          variant_copies: variantCopies,
        })

        return nextNumber
      }
    )

    // Step 6: Update the program with current experiment info
    await step.run('update-program', async () => {
      const repo = new AutoresearchProgramRepository()
      const experimentRepo = new AutoresearchExperimentRepository()
      const experiments = await experimentRepo.findByProgram(program_id)
      const currentExperiment = experiments.find(
        (e) => e.experiment_number === experimentNumber
      )

      await repo.update(program_id, workspace_id, {
        current_experiment_id: currentExperiment?.id ?? null,
        last_element_tested: elementToTest,
      })
    })

    // Slack: notify that a new experiment has started
    try {
      await sendSlackAlert({
        type: 'system_event',
        severity: 'info',
        message: `Autoresearch: New experiment started for ${program.name}`,
        metadata: {
          hypothesis: plan.hypothesis,
          element_tested: elementToTest,
          variants: `${abExperiment.challengerVariantIds.length} challengers vs control`,
          evaluation_in: `${program.config.testDurationHours || 72}h`,
          experiment_number: experimentNumber,
          program_id,
        },
      })
    } catch {
      // Non-critical: do not break the pipeline if Slack is down
    }

    // Step 7: Wait for test to accumulate results
    const testDurationHours = program.config.testDurationHours || 72
    await step.sleep('wait-for-test-results', `${testDurationHours}h`)

    // Step 8: After sleep, trigger evaluation
    await step.run('emit-evaluate-event', async () => {
      const experimentRepo = new AutoresearchExperimentRepository()
      const experiments = await experimentRepo.findByProgram(program_id)
      const currentExperiment = experiments.find(
        (e) => e.experiment_number === experimentNumber
      )

      if (!currentExperiment) {
        throw new Error('Current experiment not found after sleep')
      }

      await inngest.send({
        name: 'autoresearch/experiment.evaluate',
        data: {
          experiment_id: currentExperiment.id,
          workspace_id,
        },
      })
    })

    return {
      success: true,
      program_id,
      experiment_number: experimentNumber,
      element_tested: elementToTest,
      variants_created: abExperiment.challengerVariantIds.length,
      wait_hours: testDurationHours,
    }
  }
)

// ---------------------------------------------------------------------------
// Function 3: Evaluate Autoresearch Experiment
// ---------------------------------------------------------------------------

export const evaluateAutoresearchExperiment = inngest.createFunction(
  {
    id: 'autoresearch-experiment-evaluate',
    name: 'Evaluate Autoresearch Experiment',
    retries: 3,
    timeouts: { finish: '10m' },
    onFailure: async ({ error, event }) => {
      const experimentId = (event?.data?.event?.data as { experiment_id?: string })?.experiment_id
      try {
        await sendSlackAlert({
          type: 'system_event',
          severity: 'critical',
          message: 'Autoresearch: Experiment evaluation failed',
          metadata: {
            experiment_id: experimentId ?? 'unknown',
            error: error?.message ?? 'Unknown error',
          },
        })
      } catch {
        // Swallow - failure handler must not throw
      }
    },
  },
  { event: 'autoresearch/experiment.evaluate' },
  async ({ event, step, logger }) => {
    const { experiment_id, workspace_id } = event.data

    // Step 1: Load experiment and program
    const { experiment, program } = await step.run('load-experiment', async () => {
      const experimentRepo = new AutoresearchExperimentRepository()
      const programRepo = new AutoresearchProgramRepository()

      const exp = await experimentRepo.findById(experiment_id)
      if (!exp) {
        throw new Error(`Experiment ${experiment_id} not found`)
      }

      const prog = await programRepo.findById(exp.program_id, workspace_id)
      if (!prog) {
        throw new Error(`Program ${exp.program_id} not found`)
      }

      return { experiment: exp, program: prog }
    })

    // Mark experiment as evaluating
    await step.run('mark-evaluating', async () => {
      const experimentRepo = new AutoresearchExperimentRepository()
      await experimentRepo.updateStatus(experiment_id, 'evaluating')
    })

    // Step 2: Sync metrics from email sends and replies
    const variantMetrics = await step.run('sync-metrics', async () => {
      const supabase = createAdminClient()

      const allVariantIds = [
        experiment.control_variant_id,
        ...experiment.challenger_variant_ids,
      ].filter(Boolean) as string[]

      const metricsMap: Record<
        string,
        {
          emails_sent: number
          emails_delivered: number
          emails_bounced: number
          emails_opened: number
          unique_opens: number
          emails_replied: number
          positive_replies: number
          neutral_replies: number
          negative_replies: number
          unsubscribe_replies: number
          ooo_replies: number
          meetings_booked: number
        }
      > = {}

      for (const variantId of allVariantIds) {
        // Get email sends for this variant
        const { data: sends } = await supabase
          .from('email_sends')
          .select('id, status, opened_at, replied_at')
          .eq('variant_id', variantId)

        const emailSends = sends ?? []
        const sent = emailSends.length
        const delivered = emailSends.filter(
          (s: any) => s.status !== 'bounced' && s.status !== 'failed'
        ).length
        const bounced = emailSends.filter((s: any) => s.status === 'bounced').length
        const opened = emailSends.filter((s: any) => s.opened_at).length
        const replied = emailSends.filter((s: any) => s.replied_at).length

        // Get reply sentiments for this variant
        const sendIds = emailSends.map((s: any) => s.id)
        let posReplies = 0
        let neutralReplies = 0
        let negReplies = 0
        let unsubReplies = 0
        let oooReplies = 0

        if (sendIds.length > 0) {
          const { data: replies } = await supabase
            .from('email_replies')
            .select('autoresearch_sentiment')
            .in('email_send_id', sendIds)
            .not('autoresearch_sentiment', 'is', null)

          for (const reply of replies ?? []) {
            const sentiment = reply.autoresearch_sentiment as AutoresearchSentiment
            switch (sentiment) {
              case 'positive':
                posReplies++
                break
              case 'neutral':
                neutralReplies++
                break
              case 'negative':
                negReplies++
                break
              case 'unsubscribe':
                unsubReplies++
                break
              case 'out_of_office':
                oooReplies++
                break
            }
          }
        }

        metricsMap[variantId] = {
          emails_sent: sent,
          emails_delivered: delivered,
          emails_bounced: bounced,
          emails_opened: opened,
          unique_opens: opened,
          emails_replied: replied,
          positive_replies: posReplies,
          neutral_replies: neutralReplies,
          negative_replies: negReplies,
          unsubscribe_replies: unsubReplies,
          ooo_replies: oooReplies,
          meetings_booked: 0,
        }
      }

      return metricsMap
    })

    // Step 3: Save results
    const savedResults = await step.run('save-results', async () => {
      const resultRepo = new AutoresearchResultRepository()

      const results = []
      for (const [variantId, metrics] of Object.entries(variantMetrics)) {
        const delivered = metrics.emails_delivered || 1
        const result = await resultRepo.upsert({
          experiment_id,
          variant_id: variantId,
          workspace_id,
          ...metrics,
          positive_reply_rate: metrics.positive_replies / delivered,
          total_reply_rate: metrics.emails_replied / delivered,
          open_rate: metrics.unique_opens / delivered,
          bounce_rate: metrics.emails_bounced / (metrics.emails_sent || 1),
          is_final: false,
        })
        results.push(result)
      }

      return results
    })

    // Step 4: Determine winner
    const evaluation = await step.run('determine-winner', async () => {
      const controlId = experiment.control_variant_id
      if (!controlId) {
        throw new Error('No control variant ID on experiment')
      }

      return determineWinner(
        savedResults,
        controlId,
        program.config.minSampleSize,
        95
      )
    })

    logger.info(
      `Experiment ${experiment_id}: ${evaluation.resultStatus} — ${evaluation.recommendation}`
    )

    // Step 5: Apply decision
    await step.run('apply-decision', async () => {
      const experimentRepo = new AutoresearchExperimentRepository()
      const programRepo = new AutoresearchProgramRepository()
      const resultRepo = new AutoresearchResultRepository()
      const patternRepo = new WinningPatternRepository()

      if (evaluation.resultStatus === 'winner_found' && evaluation.winnerVariantId) {
        // Mark results as final
        await resultRepo.markFinal(experiment_id)

        const isChallenger =
          evaluation.winnerVariantId !== experiment.control_variant_id

        // Update the experiment
        await experimentRepo.updateStatus(experiment_id, 'completed', {
          winner_variant_id: evaluation.winnerVariantId,
          result_status: 'winner_found',
          result_summary: {
            recommendation: evaluation.recommendation,
            variant_count: savedResults.length,
          },
          lift_percent: evaluation.liftPercent,
          confidence_level: evaluation.confidenceLevel,
          completed_at: new Date().toISOString(),
        })

        // If a challenger won, update the program baseline
        if (isChallenger) {
          const winnerCopy = experiment.variant_copies as Record<string, any>
          const winnerKey = Object.keys(winnerCopy).find((key) => {
            // Match challenger key by variant ID through the plan
            return key.startsWith('challenger')
          })

          if (winnerKey && winnerCopy[winnerKey]) {
            await programRepo.updateBaseline(
              experiment.program_id,
              workspace_id,
              {
                subject: winnerCopy[winnerKey].subject,
                body: winnerCopy[winnerKey].body,
                positiveReplyRate:
                  savedResults.find((r) => r.variant_id === evaluation.winnerVariantId)
                    ?.positive_reply_rate ?? program.baseline_positive_reply_rate,
              }
            )
          }

          // Apply winner in the A/B testing system
          const campaignId = program.campaign_id ?? program.emailbison_campaign_id
          if (campaignId && program.config.autoApplyWinner) {
            await applyWinner(campaignId, evaluation.winnerVariantId)
          }

          // Save winning pattern to the memory silo
          await patternRepo.create({
            workspace_id,
            program_id: experiment.program_id,
            experiment_id,
            niche: program.config.targetNiche,
            persona: program.config.targetPersona,
            element_type: experiment.element_tested,
            pattern_description: evaluation.recommendation,
            winning_copy: winnerKey ? winnerCopy[winnerKey]?.body ?? '' : '',
            baseline_copy: plan_controlBody(experiment),
            lift_percent: evaluation.liftPercent,
            positive_reply_rate:
              savedResults.find((r) => r.variant_id === evaluation.winnerVariantId)
                ?.positive_reply_rate ?? null,
            confidence_level: evaluation.confidenceLevel,
            sample_size:
              savedResults.find((r) => r.variant_id === evaluation.winnerVariantId)
                ?.emails_delivered ?? null,
            tags: [experiment.element_tested],
            is_cross_client: false,
          })
        } else {
          // Control won — mark as baseline_kept
          await experimentRepo.updateStatus(experiment_id, 'completed', {
            result_status: 'winner_found',
            completed_at: new Date().toISOString(),
          })
        }
      } else if (evaluation.resultStatus === 'insufficient_data') {
        // Optionally extend the experiment by another 24 hours
        await experimentRepo.updateStatus(experiment_id, 'waiting', {
          result_status: 'extended',
          evaluation_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          result_summary: {
            recommendation: evaluation.recommendation,
            extended: true,
          },
        })
      } else {
        // No winner — baseline kept
        await resultRepo.markFinal(experiment_id)
        await experimentRepo.updateStatus(experiment_id, 'completed', {
          result_status: 'baseline_kept',
          result_summary: { recommendation: evaluation.recommendation },
          completed_at: new Date().toISOString(),
        })
      }
    })

    // Step 6: Increment program counters
    await step.run('increment-counters', async () => {
      const programRepo = new AutoresearchProgramRepository()
      const won =
        evaluation.resultStatus === 'winner_found' &&
        evaluation.winnerVariantId !== experiment.control_variant_id
      await programRepo.incrementExperimentCount(
        experiment.program_id,
        workspace_id,
        won
      )
    })

    // Slack: notify evaluation result
    try {
      if (
        evaluation.resultStatus === 'winner_found' &&
        evaluation.winnerVariantId !== experiment.control_variant_id
      ) {
        const winnerResult = savedResults.find(
          (r) => r.variant_id === evaluation.winnerVariantId
        )
        await sendSlackAlert({
          type: 'system_event',
          severity: 'info',
          message: `Autoresearch: Winner found for ${program.name}`,
          metadata: {
            lift: `${evaluation.liftPercent?.toFixed(1) ?? '?'}%`,
            positive_reply_rate: `${((winnerResult?.positive_reply_rate ?? 0) * 100).toFixed(1)}%`,
            experiment_number: experiment.experiment_number,
            program_id: experiment.program_id,
          },
        })
      } else if (evaluation.resultStatus !== 'insufficient_data') {
        await sendSlackAlert({
          type: 'system_event',
          severity: 'warning',
          message: `Autoresearch: No winner for ${program.name}`,
          metadata: {
            result: 'Baseline kept. Moving to next experiment.',
            experiment_number: experiment.experiment_number,
            program_id: experiment.program_id,
          },
        })
      }
    } catch {
      // Non-critical: do not break the pipeline if Slack is down
    }

    // Step 7: Handle extended experiments (re-evaluate after 24h)
    if (evaluation.resultStatus === 'insufficient_data') {
      await step.sleep('wait-for-extension', '24h')

      await step.run('re-emit-evaluate', async () => {
        await inngest.send({
          name: 'autoresearch/experiment.evaluate',
          data: { experiment_id, workspace_id },
        })
      })

      return {
        success: true,
        experiment_id,
        result: 'extended',
        recommendation: evaluation.recommendation,
      }
    }

    // Step 8: Continue the loop if program is still active
    await step.run('continue-loop', async () => {
      const programRepo = new AutoresearchProgramRepository()
      const latestProgram = await programRepo.findById(
        experiment.program_id,
        workspace_id
      )

      if (latestProgram?.status === 'active') {
        await inngest.send({
          name: 'autoresearch/experiment.generate',
          data: {
            program_id: experiment.program_id,
            workspace_id,
          },
        })
      }
    })

    return {
      success: true,
      experiment_id,
      result: evaluation.resultStatus,
      winner_variant_id: evaluation.winnerVariantId,
      lift_percent: evaluation.liftPercent,
      confidence: evaluation.confidenceLevel,
      recommendation: evaluation.recommendation,
    }
  }
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function plan_controlBody(
  experiment: { variant_copies: Record<string, unknown> }
): string | null {
  const copies = experiment.variant_copies as Record<string, any>
  return copies?.control?.body ?? null
}
