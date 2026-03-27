// Experiment Metrics for Autoresearch
// Statistical significance testing and winner determination

import type { AutoresearchResult } from '@/types/autoresearch'

// ---------------------------------------------------------------------------
// Positive Reply Rate
// ---------------------------------------------------------------------------

export function calculatePositiveReplyRate(result: AutoresearchResult): number {
  if (result.emails_delivered === 0) {
    return 0
  }
  return result.positive_replies / result.emails_delivered
}

// ---------------------------------------------------------------------------
// Statistical Significance (Z-test for proportions)
// ---------------------------------------------------------------------------

export function hasStatisticalSignificance(
  control: AutoresearchResult,
  challenger: AutoresearchResult,
  confidenceThreshold = 95
): {
  significant: boolean
  confidence: number
  lift: number
  zScore: number
} {
  const p1 = calculatePositiveReplyRate(control)
  const p2 = calculatePositiveReplyRate(challenger)
  const n1 = control.emails_delivered
  const n2 = challenger.emails_delivered

  // Need minimum sample to compute
  if (n1 === 0 || n2 === 0) {
    return { significant: false, confidence: 0, lift: 0, zScore: 0 }
  }

  // Pooled proportion
  const pooled = (control.positive_replies + challenger.positive_replies) / (n1 + n2)

  // Avoid division by zero when pooled is 0 or 1
  if (pooled === 0 || pooled === 1) {
    return { significant: false, confidence: 0, lift: 0, zScore: 0 }
  }

  // Standard error
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2))

  if (se === 0) {
    return { significant: false, confidence: 0, lift: 0, zScore: 0 }
  }

  // Z-score
  const zScore = (p2 - p1) / se

  // Convert z-score to confidence percentage using normal CDF approximation
  const confidence = zScoreToConfidence(Math.abs(zScore))

  // Lift: percentage improvement of challenger over control
  const lift = p1 === 0 ? 0 : ((p2 - p1) / p1) * 100

  const thresholdDecimal = confidenceThreshold / 100
  const significant = confidence / 100 >= thresholdDecimal

  return { significant, confidence, lift, zScore }
}

// ---------------------------------------------------------------------------
// Winner Determination
// ---------------------------------------------------------------------------

export function determineWinner(
  results: AutoresearchResult[],
  controlVariantId: string,
  minSampleSize: number,
  confidenceThreshold = 95
): {
  resultStatus: 'winner_found' | 'no_winner' | 'insufficient_data'
  winnerVariantId: string | null
  liftPercent: number | null
  confidenceLevel: number | null
  recommendation: string
} {
  if (results.length < 2) {
    return {
      resultStatus: 'insufficient_data',
      winnerVariantId: null,
      liftPercent: null,
      confidenceLevel: null,
      recommendation: 'Need at least 2 variants to compare.',
    }
  }

  const control = results.find((r) => r.variant_id === controlVariantId)
  if (!control) {
    return {
      resultStatus: 'insufficient_data',
      winnerVariantId: null,
      liftPercent: null,
      confidenceLevel: null,
      recommendation: 'Control variant not found in results.',
    }
  }

  // Check minimum sample sizes
  const allMeetMinimum = results.every((r) => r.emails_delivered >= minSampleSize)
  if (!allMeetMinimum) {
    const smallest = results.reduce(
      (min, r) => (r.emails_delivered < min ? r.emails_delivered : min),
      Infinity
    )
    return {
      resultStatus: 'insufficient_data',
      winnerVariantId: null,
      liftPercent: null,
      confidenceLevel: null,
      recommendation: `Minimum sample size not met. Smallest: ${smallest}, required: ${minSampleSize}.`,
    }
  }

  // Compare each challenger against control
  const challengers = results.filter((r) => r.variant_id !== controlVariantId)

  let bestChallenger: {
    variantId: string
    lift: number
    confidence: number
    significant: boolean
  } | null = null

  for (const challenger of challengers) {
    const test = hasStatisticalSignificance(control, challenger, confidenceThreshold)

    if (
      test.significant &&
      test.lift > 0 &&
      (!bestChallenger || test.lift > bestChallenger.lift)
    ) {
      bestChallenger = {
        variantId: challenger.variant_id,
        lift: test.lift,
        confidence: test.confidence,
        significant: true,
      }
    }
  }

  if (bestChallenger) {
    return {
      resultStatus: 'winner_found',
      winnerVariantId: bestChallenger.variantId,
      liftPercent: Math.round(bestChallenger.lift * 100) / 100,
      confidenceLevel: Math.round(bestChallenger.confidence * 100) / 100,
      recommendation: `Variant ${bestChallenger.variantId} outperforms control by ${bestChallenger.lift.toFixed(1)}% with ${bestChallenger.confidence.toFixed(1)}% confidence.`,
    }
  }

  // Check if control beats all challengers significantly
  const controlBeatsAll = challengers.every((challenger) => {
    const test = hasStatisticalSignificance(challenger, control, confidenceThreshold)
    return test.significant && test.lift > 0
  })

  if (controlBeatsAll) {
    return {
      resultStatus: 'winner_found',
      winnerVariantId: controlVariantId,
      liftPercent: 0,
      confidenceLevel: confidenceThreshold,
      recommendation: 'Control variant outperforms all challengers. Keep current copy.',
    }
  }

  return {
    resultStatus: 'no_winner',
    winnerVariantId: null,
    liftPercent: null,
    confidenceLevel: null,
    recommendation: 'No statistically significant winner yet. Continue collecting data.',
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Approximate normal CDF using Abramowitz & Stegun formula.
 * Returns confidence as a percentage (0-100).
 */
function zScoreToConfidence(z: number): number {
  // Constants for approximation
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = z < 0 ? -1 : 1
  const absZ = Math.abs(z)

  const t = 1.0 / (1.0 + p * absZ)
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ / 2)

  const cdf = 0.5 * (1.0 + sign * y)

  // Two-tailed confidence: how confident we are the difference is real
  return (1 - 2 * (1 - cdf)) * 100
}
