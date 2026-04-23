import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { requireAdmin } from '@/lib/auth/admin'

export async function GET() {
  try {
    await requireAdmin()

    const keyId = process.env.RABBITSIGN_API_KEY_ID ?? ''
    const secret = process.env.RABBITSIGN_API_SECRET ?? ''

    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const testPath = '/api/v1/folder/test-id'
    const payload = `GET ${testPath} ${timestamp} ${secret}`
    const sig = createHash('sha512').update(payload).digest('hex').toUpperCase()

    return NextResponse.json({
      keyId: keyId ? `${keyId.slice(0, 4)}...${keyId.slice(-4)} (${keyId.length} chars)` : 'MISSING',
      secretLength: secret.length,
      secretLastCharCode: secret.charCodeAt(secret.length - 1),
      timestamp,
      testPayloadPrefix: `GET ${testPath} ${timestamp} `,
      sig: sig.slice(0, 16) + '...',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
