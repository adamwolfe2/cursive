/**
 * Segment retrieval for the admin copilot.
 *
 * Hybrid search: vector (semantic) first with AbortController, keyword
 * fallback if embedding fails/times out. Always returns compressed
 * summaries so the LLM context stays tight.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { embedText } from '@/lib/audiencelab/embeddings'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import type { SegmentResult, SegmentSearchArgs } from './types'

const DEFAULT_LIMIT = 8
const MAX_LIMIT = 12
const MATCH_THRESHOLD = 0.25
const EMBED_TIMEOUT_MS = 4_000

export async function searchSegments(
  args: SegmentSearchArgs
): Promise<SegmentResult[]> {
  const limit = Math.min(MAX_LIMIT, Math.max(1, args.limit ?? DEFAULT_LIMIT))
  const query = (args.query ?? '').trim().slice(0, 500)
  if (!query) return []

  const admin = createAdminClient()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS)
    const queryEmbedding = await embedText(query, controller.signal)
    clearTimeout(timeout)

    const { data, error } = await admin.rpc('match_segments', {
      query_embedding: queryEmbedding,
      match_threshold: MATCH_THRESHOLD,
      match_count: limit,
      filter_type: args.type ?? null,
      filter_category: args.category ?? null,
    })

    if (!error && data && data.length > 0) {
      return data as SegmentResult[]
    }
  } catch (err) {
    // Fall through to keyword search
    console.warn('[copilot/retrieval] semantic search failed, falling back:', err)
  }

  const term = sanitizeSearchTerm(query)
  let q = admin
    .from('al_segment_catalog')
    .select('segment_id, name, category, sub_category, description, type')
    .or(`name.ilike.%${term}%,category.ilike.%${term}%,keywords.ilike.%${term}%`)
  if (args.type) q = q.eq('type', args.type)
  if (args.category) q = q.eq('category', args.category)
  const { data, error } = await q.order('name').limit(limit)
  if (error) {
    console.error('[copilot/retrieval] keyword fallback failed:', error)
    return []
  }
  return (data ?? []) as SegmentResult[]
}

/**
 * Format a SegmentResult list into a compact, LLM-friendly string.
 * Target: ~100 tokens per segment. Never exceeds ~1200 tokens total.
 */
export function formatSegmentsForContext(segments: SegmentResult[]): string {
  if (segments.length === 0) return 'No segments matched.'
  return segments
    .map((s, i) => {
      const lines = [
        `${i + 1}. ${s.name} [${s.type}] — ${s.category}${s.sub_category ? ` / ${s.sub_category}` : ''}`,
      ]
      if (s.description) {
        const desc = s.description.length > 200 ? s.description.slice(0, 200) + '…' : s.description
        lines.push(`   ${desc}`)
      }
      if (typeof s.similarity === 'number') {
        lines.push(`   (relevance: ${s.similarity.toFixed(2)})`)
      }
      return lines.join('\n')
    })
    .join('\n\n')
}

export async function getTopCategories(
  limit = 20
): Promise<Array<{ category: string; count: number }>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('al_segment_catalog')
    .select('category')
    .not('category', 'is', null)
  if (error || !data) return []

  const counts = new Map<string, number>()
  for (const row of data) {
    const c = row.category as string
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
