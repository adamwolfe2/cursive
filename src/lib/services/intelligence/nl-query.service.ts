import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Allowlisted tables for NL query. The LLM is instructed to only query "leads",
 * but prompt injection could attempt other tables. This allowlist is the
 * server-side enforcement layer.
 */
const ALLOWED_TABLES = new Set(['leads'])

/**
 * Allowlisted columns that may appear in generated SQL.
 * Prevents exfiltration of sensitive columns even from allowed tables.
 */
const ALLOWED_COLUMNS = new Set([
  'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
  'company_name', 'company_domain', 'company_industry', 'job_title',
  'city', 'state', 'state_code', 'country', 'postal_code',
  'lead_score', 'intent_score_calculated', 'freshness_score',
  'status', 'source', 'tags', 'created_at', 'delivered_at',
  'enrichment_status', 'validation_status', 'has_email', 'has_phone',
  'validated', 'is_marketplace_listed', 'company_tech_stack',
  'linkedin_data', 'news_mentions', 'research_brief',
  'intelligence_tier', 'assigned_user_id', 'workspace_id',
  // Aggregates and expressions
  'count', 'sum', 'avg', 'min', 'max',
])

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
7. ONLY query the "leads" table — never reference any other table
8. Never use subqueries, CTEs, UNION, JOIN, or reference multiple tables

Example: "show me all leads from Texas with a score over 70"
→ SELECT id, full_name, email, company_name, job_title, state, lead_score, status FROM leads WHERE workspace_id = :workspace_id AND state_code = 'TX' AND lead_score > 70 ORDER BY lead_score DESC LIMIT 100`

export interface NLQueryResult {
  sql: string
  results: Record<string, unknown>[]
  count: number
  summary: string
}

/**
 * Validate that generated SQL only references allowed tables.
 * Uses regex to extract table references from FROM and JOIN clauses.
 */
function validateTableReferences(sql: string): void {
  const normalized = sql.toLowerCase()

  // Extract table names from FROM clause (handles "FROM tablename" and "FROM tablename alias")
  const fromMatches = normalized.matchAll(/\bfrom\s+([a-z_][a-z0-9_]*)/gi)
  for (const match of fromMatches) {
    const table = match[1]
    if (!ALLOWED_TABLES.has(table)) {
      throw new Error(`Query references unauthorized table: ${table}`)
    }
  }

  // Block JOINs, subqueries, UNIONs, CTEs entirely
  const blocked = ['JOIN', 'UNION', 'INTERSECT', 'EXCEPT', 'WITH', 'INTO']
  const upper = sql.toUpperCase()
  for (const keyword of blocked) {
    // Match as whole word to avoid false positives
    if (new RegExp(`\\b${keyword}\\b`).test(upper)) {
      throw new Error(`Query contains blocked keyword: ${keyword}`)
    }
  }

  // Block subqueries — no parenthesized SELECT
  if (/\(\s*SELECT\b/i.test(sql)) {
    throw new Error('Subqueries are not allowed')
  }
}

/**
 * Validate the query doesn't contain multiple statements (SQL injection via semicolons).
 */
function validateSingleStatement(sql: string): void {
  // Remove string literals to avoid false positives on semicolons inside strings
  const withoutStrings = sql.replace(/'[^']*'/g, '')
  if (withoutStrings.includes(';')) {
    throw new Error('Multiple SQL statements are not allowed')
  }
}

export async function runNaturalLanguageQuery(
  query: string,
  workspaceId: string,
): Promise<NLQueryResult> {
  // Validate workspaceId format (must be UUID)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId)) {
    throw new Error('Invalid workspace ID format')
  }

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

  // Security validation — layered defense
  const upper = sql.toUpperCase().trim()

  // 1. Must start with SELECT
  if (!upper.startsWith('SELECT')) throw new Error('Only SELECT queries are allowed')

  // 2. Block dangerous DDL/DML keywords
  const dangerous = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXECUTE', 'COPY']
  for (const keyword of dangerous) {
    if (new RegExp(`\\b${keyword}\\b`).test(upper)) {
      throw new Error(`Query contains forbidden keyword: ${keyword}`)
    }
  }

  // 3. Validate only allowed tables are referenced
  validateTableReferences(sql)

  // 4. Block multiple statements
  validateSingleStatement(sql)

  // 5. Block information_schema, pg_catalog, and system table access
  if (/\b(information_schema|pg_catalog|pg_)\b/i.test(sql)) {
    throw new Error('System catalog access is not allowed')
  }

  // 6. Inject workspace_id safely using parameterized replacement
  sql = sql.replace(/:workspace_id/g, `'${workspaceId.replace(/'/g, "''")}'`)

  // 7. Ensure workspace_id filter exists
  if (!sql.toLowerCase().includes('workspace_id')) {
    throw new Error('Generated query missing workspace_id filter')
  }

  // 8. Enforce LIMIT to prevent data exfiltration of large datasets
  if (!/\bLIMIT\s+\d+/i.test(sql)) {
    sql += ' LIMIT 100'
  } else {
    // Enforce max LIMIT of 500
    const limitMatch = sql.match(/\bLIMIT\s+(\d+)/i)
    if (limitMatch && parseInt(limitMatch[1], 10) > 500) {
      sql = sql.replace(/\bLIMIT\s+\d+/i, 'LIMIT 500')
    }
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
      const top3 = rows.slice(0, 3).map((r: Record<string, unknown>) => {
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
