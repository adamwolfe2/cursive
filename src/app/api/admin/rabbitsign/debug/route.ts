import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { request as httpsRequest } from 'node:https'
import { requireAdmin } from '@/lib/auth/admin'

function sig(method: string, path: string, timestamp: string, secret: string) {
  return createHash('sha512').update(`${method} ${path} ${timestamp} ${secret}`).digest('hex').toUpperCase()
}

function rawHttpsPost(path: string, headers: Record<string, string>, body: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname: 'www.rabbitsign.com',
        path,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }))
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

export async function GET() {
  try {
    await requireAdmin()

    const keyId = (process.env.RABBITSIGN_API_KEY_ID ?? '').trim()
    const secret = (process.env.RABBITSIGN_API_SECRET ?? '').trim()
    const templateId = (process.env.RABBITSIGN_CONTRACT_TEMPLATE_ID ?? '').trim()
    const urlPath = `/api/v1/folderFromTemplate/${templateId}`
    const today = new Date().toISOString().split('T')[0]
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const signature = sig('POST', urlPath, timestamp, secret)

    const body = JSON.stringify({
      title: 'Debug Test',
      summary: 'test',
      date: today,
      senderFieldValues: {},
      roles: [{ roleName: 'Client', signerName: 'Test User', signerEmail: 'test@example.com' }],
    })

    // Test 1: raw https.request (HTTP/1.1, full control)
    const rawResult = await rawHttpsPost(urlPath, {
      'Content-Type': 'application/json',
      'x-rabbitsign-api-time-utc': timestamp,
      'x-rabbitsign-api-key-id': keyId,
      'x-rabbitsign-api-signature': signature,
    }, body)

    // Test 2: fetch with explicit Accept header
    const ts2 = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const sig2 = sig('POST', urlPath, ts2, secret)
    const fetchRes = await fetch(`https://www.rabbitsign.com${urlPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-rabbitsign-api-time-utc': ts2,
        'x-rabbitsign-api-key-id': keyId,
        'x-rabbitsign-api-signature': sig2,
      },
      body,
    })
    const fetchBody = await fetchRes.text().catch(() => '')

    return NextResponse.json({
      templateId,
      urlPath,
      bodySent: body,
      rawHttps: { status: rawResult.status, response: rawResult.body.slice(0, 200) },
      fetchWithAccept: { status: fetchRes.status, response: fetchBody.slice(0, 200) },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
