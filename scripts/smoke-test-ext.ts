/**
 * Extension/Clay provider endpoints smoke test.
 *
 * Exercises /api/ext/lookup, /api/ext/company, /api/ext/verify-email
 * end-to-end against a running server (local or production).
 *
 * Usage:
 *   # Local:
 *   pnpm tsx scripts/smoke-test-ext.ts
 *
 *   # Production:
 *   EXT_BASE_URL=https://leads.meetcursive.com pnpm tsx scripts/smoke-test-ext.ts
 */

import { readFileSync } from 'node:fs'
import { randomBytes, createHash } from 'node:crypto'

const envFile = readFileSync('.env.local', 'utf8')
for (const line of envFile.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  let value = trimmed.slice(eq + 1).trim()
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1).replace(/\\n|\\r|\\t/g, '').trim()
  }
  if (!process.env[key]) process.env[key] = value
}

import { createAdminClient } from '../src/lib/supabase/admin'

const BASE_URL = process.env.EXT_BASE_URL || 'http://localhost:3000'

interface TestResult {
  name: string
  pass: boolean
  detail?: string
}
const results: TestResult[] = []
function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[ext-smoke]', ...args)
}
function assert(name: string, cond: boolean, detail?: string) {
  results.push({ name, pass: cond, detail })
  if (cond) log(`  PASS: ${name}`)
  else log(`  FAIL: ${name}${detail ? ' — ' + detail : ''}`)
}

async function call(
  path: string,
  authHeader: string | null,
  body: Record<string, unknown>
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authHeader) headers.Authorization = authHeader
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    json = { _raw: text }
  }
  return { status: res.status, json }
}

async function main() {
  log('Target:', BASE_URL)
  const admin = createAdminClient()

  // 1. Find a real workspace + owner
  const { data: ownerRow } = await admin
    .from('users')
    .select('id, email, workspace_id')
    .eq('role', 'owner')
    .not('workspace_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!ownerRow?.workspace_id) {
    throw new Error('No owner user with workspace found')
  }

  log('Using workspace:', ownerRow.workspace_id, `(owner: ${ownerRow.email})`)

  // 2. Provision two test keys: one with all ext scopes, one with no scopes
  const rawKey = `cursive_ext_test_${randomBytes(16).toString('hex')}`
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const { data: keyRow, error: keyErr } = await admin
    .from('workspace_api_keys')
    .insert({
      workspace_id: ownerRow.workspace_id,
      user_id: ownerRow.id,
      name: `ext-smoke-${Date.now()}`,
      key_hash: keyHash,
      key_prefix: rawKey.slice(0, 10),
      scopes: ['ext:lookup', 'ext:company', 'ext:verify'],
      is_active: true,
    })
    .select('id')
    .single()
  if (keyErr || !keyRow) {
    throw new Error(`Failed to provision key: ${keyErr?.message}`)
  }

  const rawKeyNoScope = `cursive_ext_test_${randomBytes(16).toString('hex')}`
  const keyHashNoScope = createHash('sha256').update(rawKeyNoScope).digest('hex')
  const { data: keyRowNoScope, error: keyErrNoScope } = await admin
    .from('workspace_api_keys')
    .insert({
      workspace_id: ownerRow.workspace_id,
      user_id: ownerRow.id,
      name: `ext-smoke-noscope-${Date.now()}`,
      key_hash: keyHashNoScope,
      key_prefix: rawKeyNoScope.slice(0, 10),
      scopes: ['read:leads'], // no ext scopes
      is_active: true,
    })
    .select('id')
    .single()
  if (keyErrNoScope || !keyRowNoScope) {
    throw new Error(`Failed to provision no-scope key: ${keyErrNoScope?.message}`)
  }

  const cleanup = async () => {
    log('Cleaning up test keys...')
    await admin.from('workspace_api_keys').delete().eq('id', keyRow.id)
    await admin.from('workspace_api_keys').delete().eq('id', keyRowNoScope.id)
  }

  try {
    // ── Auth negatives ─────────────────────────────────────────────────────
    log('TEST: /api/ext/lookup no auth → 401')
    {
      const { status } = await call('/api/ext/lookup', null, { email: 'test@nvidia.com' })
      assert('lookup no-auth returns 401', status === 401, `got ${status}`)
    }

    log('TEST: /api/ext/lookup wrong scope → 403')
    {
      const { status } = await call('/api/ext/lookup', `Bearer ${rawKeyNoScope}`, {
        email: 'test@nvidia.com',
      })
      assert('lookup wrong-scope returns 403', status === 403, `got ${status}`)
    }

    log('TEST: /api/ext/company wrong scope → 403')
    {
      const { status } = await call('/api/ext/company', `Bearer ${rawKeyNoScope}`, {
        domain: 'nvidia.com',
      })
      assert('company wrong-scope returns 403', status === 403, `got ${status}`)
    }

    // ── Lookup positive ────────────────────────────────────────────────────
    log('TEST: /api/ext/lookup with email → 200')
    {
      const { status, json } = await call('/api/ext/lookup', `Bearer ${rawKey}`, {
        email: 'jensen@nvidia.com',
      })
      assert('lookup email returns 200', status === 200, `got ${status}: ${JSON.stringify(json).slice(0, 200)}`)
      assert('lookup returns found field', json?.found !== undefined)
      assert('lookup returns provider field', json?.provider === 'audiencelab')
      log('  lookup result:', JSON.stringify(json).slice(0, 300))
    }

    log('TEST: /api/ext/lookup with no identifier → 400')
    {
      const { status, json } = await call('/api/ext/lookup', `Bearer ${rawKey}`, {})
      assert('lookup no-ids returns 400', status === 400, `got ${status}: ${JSON.stringify(json)}`)
    }

    // ── Company positive ───────────────────────────────────────────────────
    log('TEST: /api/ext/company with domain → 200')
    {
      const { status, json } = await call('/api/ext/company', `Bearer ${rawKey}`, {
        domain: 'nvidia.com',
      })
      assert('company returns 200', status === 200)
      assert('company returns found field', json?.found !== undefined)
      log('  company result:', JSON.stringify(json).slice(0, 300))
    }

    log('TEST: /api/ext/company with URL → 200 (auto-strip)')
    {
      const { status, json } = await call('/api/ext/company', `Bearer ${rawKey}`, {
        domain: 'https://www.nvidia.com/about',
      })
      assert('company URL-form returns 200', status === 200)
      log('  URL form result:', JSON.stringify(json).slice(0, 200))
    }

    log('TEST: /api/ext/company with invalid domain → 400')
    {
      const { status } = await call('/api/ext/company', `Bearer ${rawKey}`, {
        domain: 'not a url at all',
      })
      assert('company bad domain returns 400', status === 400, `got ${status}`)
    }

    // ── Email verify positive ──────────────────────────────────────────────
    log('TEST: /api/ext/verify-email → 200')
    {
      const { status, json } = await call('/api/ext/verify-email', `Bearer ${rawKey}`, {
        email: 'jensen@nvidia.com',
      })
      assert('verify returns 200', status === 200)
      assert('verify returns status field', typeof json?.status === 'string')
      assert('verify returns is_deliverable field', typeof json?.is_deliverable === 'boolean')
      log('  verify result:', JSON.stringify(json).slice(0, 300))
    }

    log('TEST: /api/ext/verify-email bad format → 400')
    {
      const { status } = await call('/api/ext/verify-email', `Bearer ${rawKey}`, {
        email: 'not-an-email',
      })
      assert('verify bad format returns 400', status === 400, `got ${status}`)
    }

    // ── Verify api_usage_log writes ────────────────────────────────────────
    await new Promise((r) => setTimeout(r, 1500))
    log('TEST: api_usage_log has ext:% rows')
    {
      const { data: logs, error: logsErr } = await admin
        .from('api_usage_log')
        .select('endpoint, status_code')
        .eq('workspace_id', ownerRow.workspace_id)
        .like('endpoint', 'ext:%')
        .order('created_at', { ascending: false })
        .limit(20)
      assert('api_usage_log query succeeded', !logsErr)
      assert('api_usage_log has ext rows', (logs?.length ?? 0) > 0, `got ${logs?.length ?? 0}`)
      if (logs && logs.length > 0) {
        const endpoints = logs.map((l: any) => l.endpoint)
        log('  logged endpoints (recent):', endpoints.slice(0, 10).join(', '))
        assert('logs include ext:lookup', endpoints.includes('ext:lookup'))
        assert('logs include ext:company', endpoints.includes('ext:company'))
        assert('logs include ext:verify-email', endpoints.includes('ext:verify-email'))
      }
    }
  } finally {
    await cleanup()
  }

  const passed = results.filter((r) => r.pass).length
  const failed = results.filter((r) => !r.pass)
  log('')
  log(`Summary: ${passed}/${results.length} passed`)
  if (failed.length > 0) {
    log('FAILURES:')
    for (const f of failed) log(`  - ${f.name}${f.detail ? ': ' + f.detail : ''}`)
    process.exit(1)
  }
  log('All ext smoke tests passed.')
}

main().catch((err) => {
  log('Smoke test crashed:', err)
  process.exit(1)
})
