/**
 * Feature Flags & A/B Test Configuration
 *
 * This module manages feature flags using Vercel Edge Config for fast,
 * edge-computed A/B test assignments.
 *
 * @see https://vercel.com/docs/storage/edge-config
 */

import { get } from '@vercel/edge-config';

/**
 * Test variant configuration
 */
export interface TestVariant {
  id: string;
  name: string;
  weight: number; // 0-100 percentage of traffic
  metadata?: Record<string, string | number | boolean>;
}

/**
 * A/B test configuration
 */
export interface ABTest {
  id: string;
  name: string;
  enabled: boolean;
  variants: TestVariant[];
  traffic: number; // 0-100 percentage of total traffic exposed to test
  startDate?: string;
  endDate?: string;
  targeting?: {
    segments?: string[];
    devices?: ('mobile' | 'desktop' | 'tablet')[];
    geolocations?: string[];
  };
}

/**
 * All active A/B tests configuration
 */
export interface ABTestConfig {
  tests: Record<string, ABTest>;
}

/**
 * Default test configuration (fallback if Edge Config unavailable)
 */
const DEFAULT_CONFIG: ABTestConfig = {
  tests: {
    'homepage-hero-cta': {
      id: 'homepage-hero-cta',
      name: 'Homepage Hero CTA Test',
      enabled: false,
      traffic: 100,
      variants: [
        { id: 'control', name: 'Book a Demo', weight: 33 },
        { id: 'variant-b', name: 'See Cursive in Action', weight: 33 },
        { id: 'variant-c', name: 'Identify Your Website Visitors', weight: 34 },
      ],
    },
    'pricing-page-structure': {
      id: 'pricing-page-structure',
      name: 'Pricing Page Structure Test',
      enabled: false,
      traffic: 100,
      variants: [
        { id: 'control', name: '3 Tiers', weight: 33 },
        { id: 'variant-b', name: '2 Tiers + Contact', weight: 33 },
        { id: 'variant-c', name: 'Single Plan', weight: 34 },
      ],
    },
    'blog-cta-placement': {
      id: 'blog-cta-placement',
      name: 'Blog CTA Placement Test',
      enabled: false,
      traffic: 100,
      variants: [
        { id: 'control', name: 'Bottom Only', weight: 33 },
        { id: 'variant-b', name: 'Mid + Bottom', weight: 33 },
        { id: 'variant-c', name: 'Inline Throughout', weight: 34 },
      ],
    },
    'exit-intent-offer': {
      id: 'exit-intent-offer',
      name: 'Exit Intent Popup Offer Test',
      enabled: false,
      traffic: 100,
      variants: [
        { id: 'control', name: 'Free Visitor Report', weight: 33 },
        { id: 'variant-b', name: 'Free 14-Day Trial', weight: 33 },
        { id: 'variant-c', name: 'Case Study Download', weight: 34 },
      ],
    },
  },
};

/**
 * Get A/B test configuration from Vercel Edge Config
 */
export async function getABTestConfig(): Promise<ABTestConfig> {
  try {
    if (!process.env.EDGE_CONFIG) {
      console.warn('EDGE_CONFIG not set, using default configuration');
      return DEFAULT_CONFIG;
    }

    const config = await get<ABTestConfig>('ab-tests');

    if (!config) {
      console.warn('No A/B test config found in Edge Config, using defaults');
      return DEFAULT_CONFIG;
    }

    return config;
  } catch (error) {
    console.error('Error fetching A/B test config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Get specific test configuration
 */
export async function getTest(testId: string): Promise<ABTest | null> {
  const config = await getABTestConfig();
  return config.tests[testId] || null;
}

/**
 * Check if a test is currently active
 */
export function isTestActive(test: ABTest): boolean {
  if (!test.enabled) return false;

  const now = new Date();

  if (test.startDate && new Date(test.startDate) > now) {
    return false;
  }

  if (test.endDate && new Date(test.endDate) < now) {
    return false;
  }

  return true;
}

/**
 * Get all active tests
 */
export async function getActiveTests(): Promise<ABTest[]> {
  const config = await getABTestConfig();
  return Object.values(config.tests).filter(isTestActive);
}

/**
 * Update Edge Config with new test configuration
 *
 * Note: This should be called from an admin API route, not client-side
 * Requires EDGE_CONFIG environment variable with write access
 */
export async function updateTestConfig(
  testId: string,
  updates: Partial<ABTest>
): Promise<void> {
  // This is a placeholder - actual implementation would use Edge Config API
  // https://vercel.com/docs/storage/edge-config/edge-config-api
  throw new Error('Not implemented - use Vercel CLI or API to update Edge Config');
}

/**
 * Helper to validate test configuration
 */
export function validateTestConfig(test: ABTest): boolean {
  // Check weights sum to 100
  const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.1) {
    console.error(`Test ${test.id}: variant weights must sum to 100, got ${totalWeight}`);
    return false;
  }

  // Check traffic is valid
  if (test.traffic < 0 || test.traffic > 100) {
    console.error(`Test ${test.id}: traffic must be between 0 and 100`);
    return false;
  }

  // Check all variants have unique IDs
  const variantIds = test.variants.map(v => v.id);
  if (new Set(variantIds).size !== variantIds.length) {
    console.error(`Test ${test.id}: variant IDs must be unique`);
    return false;
  }

  return true;
}
