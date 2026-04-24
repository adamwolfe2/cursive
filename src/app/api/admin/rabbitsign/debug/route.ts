import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { requireAdmin } from '@/lib/auth/admin'

function sig(method: string, path: string, timestamp: string, secret: string) {
  return createHash('sha512').update(`${method} ${path} ${timestamp} ${secret}`).digest('hex').toUpperCase()
}

async function post(keyId: string, secret: string, urlPath: string, body: unknown) {
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const signature = sig('POST', urlPath, timestamp, secret)
  const bodyString = JSON.stringify(body)
  try {
    const res = await fetch(`https://www.rabbitsign.com${urlPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-rabbitsign-api-time-utc': timestamp,
        'x-rabbitsign-api-key-id': keyId,
        'x-rabbitsign-api-signature': signature,
      },
      body: bodyString,
    })
    const resBody = await res.text().catch(() => '')
    return { urlPath, status: res.status, response: resBody.slice(0, 200) }
  } catch (e) {
    return { urlPath, error: e instanceof Error ? e.message : 'unknown' }
  }
}

export async function GET() {
  try {
    await requireAdmin()

    const keyId = (process.env.RABBITSIGN_API_KEY_ID ?? '').trim()
    const secret = (process.env.RABBITSIGN_API_SECRET ?? '').trim()
    const templateId = (process.env.RABBITSIGN_CONTRACT_TEMPLATE_ID ?? '').trim()
    const today = new Date().toISOString().split('T')[0]

    const minimalRole = { roleName: 'Client', signerName: 'Test User', signerEmail: 'test@example.com' }

    const results = await Promise.all([
      // Current: templateId in URL path
      post(keyId, secret, `/api/v1/folderFromTemplate/${templateId}`, {
        title: 'Test', summary: 'test', date: today, senderFieldValues: {}, roles: [minimalRole],
      }),
      // Alt: templateId in body, no ID in path
      post(keyId, secret, `/api/v1/folderFromTemplate`, {
        templateId, title: 'Test', summary: 'test', date: today, senderFieldValues: {}, roles: [minimalRole],
      }),
      // Alt: different URL casing
      post(keyId, secret, `/api/v1/folder-from-template/${templateId}`, {
        title: 'Test', summary: 'test', date: today, senderFieldValues: {}, roles: [minimalRole],
      }),
      // Alt: createFolder with templateId
      post(keyId, secret, `/api/v1/folder`, {
        templateId, title: 'Test', summary: 'test', date: today, senderFieldValues: {}, roles: [minimalRole],
      }),
      // Alt: template endpoint
      post(keyId, secret, `/api/v1/template/${templateId}/create`, {
        title: 'Test', summary: 'test', date: today, senderFieldValues: {}, roles: [minimalRole],
      }),
    ])

    return NextResponse.json({ templateId, results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
