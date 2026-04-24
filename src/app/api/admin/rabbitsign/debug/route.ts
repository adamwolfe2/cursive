import { NextResponse } from 'next/server'
import { createHash, createHmac } from 'crypto'
import { requireAdmin } from '@/lib/auth/admin'

async function tryVariant(label: string, method: string, urlPath: string, sigFn: () => string, body?: string) {
  const keyId = process.env.RABBITSIGN_API_KEY_ID ?? ''
  const sig = sigFn()
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

  try {
    const res = await fetch(`https://www.rabbitsign.com${urlPath}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-rabbitsign-api-time-utc': timestamp,
        'x-rabbitsign-api-key-id': keyId,
        'x-rabbitsign-api-signature': sig,
      },
      body,
    })

    let resBody = ''
    try { resBody = await res.text() } catch {}

    return {
      label,
      status: res.status,
      // 403 = auth fail, 404/400/500 = auth passed but request issue
      authPassed: res.status !== 403,
      body: resBody.slice(0, 100),
    }
  } catch (e) {
    return { label, error: e instanceof Error ? e.message : 'unknown' }
  }
}

export async function GET() {
  try {
    await requireAdmin()

    const keyId = process.env.RABBITSIGN_API_KEY_ID ?? ''
    const secret = process.env.RABBITSIGN_API_SECRET ?? ''
    const templateId = process.env.RABBITSIGN_CONTRACT_TEMPLATE_ID ?? ''

    // Use a GET to folder status — 404 if auth passes but folder doesn't exist
    const testUrlPath = '/api/v1/folder/debug-test-id-does-not-exist'
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

    const variants: Array<[string, () => string]> = [
      ['A-sha512-plain', () =>
        createHash('sha512').update(`GET ${testUrlPath} ${timestamp} ${secret}`).digest('hex').toUpperCase()],
      ['B-hmac-sha512', () =>
        createHmac('sha512', secret).update(`GET ${testUrlPath} ${timestamp}`).digest('hex').toUpperCase()],
      ['C-sha512-keyid', () =>
        createHash('sha512').update(`GET ${testUrlPath} ${timestamp} ${keyId}`).digest('hex').toUpperCase()],
      ['D-sha512-keyid-colon-secret', () =>
        createHash('sha512').update(`GET ${testUrlPath} ${timestamp} ${keyId}:${secret}`).digest('hex').toUpperCase()],
      ['E-sha256-plain', () =>
        createHash('sha256').update(`GET ${testUrlPath} ${timestamp} ${secret}`).digest('hex').toUpperCase()],
      ['F-sha512-lowercase', () =>
        createHash('sha512').update(`GET ${testUrlPath} ${timestamp} ${secret}`).digest('hex')],
      ['G-sha512-base64', () =>
        createHash('sha512').update(`GET ${testUrlPath} ${timestamp} ${secret}`).digest('base64')],
      ['H-sha512-epoch-ts', () => {
        const epoch = Math.floor(Date.now() / 1000).toString()
        return createHash('sha512').update(`GET ${testUrlPath} ${epoch} ${secret}`).digest('hex').toUpperCase()
      }],
    ]

    const results = await Promise.all(
      variants.map(([label, fn]) => tryVariant(label, 'GET', testUrlPath, fn))
    )

    return NextResponse.json({
      keyIdSnip: keyId ? `${keyId.slice(0, 6)}...${keyId.slice(-4)} (len=${keyId.length})` : 'MISSING',
      secretLength: secret.length,
      templateIdLength: templateId.length,
      timestamp,
      results,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
