/**
 * MCP Server End-to-End Smoke Test
 *
 * Exercises the full /api/mcp request path against a running dev server:
 *   1. Provisions a temporary workspace API key scoped `mcp:access` via admin client
 *   2. Positive: initialize, tools/list, tools/call for enrich_person + lookup_company
 *   3. Positive: tools/call for pull_in_market_identities + get_intent_signals
 *   4. Negative: no auth, invalid scope, unknown tool, missing required params
 *   5. Verifies api_usage_log rows were written
 *   6. Cleans up the temporary key
 *
 * Usage:
 *   1. Start dev server in another terminal: `pnpm dev`
 *   2. Run: `pnpm tsx scripts/smoke-test-mcp.ts`
 *
 * Exits 0 on success, 1 on any failed assertion.
 */

import { randomBytes, createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env.local manually (tsx doesn't auto-load Next.js env files).
// Matches dotenv behavior for double-quoted strings: interprets \n, \r, \t escapes.
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envFile = readFileSync(envPath, 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    const isQuoted = value.startsWith('"') && value.endsWith('"')
    if (isQuoted) {
      value = value.slice(1, -1)
      // In quoted values, \n means literal newline — strip them (URLs/keys
      // shouldn't contain newlines; this normalizes buggy env files).
      value = value.replace(/\\n|\\r|\\t/g, '').trim()
    }
    if (!process.env[key]) process.env[key] = value
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('[smoke] Could not load .env.local:', (err as Error).message)
}

import { createAdminClient } from '../src/lib/supabase/admin'

const MCP_URL = process.env.MCP_URL || 'http://localhost:3000/api/mcp'

interface TestResult {
  name: string
  pass: boolean
  detail?: string
}

const results: TestResult[] = []

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[smoke]', ...args)
}

function assert(name: string, cond: boolean, detail?: string) {
  results.push({ name, pass: cond, detail })
  if (cond) log(`  PASS: ${name}`)
  else log(`  FAIL: ${name}${detail ? ' — ' + detail : ''}`)
}

async function rpcCall(
  authHeader: string | null,
  body: Record<string, unknown>
): Promise<{ status: number; json: any; text: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authHeader) headers.Authorization = authHeader
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    // Not JSON — possibly 204
  }
  return { status: res.status, json, text }
}

async function main() {
  log('Target:', MCP_URL)

  // ── Step 1: Provision temporary API key ──────────────────────────────────
  const admin = createAdminClient()

  log('Finding a workspace with an owner user...')
  const { data: ownerRow, error: ownerErr } = await admin
    .from('users')
    .select('id, email, workspace_id')
    .eq('role', 'owner')
    .not('workspace_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (ownerErr || !ownerRow) {
    throw new Error(`No owner user found. Error: ${ownerErr?.message ?? 'empty'}`)
  }

  const { data: ws, error: wsErr } = await admin
    .from('workspaces')
    .select('id, name')
    .eq('id', ownerRow.workspace_id)
    .maybeSingle()
  if (wsErr || !ws) {
    throw new Error(`Workspace ${ownerRow.workspace_id} not found. Error: ${wsErr?.message ?? 'empty'}`)
  }

  log('Using workspace:', ws.id, `(${ws.name})`)
  log('Using owner:', ownerRow.id, `(${ownerRow.email})`)
  const owner = { id: ownerRow.id, email: ownerRow.email }

  const rawKey = `cursive_mcp_test_${randomBytes(16).toString('hex')}`
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const keyLabel = `smoke-test-${Date.now()}`

  log('Provisioning test key...')
  const { data: keyRow, error: keyErr } = await admin
    .from('workspace_api_keys')
    .insert({
      workspace_id: ws.id,
      user_id: owner.id,
      name: keyLabel,
      key_hash: keyHash,
      key_prefix: rawKey.slice(0, 10),
      scopes: ['mcp:access'],
      is_active: true,
    })
    .select('id')
    .single()
  if (keyErr || !keyRow) {
    throw new Error(`Failed to provision test key: ${keyErr?.message ?? 'empty'}`)
  }
  const keyId = keyRow.id
  log('Provisioned key id:', keyId)

  // Also provision a scope-less key for the 403 test
  const rawKeyNoScope = `cursive_mcp_test_${randomBytes(16).toString('hex')}`
  const keyHashNoScope = createHash('sha256').update(rawKeyNoScope).digest('hex')
  const { data: keyRowNoScope, error: keyErrNoScope } = await admin
    .from('workspace_api_keys')
    .insert({
      workspace_id: ws.id,
      user_id: owner.id,
      name: `${keyLabel}-noscope`,
      key_hash: keyHashNoScope,
      key_prefix: rawKeyNoScope.slice(0, 10),
      scopes: ['read:leads'], // not mcp:access
      is_active: true,
    })
    .select('id')
    .single()
  if (keyErrNoScope || !keyRowNoScope) {
    throw new Error(`Failed to provision no-scope test key: ${keyErrNoScope?.message ?? 'empty'}`)
  }
  const keyIdNoScope = keyRowNoScope.id

  const cleanup = async () => {
    log('Cleaning up test keys...')
    await admin.from('workspace_api_keys').delete().eq('id', keyId)
    await admin.from('workspace_api_keys').delete().eq('id', keyIdNoScope)
  }

  try {
    // ── Step 2: Negative — no auth ─────────────────────────────────────────
    log('TEST: no auth header → 401')
    {
      const { status, json } = await rpcCall(null, {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'smoke', version: '1' } },
      })
      assert('no-auth returns 401', status === 401, `got ${status}, body: ${JSON.stringify(json).slice(0, 200)}`)
    }

    // ── Step 3: Negative — wrong scope ─────────────────────────────────────
    log('TEST: wrong scope → 403')
    {
      const { status } = await rpcCall(`Bearer ${rawKeyNoScope}`, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      })
      assert('wrong-scope returns 403', status === 403, `got ${status}`)
    }

    // ── Step 4: Positive — initialize ──────────────────────────────────────
    log('TEST: initialize handshake')
    {
      const { status, json } = await rpcCall(`Bearer ${rawKey}`, {
        jsonrpc: '2.0',
        id: 10,
        method: 'initialize',
        params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'smoke', version: '1' } },
      })
      assert('initialize returns 200', status === 200)
      assert('initialize returns server info', json?.result?.serverInfo?.name === 'cursive-mcp')
      assert('initialize returns protocol version', json?.result?.protocolVersion === '2025-03-26')
    }

    // ── Step 5: Positive — tools/list ──────────────────────────────────────
    log('TEST: tools/list')
    {
      const { status, json } = await rpcCall(`Bearer ${rawKey}`, {
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/list',
      })
      assert('tools/list returns 200', status === 200)
      const tools = json?.result?.tools ?? []
      assert('tools/list returns 4 tools', tools.length === 4, `got ${tools.length}`)
      const names = new Set(tools.map((t: any) => t.name))
      assert('includes enrich_person', names.has('enrich_person'))
      assert('includes lookup_company', names.has('lookup_company'))
      assert('includes pull_in_market_identities', names.has('pull_in_market_identities'))
      assert('includes get_intent_signals', names.has('get_intent_signals'))
    }

    // ── Step 6: Negative — missing required param ──────────────────────────
    log('TEST: enrich_person with no identifiers → invalid params')
    {
      const { json } = await rpcCall(`Bearer ${rawKey}`, {
        jsonrpc: '2.0',
        id: 20,
        method: 'tools/call',
        params: { name: 'enrich_person', arguments: {} },
      })
      assert(
        'enrich_person no-identifiers returns JSON-RPC error',
        json?.error?.code === -32602,
        `got ${JSON.stringify(json)}`
      )
    }

    // ── Step 7: Negative — unknown tool ────────────────────────────────────
    log('TEST: unknown tool → method not found')
    {
      const { json } = await rpcCall(`Bearer ${rawKey}`, {
        jsonrpc: '2.0',
        id: 21,
        method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} },
      })
      assert(
        'unknown tool returns -32601',
        json?.error?.code === -32601,
        `got ${JSON.stringify(json)}`
      )
    }

    // ── Step 8: Positive — enrich_person (with a known email) ──────────────
    // Use a famous public email that should exist in AL. Skip hard assertion
    // on "found" because AL may not have coverage for arbitrary emails.
    log('TEST: enrich_person (may or may not find data)')
    {
      const { status, json } = await rpcCall(`Bearer ${rawKey}`, {
        jsonrpc: '2.0',
        id: 30,
        method: 'tools/call',
        params: {
          name: 'enrich_person',
          arguments: { email: 'jensen@nvidia.com' },
        },
      })
      assert('enrich_person returns 200', status === 200)
      assert('enrich_person returns content envelope', Array.isArray(json?.result?.content))
      assert(
        'enrich_person has structuredContent',
        json?.result?.structuredContent !== undefined
      )
      log('  enrich result:', JSON.stringify(json?.result?.structuredContent).slice(0, 300))
    }

    // ── Step 9: Positive — lookup_company ──────────────────────────────────
    log('TEST: lookup_company with domain')
    {
      const { status, json } = await rpcCall(`Bearer ${rawKey}`, {
        jsonrpc: '2.0',
        id: 31,
        method: 'tools/call',
        params: {
          name: 'lookup_company',
          arguments: { domain: 'nvidia.com' },
        },
      })
      assert('lookup_company returns 200', status === 200)
      assert('lookup_company returns content envelope', Array.isArray(json?.result?.content))
      const sc = json?.result?.structuredContent ?? {}
      log('  company result:', JSON.stringify(sc).slice(0, 300))
    }

    log('TEST: lookup_company with bad domain → invalid params')
    {
      const { json } = await rpcCall(`Bearer ${rawKey}`, {
        jsonrpc: '2.0',
        id: 311,
        method: 'tools/call',
        params: {
          name: 'lookup_company',
          arguments: { domain: 'not a url' },
        },
      })
      assert(
        'lookup_company bad domain returns -32602',
        json?.error?.code === -32602
      )
    }

    // ── Step 10: pull_in_market_identities (will depend on workspace targeting)
    log('TEST: pull_in_market_identities')
    {
      const { status, json } = await rpcCall(`Bearer ${rawKey}`, {
        jsonrpc: '2.0',
        id: 32,
        method: 'tools/call',
        params: {
          name: 'pull_in_market_identities',
          arguments: { days_back: 3 },
        },
      })
      assert('pull_in_market_identities returns 200', status === 200)
      assert(
        'pull_in_market_identities has structuredContent',
        json?.result?.structuredContent !== undefined
      )
      const sc = json?.result?.structuredContent ?? {}
      log('  pull result:', JSON.stringify(sc).slice(0, 400))
      // Either no targeting configured, or real data returned
      assert(
        'pull result is well-formed',
        typeof sc.found === 'number' || sc.found === false
      )
    }

    // ── Step 11: get_intent_signals — requires at least one identifier ────
    log('TEST: get_intent_signals — no identifiers → invalid params')
    {
      const { json } = await rpcCall(`Bearer ${rawKey}`, {
        jsonrpc: '2.0',
        id: 40,
        method: 'tools/call',
        params: {
          name: 'get_intent_signals',
          arguments: {},
        },
      })
      assert(
        'get_intent_signals no-ids returns -32602',
        json?.error?.code === -32602
      )
    }

    log('TEST: get_intent_signals — with bogus hash returns empty list')
    {
      const { status, json } = await rpcCall(`Bearer ${rawKey}`, {
        jsonrpc: '2.0',
        id: 41,
        method: 'tools/call',
        params: {
          name: 'get_intent_signals',
          arguments: { hem_sha256: '0'.repeat(64), hours: 24 },
        },
      })
      assert('get_intent_signals returns 200', status === 200)
      const sc = json?.result?.structuredContent ?? {}
      assert('get_intent_signals returns events array', Array.isArray(sc.events))
      assert('get_intent_signals found === 0 for bogus hash', sc.found === 0)
    }

    // ── Step 12: Verify api_usage_log was written ──────────────────────────
    // Wait briefly for fire-and-forget inserts to land
    await new Promise((resolve) => setTimeout(resolve, 1500))
    log('TEST: api_usage_log was written')
    {
      const { data: logs, error: logsErr } = await admin
        .from('api_usage_log')
        .select('endpoint, status_code, response_time_ms')
        .eq('workspace_id', ws.id)
        .like('endpoint', 'mcp:%')
        .order('created_at', { ascending: false })
        .limit(15)

      assert('api_usage_log query succeeded', !logsErr)
      assert('api_usage_log has MCP rows', (logs?.length ?? 0) > 0, `got ${logs?.length ?? 0} rows`)
      if (logs && logs.length > 0) {
        const endpoints = logs.map((l) => l.endpoint)
        log('  usage endpoints (last 15):', endpoints.slice(0, 10).join(', '))
        assert('logs include mcp:initialize', endpoints.includes('mcp:initialize'))
        assert('logs include mcp:tools/list', endpoints.includes('mcp:tools/list'))
        assert(
          'logs include an enrich_person call',
          endpoints.some((e) => e === 'mcp:enrich_person')
        )
      }
    }

    // ── Step 13: ping method ──────────────────────────────────────────────
    log('TEST: ping')
    {
      const { status, json } = await rpcCall(`Bearer ${rawKey}`, {
        jsonrpc: '2.0',
        id: 99,
        method: 'ping',
      })
      assert('ping returns 200', status === 200)
      assert('ping returns empty result object', typeof json?.result === 'object')
    }

    // ── Step 14: malformed JSON ────────────────────────────────────────────
    log('TEST: malformed JSON body → -32700 parse error')
    {
      const res = await fetch(MCP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rawKey}`,
        },
        body: '{not json',
      })
      const body = await res.json().catch(() => ({}))
      assert('malformed JSON returns -32700', (body as any)?.error?.code === -32700)
    }
  } finally {
    await cleanup()
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.pass).length
  const failed = results.filter((r) => !r.pass)
  log('')
  log(`Summary: ${passed}/${results.length} passed`)
  if (failed.length > 0) {
    log('')
    log('FAILURES:')
    for (const f of failed) log(`  - ${f.name}${f.detail ? ': ' + f.detail : ''}`)
    process.exit(1)
  }
  log('All tests passed.')
}

main().catch((err) => {
  log('Smoke test crashed:', err)
  process.exit(1)
})
