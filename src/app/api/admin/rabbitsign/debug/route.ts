import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { requireAdmin } from '@/lib/auth/admin'

function sig(method: string, path: string, timestamp: string, secret: string) {
  return createHash('sha512').update(`${method} ${path} ${timestamp} ${secret}`).digest('hex').toUpperCase()
}

export async function GET() {
  try {
    await requireAdmin()

    const keyId = process.env.RABBITSIGN_API_KEY_ID ?? ''
    const secret = process.env.RABBITSIGN_API_SECRET ?? ''
    const templateId = (process.env.RABBITSIGN_CONTRACT_TEMPLATE_ID ?? '').trim()

    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const urlPath = `/api/v1/folderFromTemplate/${templateId}`
    const signature = sig('POST', urlPath, timestamp, secret)

    const today = new Date().toISOString().split('T')[0]

    // Minimal body — exactly what we'd send for a real contract
    const body = {
      title: 'Debug Test Contract',
      summary: 'Debug test',
      date: today,
      senderFieldValues: {
        client_company: 'Test Company',
        setup_fee: '$250',
        monthly_fee: '$154',
      },
      roles: [
        { roleName: 'Client', signerName: 'Test User', signerEmail: 'test@example.com' },
      ],
    }

    const bodyString = JSON.stringify(body)

    const res = await fetch(`https://www.rabbitsign.com${urlPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rabbitsign-api-time-utc': timestamp,
        'x-rabbitsign-api-key-id': keyId,
        'x-rabbitsign-api-signature': signature,
      },
      body: bodyString,
    })

    let resBody = ''
    try { resBody = await res.text() } catch {}

    return NextResponse.json({
      templateId: `${templateId.slice(0, 8)}... (len=${templateId.length})`,
      urlPath,
      bodyByteLength: Buffer.byteLength(bodyString, 'utf8'),
      bodySent: body,
      status: res.status,
      authPassed: res.status !== 403,
      response: resBody.slice(0, 300),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
