import { safeError } from '@/lib/utils/log-sanitizer'
import { createAdminClient } from '@/lib/supabase/admin'

const OPENAI_API_KEY = () => process.env.OPENAI_API_KEY ?? ''

const SCHEMA_CONTEXT = `
You are converting natural language to a Supabase PostgreSQL SELECT query for the "leads" table.

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
6. Return ONLY the SQL query, no explanation, no markdown

Example: "show me all leads from Texas with a score over 70"
→ SELECT id, full_name, email, company_name, job_title, state, lead_score, status FROM leads WHERE workspace_id = :workspace_id AND state_code = 'TX' AND lead_score > 70 ORDER BY lead_score DESC LIMIT 100
`

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
  // Step 1: Generate SQL
  const sqlRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SCHEMA_CONTEXT },
        { role: 'user', content: query },
      ],
      max_tokens: 500,
      temperature: 0,
    }),
  })

  if (!sqlRes.ok) throw new Error('Failed to generate SQL')
  const sqlData = await sqlRes.json()
  let sql = sqlData.choices?.[0]?.message?.content?.trim() ?? ''

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
  if (!sql.toLowerCase().includes(`workspace_id`)) {
    throw new Error('Generated query missing workspace_id filter')
  }

  // Step 2: Execute via Supabase RPC (raw SQL with admin client)
  const supabase = createAdminClient()
  const { data: results, error } = await supabase.rpc('execute_nl_query', { query_sql: sql })

  if (error) throw new Error(`Query failed: ${error.message}`)

  const rows = (results as Record<string, unknown>[]) ?? []

  // Step 3: Generate natural language summary
  let summary = `Found ${rows.length} leads.`
  if (rows.length > 0 && OPENAI_API_KEY()) {
    try {
      const summaryRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `The user asked: "${query}"\nWe found ${rows.length} leads. Top 3: ${rows.slice(0, 3).map((r: any) => `${r.full_name || r.first_name} at ${r.company_name}`).join(', ')}.\nWrite a 1-sentence natural language summary of these results.`,
          }],
          max_tokens: 100,
          temperature: 0.3,
        }),
      })
      const sd = await summaryRes.json()
      summary = sd.choices?.[0]?.message?.content?.trim() ?? summary
    } catch {
      // Non-fatal
    }
  }

  return { sql, results: rows, count: rows.length, summary }
}
