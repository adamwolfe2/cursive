import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { requireAdmin } from '@/lib/auth/admin'

function sig(method: string, path: string, timestamp: string, secret: string) {
  return createHash('sha512').update(`${method} ${path} ${timestamp} ${secret}`).digest('hex').toUpperCase()
}

async function postVariant(label: string, keyId: string, secret: string, urlPath: string, body: unknown) {
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const signature = sig('POST', urlPath, timestamp, secret)
  const bodyString = JSON.stringify(body)

  try {
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
    return { label, status: res.status, response: resBody.slice(0, 150) }
  } catch (e) {
    return { label, error: e instanceof Error ? e.message : 'unknown' }
  }
}

export async function GET() {
  try {
    await requireAdmin()

    const keyId = (process.env.RABBITSIGN_API_KEY_ID ?? '').trim()
    const secret = (process.env.RABBITSIGN_API_SECRET ?? '').trim()
    const templateId = (process.env.RABBITSIGN_CONTRACT_TEMPLATE_ID ?? '').trim()
    const urlPath = `/api/v1/folderFromTemplate/${templateId}`
    const today = new Date().toISOString().split('T')[0]

    const baseRole = { roleName: 'Client', signerName: 'Test User', signerEmail: 'test@example.com' }
    const baseFields = { client_company: 'Test Company', setup_fee: '$250', monthly_fee: '$154' }

    const results = await Promise.all([
      // A: current format
      postVariant('A-current', keyId, secret, urlPath, {
        title: 'Test', summary: 'test', date: today,
        senderFieldValues: baseFields,
        roles: [baseRole],
      }),
      // B: roles with email/name instead of signerEmail/signerName
      postVariant('B-roles-email-name', keyId, secret, urlPath, {
        title: 'Test', summary: 'test', date: today,
        senderFieldValues: baseFields,
        roles: [{ roleName: 'Client', name: 'Test User', email: 'test@example.com' }],
      }),
      // C: no senderFieldValues
      postVariant('C-no-fields', keyId, secret, urlPath, {
        title: 'Test', summary: 'test', date: today,
        roles: [baseRole],
      }),
      // D: empty senderFieldValues
      postVariant('D-empty-fields', keyId, secret, urlPath, {
        title: 'Test', summary: 'test', date: today,
        senderFieldValues: {},
        roles: [baseRole],
      }),
      // E: no summary/date
      postVariant('E-minimal', keyId, secret, urlPath, {
        title: 'Test',
        senderFieldValues: baseFields,
        roles: [baseRole],
      }),
      // F: signers array instead of roles
      postVariant('F-signers', keyId, secret, urlPath, {
        title: 'Test', summary: 'test', date: today,
        senderFieldValues: baseFields,
        signers: [{ roleName: 'Client', signerName: 'Test User', signerEmail: 'test@example.com' }],
      }),
      // G: both roles (AM Collective + Client)
      postVariant('G-both-roles', keyId, secret, urlPath, {
        title: 'Test', summary: 'test', date: today,
        senderFieldValues: baseFields,
        roles: [
          { roleName: 'AM Collective', signerName: 'Adam Wolfe', signerEmail: 'adamwolfe100@gmail.com' },
          { roleName: 'Client', signerName: 'Test User', signerEmail: 'test@example.com' },
        ],
      }),
    ])

    return NextResponse.json({ templateId, results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
