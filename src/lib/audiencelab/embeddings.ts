/**
 * Segment embedding utilities using OpenAI text-embedding-3-small.
 * Used for semantic search over the 19k+ AudienceLab segment catalog.
 */

const EMBEDDING_MODEL = 'text-embedding-3-small'
const OPENAI_BASE_URL = 'https://api.openai.com/v1'

interface EmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>
  usage: { prompt_tokens: number; total_tokens: number }
}

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is not set')
  return key
}

/**
 * Build a searchable text string from a segment's fields.
 * Concatenates all meaningful fields for richer embeddings.
 */
export function buildSegmentText(segment: {
  name: string
  category?: string | null
  sub_category?: string | null
  description?: string | null
  keywords?: string | null
}): string {
  const parts = [segment.name]
  if (segment.category) parts.push(segment.category)
  if (segment.sub_category) parts.push(segment.sub_category)
  if (segment.description) parts.push(segment.description)
  if (segment.keywords) parts.push(segment.keywords)
  return parts.join(' | ')
}

/**
 * Embed a single text string. Used for search queries.
 * Accepts optional AbortSignal for cancellation.
 */
export async function embedText(text: string, signal?: AbortSignal): Promise<number[]> {
  const results = await embedTexts([text], signal)
  return results[0]
}

/**
 * Embed multiple text strings in a single API call.
 * OpenAI supports up to 2048 inputs per call.
 */
export async function embedTexts(texts: string[], signal?: AbortSignal): Promise<number[][]> {
  if (texts.length === 0) return []

  const response = await fetch(`${OPENAI_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
    signal,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenAI Embeddings API error: ${response.status} - ${errorBody}`)
  }

  const data: EmbeddingResponse = await response.json()
  // Sort by index to maintain input order
  return data.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding)
}
