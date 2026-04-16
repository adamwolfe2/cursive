/**
 * Shared types for the admin copilot.
 */

export type CopilotRole = 'user' | 'assistant'

export interface CopilotMessage {
  role: CopilotRole
  content: string
}

export interface SegmentResult {
  segment_id: string
  name: string
  category: string
  sub_category: string | null
  description: string | null
  type: string
  similarity?: number
}

export interface SegmentSearchArgs {
  query: string
  type?: 'B2B' | 'B2C' | null
  category?: string | null
  limit?: number
}

export interface PreviewAudienceArgs {
  segment_ids: string[]
  states?: string[] | null
  industries?: string[] | null
}

export type StreamEvent =
  | { type: 'thinking'; delta: string }
  | { type: 'text'; delta: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'segments'; segments: SegmentResult[] }
  | { type: 'tool_result'; tool_use_id: string; summary: string }
  | { type: 'error'; message: string }
  | {
      type: 'done'
      usage: {
        input_tokens: number
        output_tokens: number
        cache_creation_tokens: number
        cache_read_tokens: number
        thinking_tokens: number
        cost_usd: number
      }
    }
