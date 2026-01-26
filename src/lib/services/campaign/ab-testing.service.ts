/**
 * A/B Testing Service
 * Handles variant assignment, tracking, and statistical analysis
 */

import { createClient } from '@/lib/supabase/server'

export interface Variant {
  id: string
  campaignId: string
  name: string
  variantKey: string
  isControl: boolean
  subjectTemplate: string
  bodyTemplate: string
  weight: number
  status: 'active' | 'paused' | 'archived'
}

export interface Experiment {
  id: string
  campaignId: string
  name: string
  description?: string
  hypothesis?: string
  testType: 'subject' | 'body' | 'full_template' | 'send_time'
  successMetric: 'open_rate' | 'click_rate' | 'reply_rate' | 'conversion_rate'
  minimumSampleSize: number
  confidenceLevel: number
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled'
  winnerVariantId?: string
  statisticalSignificance?: number
  resultSummary?: Record<string, any>
  startedAt?: string
  endedAt?: string
}

export interface VariantStats {
  variantId: string
  emailsSent: number
  emailsDelivered: number
  emailsBounced: number
  emailsOpened: number
  uniqueOpens: number
  emailsClicked: number
  uniqueClicks: number
  emailsReplied: number
  openRate: number
  clickRate: number
  replyRate: number
  clickToOpenRate: number
  sampleSize: number
}

export interface ExperimentResult {
  experimentId: string
  status: 'insufficient_data' | 'no_winner' | 'winner_found'
  winnerVariantId?: string
  winnerName?: string
  confidenceLevel: number
  liftPercent?: number
  variants: Array<VariantStats & { name: string; isControl: boolean }>
  recommendation: string
}

/**
 * Create a new template variant
 */
export async function createVariant(
  campaignId: string,
  workspaceId: string,
  data: {
    name: string
    variantKey: string
    subjectTemplate: string
    bodyTemplate: string
    isControl?: boolean
    weight?: number
    description?: string
  }
): Promise<{ success: boolean; variant?: Variant; error?: string }> {
  const supabase = await createClient()

  // Validate weight doesn't exceed remaining
  const { data: existingVariants } = await supabase
    .from('email_template_variants')
    .select('weight')
    .eq('campaign_id', campaignId)
    .eq('status', 'active')

  const currentTotalWeight = (existingVariants || []).reduce((sum, v) => sum + (v.weight || 0), 0)
  const newWeight = data.weight || 50

  if (currentTotalWeight + newWeight > 100) {
    return {
      success: false,
      error: `Total weight would exceed 100%. Current total: ${currentTotalWeight}%, Requested: ${newWeight}%`,
    }
  }

  const { data: variant, error } = await supabase
    .from('email_template_variants')
    .insert({
      campaign_id: campaignId,
      workspace_id: workspaceId,
      name: data.name,
      variant_key: data.variantKey,
      subject_template: data.subjectTemplate,
      body_template: data.bodyTemplate,
      is_control: data.isControl || false,
      weight: newWeight,
      description: data.description,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    variant: mapVariant(variant),
  }
}

/**
 * Get variants for a campaign
 */
export async function getVariants(
  campaignId: string
): Promise<Variant[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_template_variants')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })

  if (error || !data) {
    return []
  }

  return data.map(mapVariant)
}

/**
 * Update variant weights (rebalance)
 */
export async function updateVariantWeights(
  campaignId: string,
  weights: Array<{ variantId: string; weight: number }>
): Promise<{ success: boolean; error?: string }> {
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)

  if (totalWeight !== 100) {
    return { success: false, error: `Weights must sum to 100%. Current sum: ${totalWeight}%` }
  }

  const supabase = await createClient()

  // Update each variant
  for (const { variantId, weight } of weights) {
    const { error } = await supabase
      .from('email_template_variants')
      .update({ weight })
      .eq('id', variantId)
      .eq('campaign_id', campaignId)

    if (error) {
      return { success: false, error: error.message }
    }
  }

  return { success: true }
}

/**
 * Assign a variant to a campaign lead
 */
export async function assignVariant(
  campaignLeadId: string,
  campaignId: string
): Promise<Variant | null> {
  const supabase = await createClient()

  // Try database function first
  const { data: variantId, error } = await supabase.rpc('assign_variant', {
    p_campaign_lead_id: campaignLeadId,
    p_campaign_id: campaignId,
  })

  if (error || !variantId) {
    // Fallback to JS implementation
    return await assignVariantJS(campaignLeadId, campaignId)
  }

  // Fetch the variant details
  const { data: variant } = await supabase
    .from('email_template_variants')
    .select('*')
    .eq('id', variantId)
    .single()

  return variant ? mapVariant(variant) : null
}

/**
 * JavaScript fallback for variant assignment
 */
async function assignVariantJS(
  campaignLeadId: string,
  campaignId: string
): Promise<Variant | null> {
  const supabase = await createClient()

  // Check existing assignment
  const { data: existing } = await supabase
    .from('variant_assignments')
    .select('variant_id')
    .eq('campaign_lead_id', campaignLeadId)
    .single()

  if (existing) {
    const { data: variant } = await supabase
      .from('email_template_variants')
      .select('*')
      .eq('id', existing.variant_id)
      .single()

    return variant ? mapVariant(variant) : null
  }

  // Get active variants
  const { data: variants } = await supabase
    .from('email_template_variants')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'active')
    .order('created_at')

  if (!variants || variants.length === 0) {
    return null
  }

  // Calculate total weight
  const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 0), 0)
  if (totalWeight === 0) {
    return null
  }

  // Random selection based on weight
  const random = Math.random() * totalWeight
  let cumulative = 0

  for (const variant of variants) {
    cumulative += variant.weight || 0
    if (random < cumulative) {
      // Assign this variant
      await supabase.from('variant_assignments').insert({
        campaign_lead_id: campaignLeadId,
        variant_id: variant.id,
      })

      return mapVariant(variant)
    }
  }

  // Fallback to first variant
  const firstVariant = variants[0]
  await supabase.from('variant_assignments').insert({
    campaign_lead_id: campaignLeadId,
    variant_id: firstVariant.id,
  })

  return mapVariant(firstVariant)
}

/**
 * Get assigned variant for a campaign lead
 */
export async function getAssignedVariant(
  campaignLeadId: string
): Promise<Variant | null> {
  const supabase = await createClient()

  const { data: assignment } = await supabase
    .from('variant_assignments')
    .select('variant:email_template_variants(*)')
    .eq('campaign_lead_id', campaignLeadId)
    .single()

  if (!assignment?.variant) {
    return null
  }

  return mapVariant(assignment.variant as any)
}

/**
 * Create an experiment
 */
export async function createExperiment(
  campaignId: string,
  workspaceId: string,
  data: {
    name: string
    description?: string
    hypothesis?: string
    testType?: 'subject' | 'body' | 'full_template' | 'send_time'
    successMetric?: 'open_rate' | 'click_rate' | 'reply_rate' | 'conversion_rate'
    minimumSampleSize?: number
    confidenceLevel?: number
    autoEndOnSignificance?: boolean
  }
): Promise<{ success: boolean; experiment?: Experiment; error?: string }> {
  const supabase = await createClient()

  const { data: experiment, error } = await supabase
    .from('ab_experiments')
    .insert({
      campaign_id: campaignId,
      workspace_id: workspaceId,
      name: data.name,
      description: data.description,
      hypothesis: data.hypothesis,
      test_type: data.testType || 'subject',
      success_metric: data.successMetric || 'open_rate',
      minimum_sample_size: data.minimumSampleSize || 100,
      confidence_level: data.confidenceLevel || 95,
      auto_end_on_significance: data.autoEndOnSignificance !== false,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    experiment: mapExperiment(experiment),
  }
}

/**
 * Start an experiment
 */
export async function startExperiment(
  experimentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ab_experiments')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', experimentId)
    .eq('status', 'draft')

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Get experiment results with statistical analysis
 */
export async function getExperimentResults(
  experimentId: string
): Promise<ExperimentResult | null> {
  const supabase = await createClient()

  // Get experiment
  const { data: experiment } = await supabase
    .from('ab_experiments')
    .select('*, campaign:email_campaigns(id)')
    .eq('id', experimentId)
    .single()

  if (!experiment) {
    return null
  }

  // Get variant stats
  const { data: statsData } = await supabase
    .from('variant_stats')
    .select(`
      *,
      variant:email_template_variants(id, name, is_control, variant_key)
    `)
    .eq('experiment_id', experimentId)

  // If no experiment-specific stats, get campaign-level stats
  let stats = statsData || []
  if (stats.length === 0) {
    const { data: variants } = await supabase
      .from('email_template_variants')
      .select('id, name, is_control')
      .eq('campaign_id', experiment.campaign_id)
      .eq('status', 'active')

    // Get stats from email_sends directly
    for (const variant of variants || []) {
      const { data: sendStats } = await supabase
        .from('email_sends')
        .select('*')
        .eq('variant_id', variant.id)

      const emails = sendStats || []
      const sent = emails.length
      const delivered = emails.filter((e: any) => e.status !== 'bounced').length
      const opened = emails.filter((e: any) => e.opened_at).length
      const clicked = emails.filter((e: any) => e.clicked_at).length
      const replied = emails.filter((e: any) => e.replied_at).length

      stats.push({
        variant_id: variant.id,
        emails_sent: sent,
        emails_delivered: delivered,
        emails_opened: opened,
        unique_opens: opened,
        emails_clicked: clicked,
        unique_clicks: clicked,
        emails_replied: replied,
        open_rate: delivered > 0 ? (opened / delivered) * 100 : 0,
        click_rate: delivered > 0 ? (clicked / delivered) * 100 : 0,
        reply_rate: delivered > 0 ? (replied / delivered) * 100 : 0,
        click_to_open_rate: opened > 0 ? (clicked / opened) * 100 : 0,
        sample_size: sent,
        variant: variant,
      })
    }
  }

  // Analyze results
  return analyzeExperiment(experiment, stats)
}

/**
 * Analyze experiment and determine winner
 */
function analyzeExperiment(
  experiment: any,
  stats: any[]
): ExperimentResult {
  const metricKey = getMetricKey(experiment.success_metric)

  // Map stats to result format
  const variantResults = stats.map((s) => ({
    variantId: s.variant_id,
    name: s.variant?.name || 'Unknown',
    isControl: s.variant?.is_control || false,
    emailsSent: s.emails_sent || 0,
    emailsDelivered: s.emails_delivered || 0,
    emailsBounced: s.emails_bounced || 0,
    emailsOpened: s.emails_opened || 0,
    uniqueOpens: s.unique_opens || 0,
    emailsClicked: s.emails_clicked || 0,
    uniqueClicks: s.unique_clicks || 0,
    emailsReplied: s.emails_replied || 0,
    openRate: s.open_rate || 0,
    clickRate: s.click_rate || 0,
    replyRate: s.reply_rate || 0,
    clickToOpenRate: s.click_to_open_rate || 0,
    sampleSize: s.sample_size || 0,
  }))

  // Find control
  const control = variantResults.find((v) => v.isControl)
  const variants = variantResults.filter((v) => !v.isControl)

  // Check minimum sample size
  const totalSamples = variantResults.reduce((sum, v) => sum + v.sampleSize, 0)
  if (totalSamples < experiment.minimum_sample_size) {
    return {
      experimentId: experiment.id,
      status: 'insufficient_data',
      confidenceLevel: 0,
      variants: variantResults,
      recommendation: `Need ${experiment.minimum_sample_size - totalSamples} more sends to reach minimum sample size`,
    }
  }

  // Calculate statistical significance for each variant vs control
  let bestVariant: (typeof variantResults)[0] | null = null
  let bestSignificance = 0
  let bestLift = 0

  for (const variant of variants) {
    if (!control) continue

    const significance = calculateZTestSignificance(
      getConversions(control, metricKey),
      control.emailsDelivered,
      getConversions(variant, metricKey),
      variant.emailsDelivered
    )

    const controlRate = getMetricValue(control, metricKey)
    const variantRate = getMetricValue(variant, metricKey)
    const lift = controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0

    if (significance >= experiment.confidence_level && lift > 0 && significance > bestSignificance) {
      bestVariant = variant
      bestSignificance = significance
      bestLift = lift
    }
  }

  // Also check if control is the winner
  if (control && !bestVariant) {
    for (const variant of variants) {
      const significance = calculateZTestSignificance(
        getConversions(variant, metricKey),
        variant.emailsDelivered,
        getConversions(control, metricKey),
        control.emailsDelivered
      )

      const controlRate = getMetricValue(control, metricKey)
      const variantRate = getMetricValue(variant, metricKey)
      const lift = variantRate > 0 ? ((controlRate - variantRate) / variantRate) * 100 : 0

      if (significance >= experiment.confidence_level && lift > 0 && significance > bestSignificance) {
        bestVariant = control
        bestSignificance = significance
        bestLift = lift
      }
    }
  }

  if (bestVariant) {
    return {
      experimentId: experiment.id,
      status: 'winner_found',
      winnerVariantId: bestVariant.variantId,
      winnerName: bestVariant.name,
      confidenceLevel: bestSignificance,
      liftPercent: bestLift,
      variants: variantResults,
      recommendation: `${bestVariant.name} outperforms with ${bestLift.toFixed(1)}% lift at ${bestSignificance.toFixed(1)}% confidence`,
    }
  }

  return {
    experimentId: experiment.id,
    status: 'no_winner',
    confidenceLevel: bestSignificance,
    variants: variantResults,
    recommendation: 'No statistically significant winner yet. Continue collecting data.',
  }
}

/**
 * Calculate statistical significance using Z-test for proportions
 */
function calculateZTestSignificance(
  controlConversions: number,
  controlSample: number,
  variantConversions: number,
  variantSample: number
): number {
  if (controlSample === 0 || variantSample === 0) {
    return 0
  }

  const p1 = controlConversions / controlSample
  const p2 = variantConversions / variantSample
  const pooled = (controlConversions + variantConversions) / (controlSample + variantSample)

  if (pooled === 0 || pooled === 1) {
    return 0
  }

  const se = Math.sqrt(pooled * (1 - pooled) * (1 / controlSample + 1 / variantSample))

  if (se === 0) {
    return 0
  }

  const z = Math.abs(p1 - p2) / se

  // Convert Z-score to confidence level
  if (z >= 2.576) return 99
  if (z >= 1.96) return 95
  if (z >= 1.645) return 90
  if (z >= 1.28) return 80
  return Math.min(z * 30, 70) // Rough approximation
}

/**
 * End an experiment and declare winner
 */
export async function endExperiment(
  experimentId: string,
  winnerVariantId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get results if no winner specified
  let winner = winnerVariantId
  let significance = 0

  if (!winner) {
    const results = await getExperimentResults(experimentId)
    if (results?.status === 'winner_found') {
      winner = results.winnerVariantId
      significance = results.confidenceLevel
    }
  }

  const { error } = await supabase
    .from('ab_experiments')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      winner_variant_id: winner,
      statistical_significance: significance,
    })
    .eq('id', experimentId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Apply winner to campaign (make winner the only active variant)
 */
export async function applyWinner(
  campaignId: string,
  winnerVariantId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Set winner to 100% weight
  const { error: winnerError } = await supabase
    .from('email_template_variants')
    .update({ weight: 100 })
    .eq('id', winnerVariantId)

  if (winnerError) {
    return { success: false, error: winnerError.message }
  }

  // Pause other variants
  const { error: pauseError } = await supabase
    .from('email_template_variants')
    .update({ status: 'paused', weight: 0 })
    .eq('campaign_id', campaignId)
    .neq('id', winnerVariantId)

  if (pauseError) {
    return { success: false, error: pauseError.message }
  }

  return { success: true }
}

// ============ Helper Functions ============

function mapVariant(row: any): Variant {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    variantKey: row.variant_key,
    isControl: row.is_control,
    subjectTemplate: row.subject_template,
    bodyTemplate: row.body_template,
    weight: row.weight,
    status: row.status,
  }
}

function mapExperiment(row: any): Experiment {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    description: row.description,
    hypothesis: row.hypothesis,
    testType: row.test_type,
    successMetric: row.success_metric,
    minimumSampleSize: row.minimum_sample_size,
    confidenceLevel: row.confidence_level,
    status: row.status,
    winnerVariantId: row.winner_variant_id,
    statisticalSignificance: row.statistical_significance,
    resultSummary: row.result_summary,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  }
}

function getMetricKey(metric: string): string {
  const mapping: Record<string, string> = {
    open_rate: 'openRate',
    click_rate: 'clickRate',
    reply_rate: 'replyRate',
    conversion_rate: 'replyRate', // Use reply as conversion proxy
  }
  return mapping[metric] || 'openRate'
}

function getMetricValue(stats: VariantStats, metricKey: string): number {
  return (stats as any)[metricKey] || 0
}

function getConversions(stats: VariantStats, metricKey: string): number {
  const mapping: Record<string, keyof VariantStats> = {
    openRate: 'uniqueOpens',
    clickRate: 'uniqueClicks',
    replyRate: 'emailsReplied',
  }
  const key = mapping[metricKey] || 'uniqueOpens'
  return (stats as any)[key] || 0
}
