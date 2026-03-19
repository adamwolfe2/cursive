/**
 * Centralized React Query defaults by data category
 *
 * Use these when configuring useQuery hooks to ensure consistent
 * caching behavior across the app.
 *
 * Categories (from shortest to longest staleTime):
 * - realtime: notifications, live counters — 30s
 * - lists: leads, contacts, campaigns — 1 min
 * - dashboard: stats, analytics, summaries — 2 min
 * - profile: user profile, workspace settings — 5 min
 * - static: industries, states, plans, reference data — 10 min
 *
 * The QueryClient default (set in providers.tsx) is 2 minutes.
 * Individual hooks can override with any of these presets.
 */
export const queryDefaults = {
  // Real-time data (notifications, live counters) — 30s stale
  realtime: { staleTime: 30_000, gcTime: 2 * 60_000 },
  // List data (leads, contacts, campaigns) — 1 min stale
  lists: { staleTime: 60_000, gcTime: 5 * 60_000 },
  // Dashboard stats & analytics — 2 min stale
  dashboard: { staleTime: 2 * 60_000, gcTime: 10 * 60_000 },
  // User profile & workspace settings — 5 min stale
  profile: { staleTime: 5 * 60_000, gcTime: 10 * 60_000 },
  // Static / reference data (industries, states, plans) — 10 min stale
  static: { staleTime: 10 * 60_000, gcTime: 30 * 60_000 },
} as const
