/**
 * One-time backfill: embed all AudienceLab segment catalog entries.
 *
 * Generates OpenAI text-embedding-3-small vectors for semantic search.
 * Idempotent — only processes rows where embedding IS NULL.
 *
 * Run with: pnpm embed:segments
 * Cost: ~$0.02 for 19k segments
 * Time: ~2-3 minutes
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required env vars: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const BATCH_SIZE = 500
const EMBEDDING_MODEL = 'text-embedding-3-small'

interface Segment {
  segment_id: string
  name: string
  category: string | null
  sub_category: string | null
  description: string | null
  keywords: string | null
}

function buildText(seg: Segment): string {
  const parts = [seg.name]
  if (seg.category) parts.push(seg.category)
  if (seg.sub_category) parts.push(seg.sub_category)
  if (seg.description) parts.push(seg.description)
  if (seg.keywords) parts.push(seg.keywords)
  return parts.join(' | ')
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${body}`)
  }

  const data = await response.json()
  return data.data
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((d: { embedding: number[] }) => d.embedding)
}

async function main() {
  // Count total unembedded segments
  const { count: totalCount } = await supabase
    .from('al_segment_catalog')
    .select('segment_id', { count: 'exact', head: true })
    .is('embedding', null)

  if (!totalCount || totalCount === 0) {
    console.log('All segments already have embeddings. Nothing to do.')
    return
  }

  console.log(`Found ${totalCount} segments without embeddings. Starting...`)

  let processed = 0
  let offset = 0

  while (true) {
    // Fetch a batch of unembedded segments
    const { data: segments, error } = await supabase
      .from('al_segment_catalog')
      .select('segment_id, name, category, sub_category, description, keywords')
      .is('embedding', null)
      .order('segment_id')
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) {
      console.error('DB fetch error:', error.message)
      break
    }

    if (!segments || segments.length === 0) break

    // Build text strings
    const texts = segments.map(buildText)

    // Get embeddings from OpenAI
    try {
      const embeddings = await getEmbeddings(texts)

      // Update each row with its embedding
      for (let i = 0; i < segments.length; i++) {
        const { error: updateError } = await supabase
          .from('al_segment_catalog')
          .update({ embedding: JSON.stringify(embeddings[i]) })
          .eq('segment_id', segments[i].segment_id)

        if (updateError) {
          console.error(`Failed to update ${segments[i].segment_id}:`, updateError.message)
        }
      }

      processed += segments.length
      console.log(`Embedded ${processed}/${totalCount} segments`)
    } catch (err) {
      console.error('Embedding batch failed:', err instanceof Error ? err.message : err)
      // Wait and retry on rate limit
      console.log('Waiting 5s before retry...')
      await new Promise(r => setTimeout(r, 5000))
      continue // Don't increment offset — retry this batch
    }

    // Move to next batch (use 0 since we filter by IS NULL)
    // Actually since we're updating embeddings, the IS NULL filter
    // will naturally skip already-processed rows, so keep offset at 0
  }

  console.log(`Done! Embedded ${processed} segments total.`)
}

main().catch(console.error)
