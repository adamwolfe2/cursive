/**
 * A/B Testing Utility Functions
 *
 * Core utilities for variant assignment, user bucketing, and consistent
 * test experiences across sessions.
 */

import { ABTest, TestVariant } from './feature-flags';

/**
 * Cookie/localStorage key prefix for A/B test assignments
 */
const AB_TEST_PREFIX = 'ab_test_';

/**
 * Generate a stable user ID for A/B testing
 * Uses a combination of session and persistent identifiers
 */
export function getUserId(req?: Request): string {
  if (typeof window !== 'undefined') {
    // Client-side: Try to get existing ID from localStorage
    let userId = localStorage.getItem('ab_user_id');

    if (!userId) {
      // Generate new ID using timestamp + random
      userId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('ab_user_id', userId);
    }

    return userId;
  }

  // Server-side: Use IP + User-Agent hash (if available)
  if (req) {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const ua = req.headers.get('user-agent') || '';
    return hashString(`${ip}-${ua}`);
  }

  // Fallback to random ID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Simple string hashing function
 * Based on Java's String.hashCode()
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Assign a variant to a user based on consistent hashing
 * Ensures the same user always gets the same variant
 */
export function assignVariant(
  testId: string,
  userId: string,
  variants: TestVariant[]
): TestVariant {
  // Check for existing assignment in localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`${AB_TEST_PREFIX}${testId}`);
    if (stored) {
      const variant = variants.find(v => v.id === stored);
      if (variant) return variant;
    }
  }

  // Calculate hash of userId + testId for deterministic assignment
  const hash = hashString(`${userId}-${testId}`);
  const numericHash = parseInt(hash, 36);
  const bucket = numericHash % 100;

  // Assign variant based on weight distribution
  let cumulativeWeight = 0;
  for (const variant of variants) {
    cumulativeWeight += variant.weight;
    if (bucket < cumulativeWeight) {
      // Store assignment in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${AB_TEST_PREFIX}${testId}`, variant.id);
      }
      return variant;
    }
  }

  // Fallback to first variant (should never reach here if weights sum to 100)
  return variants[0];
}

/**
 * Check if user should be included in test based on traffic allocation
 */
export function shouldIncludeInTest(
  testId: string,
  userId: string,
  trafficPercentage: number
): boolean {
  if (trafficPercentage >= 100) return true;
  if (trafficPercentage <= 0) return false;

  const hash = hashString(`${userId}-${testId}-traffic`);
  const numericHash = parseInt(hash, 36);
  const bucket = numericHash % 100;

  return bucket < trafficPercentage;
}

/**
 * Get variant assignment for a user
 * Returns null if user should not be included in test
 */
export function getVariantForUser(
  test: ABTest,
  userId: string
): TestVariant | null {
  // Check if user should be included in test
  if (!shouldIncludeInTest(test.id, userId, test.traffic)) {
    return null;
  }

  // Assign variant
  return assignVariant(test.id, userId, test.variants);
}

/**
 * Get control variant (first variant or explicitly marked as control)
 */
export function getControlVariant(test: ABTest): TestVariant {
  const control = test.variants.find(v => v.id === 'control');
  return control || test.variants[0];
}

/**
 * Check if variant is control
 */
export function isControlVariant(variant: TestVariant): boolean {
  return variant.id === 'control' || variant.id === 'a';
}

/**
 * Store test exposure event (user was exposed to test)
 * This should be tracked separately from conversion events
 */
export function trackTestExposure(
  testId: string,
  variantId: string,
  userId: string
): void {
  // Implementation would integrate with analytics system
  // See analytics.ts for full implementation
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ab_test_exposure', {
      test_id: testId,
      variant_id: variantId,
      user_id: userId,
    });
  }
}

/**
 * Calculate required sample size for A/B test
 * Based on baseline conversion rate and minimum detectable effect
 *
 * @param baselineRate - Current conversion rate (0-1)
 * @param mde - Minimum detectable effect as decimal (0.1 = 10% lift)
 * @param alpha - Significance level (default 0.05 for 95% confidence)
 * @param power - Statistical power (default 0.8)
 * @returns Required sample size per variant
 */
export function calculateSampleSize(
  baselineRate: number,
  mde: number,
  alpha: number = 0.05,
  power: number = 0.8
): number {
  // Using simplified formula for proportions
  // For exact calculations, use online calculators
  const zAlpha = 1.96; // z-score for 95% confidence
  const zBeta = 0.84; // z-score for 80% power

  const p1 = baselineRate;
  const p2 = baselineRate * (1 + mde);
  const pBar = (p1 + p2) / 2;

  const numerator = Math.pow(zAlpha + zBeta, 2) * 2 * pBar * (1 - pBar);
  const denominator = Math.pow(p2 - p1, 2);

  return Math.ceil(numerator / denominator);
}

/**
 * Calculate test duration in days
 *
 * @param sampleSize - Required sample size per variant
 * @param dailyTraffic - Daily visitors to page
 * @param numVariants - Number of variants (default 2)
 * @returns Estimated test duration in days
 */
export function calculateTestDuration(
  sampleSize: number,
  dailyTraffic: number,
  numVariants: number = 2
): number {
  const totalSample = sampleSize * numVariants;
  return Math.ceil(totalSample / dailyTraffic);
}

/**
 * Calculate statistical significance using z-test for proportions
 *
 * @param controlConversions - Number of conversions in control
 * @param controlSample - Total sample size for control
 * @param variantConversions - Number of conversions in variant
 * @param variantSample - Total sample size for variant
 * @returns p-value (significant if < 0.05)
 */
export function calculatePValue(
  controlConversions: number,
  controlSample: number,
  variantConversions: number,
  variantSample: number
): number {
  const p1 = controlConversions / controlSample;
  const p2 = variantConversions / variantSample;

  const pPool = (controlConversions + variantConversions) / (controlSample + variantSample);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / controlSample + 1 / variantSample));

  const z = (p2 - p1) / se;

  // Approximate p-value using standard normal distribution
  // For exact p-values, use a statistical library
  return 2 * (1 - normalCDF(Math.abs(z)));
}

/**
 * Cumulative distribution function for standard normal distribution
 * Approximation for p-value calculation
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/**
 * Calculate confidence interval for conversion rate
 *
 * @param conversions - Number of conversions
 * @param sample - Total sample size
 * @param confidence - Confidence level (default 0.95)
 * @returns [lower bound, upper bound]
 */
export function calculateConfidenceInterval(
  conversions: number,
  sample: number,
  confidence: number = 0.95
): [number, number] {
  const rate = conversions / sample;
  const z = confidence === 0.95 ? 1.96 : 2.576; // 95% or 99%
  const se = Math.sqrt((rate * (1 - rate)) / sample);

  return [
    Math.max(0, rate - z * se),
    Math.min(1, rate + z * se)
  ];
}

/**
 * Format conversion rate as percentage string
 */
export function formatRate(rate: number, decimals: number = 2): string {
  return `${(rate * 100).toFixed(decimals)}%`;
}

/**
 * Format lift percentage
 */
export function formatLift(control: number, variant: number, decimals: number = 1): string {
  const lift = ((variant - control) / control) * 100;
  const sign = lift > 0 ? '+' : '';
  return `${sign}${lift.toFixed(decimals)}%`;
}

/**
 * Clear all A/B test assignments (for testing/debugging)
 */
export function clearAllTestAssignments(): void {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(AB_TEST_PREFIX)) {
      localStorage.removeItem(key);
    }
  });

  localStorage.removeItem('ab_user_id');
}
