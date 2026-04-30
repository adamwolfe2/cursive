import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { requireAdmin } from '@/lib/auth/admin'

function sig(method: string, path: string, timestamp: string, secret: string) {
  return createHash('sha512').update(`${method} ${path} ${timestamp} ${secret}`).digest('hex').toUpperCase()
}

async function rabbit(
  method: 'GET' | 'POST',
  keyId: string,
  secret: string,
  urlPath: string,
  body?: unknown
) {
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const signature = sig(method, urlPath, timestamp, secret)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-rabbitsign-api-time-utc': timestamp,
    'x-rabbitsign-api-key-id': keyId,
    'x-rabbitsign-api-signature': signature,
  }
  const init: RequestInit = { method, headers }
  if (body !== undefined) init.body = JSON.stringify(body)
  try {
    const res = await fetch(`https://www.rabbitsign.com${urlPath}`, init)
    const text = await res.text().catch(() => '')
    return { method, urlPath, status: res.status, body: text.slice(0, 2000) }
  } catch (e) {
    return { method, urlPath, error: e instanceof Error ? e.message : 'unknown' }
  }
}

/**
 * GET /api/admin/rabbitsign/debug?templateId=...
 * Inspects a RabbitSign template by trying common GET endpoints to discover
 * its defined sender field names. Use the response to align buildContractFields().
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const keyId = (process.env.RABBITSIGN_API_KEY_ID ?? '').trim()
    const secret = (process.env.RABBITSIGN_API_SECRET ?? '').trim()
    const url = new URL(req.url)
    const templateId =
      url.searchParams.get('templateId')?.trim() ||
      (process.env.RABBITSIGN_CONTRACT_TEMPLATE_ID ?? '').trim()

    if (!templateId) return NextResponse.json({ error: 'templateId required' }, { status: 400 })

    const results = await Promise.all([
      rabbit('GET', keyId, secret, `/api/v1/template/${templateId}`),
      rabbit('GET', keyId, secret, `/api/v1/templates/${templateId}`),
      rabbit('GET', keyId, secret, `/api/v1/folderFromTemplate/${templateId}`),
    ])

    return NextResponse.json({ templateId, results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
