/**
 * ICP -> Segment Auto-Matcher
 *
 * Matches a buyer's ICP to the top AudienceLab segments (multiple, ranked by
 * semantic relevance) using the same embedding search the copilot uses. AL
 * segments are intent-based and often sparse, so we optionally enrich each match
 * with its live in-market count — fit AND volume both matter — and emit a
 * confidence signal for the confidence-gated auto/human flow.
 *
 * Pure orchestration over searchSegments + previewAudience; no side effects.
 */

import { searchSegments } from '@/lib/copilot/retrieval'
import { previewAudience } from '@/lib/audiencelab/api-client'
import { safeError } from '@/lib/utils/log-sanitizer'

export interface MatchedSegment {
  segment_id: string
  name: string
  category: string
  /** Semantic relevance to the ICP, 0..1. */
  similarity: number
  /** Live in-market identities (only when enriched via withCounts). */
  inMarketCount?: number
}

export interface SegmentMatch {
  segments: MatchedSegment[]
  query: string
  /** Gate signal: high -> auto-approve candidate; low -> route to a human. */
  confidence: 'high' | 'medium' | 'low'
}

export interface IcpInput {
  solution?: string | null
  icp_description?: string | null
  titles?: string[] | null
  industries?: string[] | null
}

/** Compose a single search query from the buyer's ICP fields. */
export function icpToQuery(icp: IcpInput): string {
  const parts = [
    icp.icp_description,
    icp.solution,
    (icp.titles ?? []).filter(Boolean).join(', '),
    (icp.industries ?? []).filter(Boolean).join(', '),
  ].filter((p): p is string => !!p && p.trim().length > 0)
  return parts.join('. ').slice(0, 1000)
}

export async function autoMatchSegments(
  icp: IcpInput,
  opts: { topN?: number; withCounts?: boolean; daysBack?: number } = {}
): Promise<SegmentMatch> {
  const topN = Math.min(Math.max(opts.topN ?? 5, 1), 8)
  const query = icpToQuery(icp)

  if (!query) {
    return { segments: [], query: '', confidence: 'low' }
  }

  const results = await searchSegments({ query, limit: topN })
  let segments: MatchedSegment[] = results.map((r) => ({
    segment_id: r.segment_id,
    name: r.name,
    category: r.category,
    similarity: r.similarity ?? 0,
  }))

  // Optional live-count enrichment — one AL call per segment. AL segments are
  // intent-based + sparse, so a perfect-fit segment may currently be empty.
  if (opts.withCounts) {
    segments = await Promise.all(
      segments.map(async (s) => {
        try {
          const preview = await previewAudience({
            days_back: opts.daysBack ?? 30,
            limit: 1,
            segment: s.segment_id,
          })
          return { ...s, inMarketCount: preview.count ?? 0 }
        } catch (err) {
          safeError('[segment-matcher] count fetch failed:', err)
          return s
        }
      })
    )
  }

  const topSim = segments[0]?.similarity ?? 0
  // When counts were fetched, require at least one segment with live volume to
  // be "high" — a confident match to empty segments is not deliverable.
  const hasVolume = !opts.withCounts || segments.some((s) => (s.inMarketCount ?? 0) > 0)
  const confidence: SegmentMatch['confidence'] =
    topSim >= 0.8 && hasVolume ? 'high' : topSim >= 0.6 ? 'medium' : 'low'

  return { segments, query, confidence }
}
