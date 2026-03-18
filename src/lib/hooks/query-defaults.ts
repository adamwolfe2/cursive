/**
 * Centralized React Query defaults by data category
 *
 * Use these when configuring useQuery hooks to ensure consistent
 * caching behavior across the app.
 *
 * - realtime: notifications, credits, live counters
 * - standard: leads, contacts, campaigns
 * - static: stats, settings, plan info
 */
export const queryDefaults = {
  // Real-time data (notifications, credits) — short stale time
  realtime: { staleTime: 10_000, gcTime: 2 * 60_000 },
  // Standard data (leads, contacts) — moderate stale time
  standard: { staleTime: 30_000, gcTime: 5 * 60_000 },
  // Slow-changing data (stats, settings) — long stale time
  static: { staleTime: 60_000, gcTime: 10 * 60_000 },
} as const
