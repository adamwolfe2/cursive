/**
 * Public copilot tools — a restricted, read-only subset of the admin toolkit.
 *
 * The public Audience Builder copilot must not expose write actions, live
 * audience counts, or raw segment_ids (which are our AudienceLab-internal
 * identifiers). This module handles both:
 *   1. Allowlisting which tools the LLM can call.
 *   2. Sanitizing tool output before it leaves the server (stable pseudo-ids
 *      replace raw segment_ids; any accidental UUID in text is stripped).
 */

import { ADMIN_TOOLS, runTool, type CopilotToolName, type ToolDefinition } from './tools'
import type { SegmentResult } from './types'

/** Only these tools are allowed for the public copilot. */
export const PUBLIC_ALLOWED_TOOLS = new Set<CopilotToolName>([
  'search_segments',
  'list_top_categories',
])

export const PUBLIC_TOOLS: ToolDefinition[] = ADMIN_TOOLS.filter((t) =>
  PUBLIC_ALLOWED_TOOLS.has(t.name)
)

export function sanitizeSegmentsForPublic(segments: SegmentResult[]): SegmentResult[] {
  return segments.map((s) => ({
    ...s,
    // Strip raw segment_id for the public surface — replace with a stable pseudo-id
    // that can be referenced in the conversation but doesn't leak our internal ID
    segment_id: `segment-${hashSegmentId(s.segment_id)}`,
  }))
}

function hashSegmentId(id: string): string {
  // Short stable hash (not cryptographically secure — just obfuscates the raw ID)
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h).toString(36).slice(0, 8)
}

export function sanitizeText(text: string): string {
  // Strip any segment_id patterns that might leak (UUID-like strings)
  return text.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    '[segment]'
  )
}

export async function runPublicTool(
  name: CopilotToolName,
  input: Record<string, unknown>
) {
  if (!PUBLIC_ALLOWED_TOOLS.has(name)) {
    return { summary: `Tool ${name} is not available in the public copilot.` }
  }
  const result = await runTool(name, input)
  if (result.segments) {
    return {
      summary: result.summary,
      segments: sanitizeSegmentsForPublic(result.segments),
    }
  }
  return result
}
