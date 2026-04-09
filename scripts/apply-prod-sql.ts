/**
 * Run arbitrary SQL against production via Supabase Management API.
 *
 * Usage:
 *   pnpm tsx scripts/apply-prod-sql.ts query "SELECT 1"
 *   pnpm tsx scripts/apply-prod-sql.ts file path/to/migration.sql
 */

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PROJECT_REF = 'lrbftjspiiakfnydxbgk'

function getPAT(): string {
  const raw = execSync(
    'security find-generic-password -s "Supabase CLI" -a "supabase" -w',
    { encoding: 'utf8' }
  ).trim()
  if (raw.startsWith('go-keyring-base64:')) {
    return Buffer.from(raw.slice('go-keyring-base64:'.length), 'base64')
      .toString('utf8')
      .trim()
  }
  return raw
}

async function runQuery(pat: string, query: string): Promise<void> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  )
  const text = await res.text()
  // eslint-disable-next-line no-console
  console.log('Status:', res.status)
  // eslint-disable-next-line no-console
  console.log('Response:', text)
  if (!res.ok) {
    process.exit(1)
  }
}

async function main() {
  const [mode, arg] = process.argv.slice(2)
  if (!mode || !arg) {
    // eslint-disable-next-line no-console
    console.error('Usage: tsx apply-prod-sql.ts {query|file} <arg>')
    process.exit(1)
  }

  const pat = getPAT()
  let sql: string
  if (mode === 'query') {
    sql = arg
  } else if (mode === 'file') {
    sql = readFileSync(resolve(process.cwd(), arg), 'utf8')
  } else {
    // eslint-disable-next-line no-console
    console.error('Mode must be "query" or "file"')
    process.exit(1)
  }

  // eslint-disable-next-line no-console
  console.log('Executing SQL (length:', sql.length, 'bytes)')
  await runQuery(pat, sql)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
