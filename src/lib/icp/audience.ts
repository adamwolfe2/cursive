import type { ALIntentAudienceRequest } from '@/lib/audiencelab/api-client'
import type { IcpProfile } from './profile'

/**
 * AL audience request for a workspace ICP: people researching the workspace's
 * intent topics this week, at companies in its industries, at its seniority.
 * Title keywords and size are applied locally by scoreIcpFit (AL's jobTitle
 * filter is exact-match and would drop real buyers).
 * Returns null when the ICP has no audience configured.
 */
export function buildIcpAudienceRequest(icp: IcpProfile): ALIntentAudienceRequest | null {
  if (!icp.audience.enabled || icp.audience.intentSegments.length === 0) return null
  const businessProfile: NonNullable<ALIntentAudienceRequest['filters']['businessProfile']> = {}
  if (icp.industries.length > 0) businessProfile.industry = icp.industries.map(i => i.toLowerCase())
  if (icp.seniority.length > 0) businessProfile.seniority = icp.seniority.map(s => s.toLowerCase())
  return {
    segment: icp.audience.intentSegments,
    days_back: 7,
    filters: Object.keys(businessProfile).length > 0 ? { businessProfile } : {},
    ...(icp.audience.intentScores.length > 0 && { score: icp.audience.intentScores }),
  }
}
