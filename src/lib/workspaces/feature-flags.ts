// Workspace nav feature flags.
//
// A workspace's `visible_features` column is a strict allowlist of nav feature
// keys. When it is NULL or empty, the workspace shows everything (existing
// behavior — preserves admin/test workspaces untouched). When populated, ONLY
// the listed features render in the sidebar — and this allowlist takes
// PRECEDENCE over role/plan/adminOnly gating. This is what lets a funnel buyer
// (who has role='owner', which would otherwise unlock every admin item) see a
// clean 3-item nav instead of the full 15-item one.

/** Stable feature keys, one per top-level nav item. */
export const FEATURE_KEYS = [
  'dashboard',
  'leads',
  'outreach',
  'settings',
  'outbound',
  'find-leads',
  'crm',
  'analytics',
  'referrals',
  'partner-hub',
  'queries',
  'ai-studio',
  'lead-data',
  'ai-agents',
  'campaigns',
  'templates',
] as const

export type FeatureKey = (typeof FEATURE_KEYS)[number]

/** Default allowlist for funnel-tier buyers: a clean, minimal surface. */
export const FUNNEL_TIER_FEATURES: FeatureKey[] = [
  'dashboard',
  'leads',
  'settings',
]

/** Human-readable labels for the admin toggle UI. */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  outreach: 'Outreach',
  settings: 'Settings',
  outbound: 'Outbound Agent',
  'find-leads': 'Find Leads',
  crm: 'CRM',
  analytics: 'Analytics',
  referrals: 'Refer & Earn',
  'partner-hub': 'Partner Hub',
  queries: 'Queries',
  'ai-studio': 'AI Studio',
  'lead-data': 'Lead Data',
  'ai-agents': 'AI Agents',
  campaigns: 'Campaigns',
  templates: 'Templates',
}

/**
 * Whether a nav feature should be visible given a workspace's allowlist.
 *
 * - `null` / `undefined` / empty array → `true` (show all; backward-compatible)
 * - populated array → `true` only when `key` is present (strict allowlist)
 */
export function isFeatureVisible(
  visibleFeatures: string[] | null | undefined,
  key: string
): boolean {
  if (!visibleFeatures || visibleFeatures.length === 0) {
    return true
  }
  return visibleFeatures.includes(key)
}

/** Whether a workspace has an active (non-empty) feature allowlist. */
export function hasFeatureAllowlist(
  visibleFeatures: string[] | null | undefined
): boolean {
  return Array.isArray(visibleFeatures) && visibleFeatures.length > 0
}

/** Validate + normalize an incoming allowlist to known keys (dedup, drop unknowns). */
export function normalizeFeatures(input: unknown): FeatureKey[] {
  if (!Array.isArray(input)) return []
  const valid = new Set<string>(FEATURE_KEYS)
  const seen = new Set<string>()
  const out: FeatureKey[] = []
  for (const item of input) {
    if (typeof item === 'string' && valid.has(item) && !seen.has(item)) {
      seen.add(item)
      out.push(item as FeatureKey)
    }
  }
  return out
}
