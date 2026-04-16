/**
 * Tool definitions for the admin copilot.
 *
 * We wrap AudienceLab's functionality locally (via existing REST client)
 * instead of using Anthropic's native MCP connector, because:
 *   1. AL MCP uses X-Api-Key, Anthropic's connector forces Bearer.
 *   2. Local tool definitions give us per-surface allowlisting (admin vs public).
 *   3. We already have battle-tested guardrails in api-client.ts.
 */

import { searchSegments, formatSegmentsForContext, getTopCategories } from './retrieval'
import { previewAudience } from '@/lib/audiencelab/api-client'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SegmentResult } from './types'

export type CopilotToolName =
  | 'search_segments'
  | 'get_segment_details'
  | 'preview_audience_count'
  | 'list_top_categories'

export interface ToolDefinition {
  name: CopilotToolName
  description: string
  input_schema: Record<string, unknown>
}

export const ADMIN_TOOLS: ToolDefinition[] = [
  {
    name: 'search_segments',
    description:
      'Semantic search over the AudienceLab segment catalog (19,000+ segments). Use this whenever the user describes an ICP, industry, interest, or behavior. Always call this before recommending segments. Returns the top matching segments with category, description, and relevance score.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'A natural-language description of the audience. Be specific — "B2B SaaS decision-makers actively evaluating CRMs" is much better than "saas buyers".',
        },
        type: {
          type: 'string',
          enum: ['B2B', 'B2C'],
          description: 'Filter by audience type.',
        },
        category: {
          type: 'string',
          description:
            'Filter by top-level category (e.g. "Business", "Financial Services", "Sports & Fitness", "Auto").',
        },
        limit: {
          type: 'number',
          description: 'How many segments to return. Max 12. Default 8.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_segment_details',
    description:
      'Fetch the full record for a specific segment_id — use when the user asks "tell me more about segment X" or wants the long description + keywords.',
    input_schema: {
      type: 'object',
      properties: {
        segment_id: {
          type: 'string',
          description: 'The segment_id from a prior search_segments result.',
        },
      },
      required: ['segment_id'],
    },
  },
  {
    name: 'preview_audience_count',
    description:
      'Get the LIVE count of how many in-market identities match a specific segment in the last N days. Calls the AudienceLab API. Use this to show the user real audience size before they commit to building it. Cost: counts as one AL API call.',
    input_schema: {
      type: 'object',
      properties: {
        segment_id: {
          type: 'string',
          description: 'A single segment_id from a prior search result.',
        },
        days_back: {
          type: 'number',
          description: 'How many days back to look. Default 7. Max 30.',
        },
      },
      required: ['segment_id'],
    },
  },
  {
    name: 'list_top_categories',
    description:
      'List the top categories in the catalog with segment counts. Useful when the user asks "what kinds of segments do you have" or at the start of a session for orientation.',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'How many categories to return. Default 20.',
        },
      },
    },
  },
]

export interface ToolCallResult {
  /** Text summary sent back to the LLM */
  summary: string
  /** Structured segment results for the UI to render */
  segments?: SegmentResult[]
}

export async function runTool(
  name: CopilotToolName,
  input: Record<string, unknown>
): Promise<ToolCallResult> {
  switch (name) {
    case 'search_segments': {
      const segments = await searchSegments({
        query: String(input.query ?? ''),
        type: (input.type as 'B2B' | 'B2C') ?? null,
        category: (input.category as string) ?? null,
        limit: typeof input.limit === 'number' ? input.limit : undefined,
      })
      return {
        summary: formatSegmentsForContext(segments),
        segments,
      }
    }

    case 'get_segment_details': {
      const segment_id = String(input.segment_id ?? '')
      if (!segment_id) return { summary: 'No segment_id provided.' }
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('al_segment_catalog')
        .select('segment_id, name, category, sub_category, description, keywords, type')
        .eq('segment_id', segment_id)
        .maybeSingle()
      if (error || !data) return { summary: `Segment ${segment_id} not found.` }
      const segment: SegmentResult = {
        segment_id: data.segment_id,
        name: data.name,
        category: data.category,
        sub_category: data.sub_category,
        description: data.description,
        type: data.type,
      }
      const summary = [
        `${data.name} [${data.type}]`,
        `Category: ${data.category}${data.sub_category ? ` / ${data.sub_category}` : ''}`,
        data.description ? `\n${data.description}` : '',
        data.keywords ? `\nKeywords: ${data.keywords}` : '',
      ]
        .filter(Boolean)
        .join('\n')
      return { summary, segments: [segment] }
    }

    case 'preview_audience_count': {
      const segment_id = String(input.segment_id ?? '')
      const days_back = Math.min(
        30,
        Math.max(1, typeof input.days_back === 'number' ? input.days_back : 7)
      )
      if (!segment_id) return { summary: 'No segment_id provided.' }
      try {
        const preview = await previewAudience({
          days_back,
          segment: segment_id,
          limit: 0,
        })
        return {
          summary: `Segment ${segment_id} has approximately ${preview.count.toLocaleString()} in-market identities in the last ${days_back} days.`,
        }
      } catch (err) {
        return {
          summary: `Preview failed: ${err instanceof Error ? err.message : 'unknown error'}`,
        }
      }
    }

    case 'list_top_categories': {
      const limit = typeof input.limit === 'number' ? input.limit : 20
      const cats = await getTopCategories(limit)
      if (cats.length === 0) return { summary: 'No categories found.' }
      const lines = cats.map(
        (c, i) => `${i + 1}. ${c.category} — ${c.count.toLocaleString()} segments`
      )
      return { summary: lines.join('\n') }
    }

    default:
      return { summary: `Unknown tool: ${name}` }
  }
}
