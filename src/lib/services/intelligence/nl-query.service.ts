import { safeError } from '@/lib/utils/log-sanitizer'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

const SCHEMA_CONTEXT = `You are converting natural language to a Supabase PostgreSQL SELECT query for the "leads" table.

Table: leads
Columns available for SELECT and WHERE:
  id, first_name, last_name, full_name, email, phone, company_name, company_domain,
  company_industry, job_title, city, state, state_code, country, postal_code,
  lead_score, intent_score_calculated, freshness_score, status, source, tags,
  created_at, delivered_at, enrichment_status, validation_status, has_email, has_phone,
  validated, is_marketplace_listed, company_tech_stack, linkedin_data, news_mentions,
  research_brief, intelligence_tier, assigned_user_id

RULES:
1. ONLY generate SELECT statements — never INSERT, UPDATE, DELETE, DROP, or any DDL
2. ALWAYS include "WHERE workspace_id = :workspace_id" — this is injected automatically
3. Always add ORDER BY created_at DESC unless user specifies otherwise
4. Always add LIMIT 100 unless user specifies otherwise (max 500)
5. Use ILIKE for text searches (case-insensitive)
6. Return ONLY the SQL query, no explanation, no markdown, no code fences

Example: "show me all leads from Texas with a score over 70"
→ SELECT id, full_name, email, company_name, job_title, state, lead_score, status FROM leads WHERE workspace_id = :workspace_id AND state_code = 'TX' AND lead_score > 70 ORDER BY lead_score DESC LIMIT 100`

export interface NLQueryResult {
  sql: string
  results: Record<string, unknown>[]
  count: number
  summary: string
}

export async function runNaturalLanguageQuery(
  query: string,
  workspaceId: string,
): Promise<NLQueryResult> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  // Step 1: Generate SQL using Claude Haiku (fast + cheap)
  const sqlMsg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    system: SCHEMA_CONTEXT,
    messages: [{ role: 'user', content: query }],
  })

  let sql = (sqlMsg.content[0] as { type: string; text: string }).text?.trim() ?? ''

  // Strip markdown code fences if Claude wrapped the SQL
  sql = sql.replace(/^```sql\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

  // Security validation
  const upper = sql.toUpperCase().trim()
  if (!upper.startsWith('SELECT')) throw new Error('Only SELECT queries are allowed')
  const dangerous = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE', 'GRANT', 'REVOKE']
  for (const keyword of dangerous) {
    if (upper.includes(keyword)) throw new Error(`Query contains forbidden keyword: ${keyword}`)
  }

  // Inject workspace_id safely
  sql = sql.replace(/:workspace_id/g, `'${workspaceId.replace(/'/g, "''")}'`)

  // Ensure workspace_id filter exists
  if (!sql.toLowerCase().includes('workspace_id')) {
    throw new Error('Generated query missing workspace_id filter')
  }

  // Step 2: Execute via Supabase RPC
  const supabase = createAdminClient()
  const { data: results, error } = await supabase.rpc('execute_nl_query', { query_sql: sql })

  if (error) throw new Error(`Query failed: ${error.message}`)

  const rows = (results as Record<string, unknown>[]) ?? []

  // Step 3: Generate natural language summary using Claude Haiku
  let summary = `Found ${rows.length} lead${rows.length !== 1 ? 's' : ''}.`
  if (rows.length > 0) {
    try {
      const top3 = rows.slice(0, 3).map((r: any) => {
        const name = r.full_name || [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unknown'
        return r.company_name ? `${name} at ${r.company_name}` : name
      }).join(', ')

      const summaryMsg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `The user asked: "${query}"\nWe found ${rows.length} leads. Top results: ${top3}.\nWrite a concise 1-sentence summary of these results. Be specific.`,
        }],
      })
      summary = (summaryMsg.content[0] as { type: string; text: string }).text?.trim() ?? summary
    } catch {
      // Non-fatal — default summary is fine
    }
  }

  return { sql, results: rows, count: rows.length, summary }
}
