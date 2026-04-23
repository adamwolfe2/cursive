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
    const templateId = process.env.RABBITSIGN_CONTRACT_TEMPLATE_ID ?? 'NO_TEMPLATE'
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

    // Three path variants to identify which format RabbitSign expects
    const pathFull = `/api/v1/folderFromTemplate/${templateId}`
    const pathShort = `/folderFromTemplate/${templateId}`
    const pathVer = `/v1/folderFromTemplate/${templateId}`

    return NextResponse.json({
      keyId: keyId ? `${keyId.slice(0, 6)}...${keyId.slice(-4)} (len=${keyId.length})` : 'MISSING',
      secretLength: secret.length,
      secretLastCharCode: secret.charCodeAt(secret.length - 1),
      secretFirstCharCode: secret.charCodeAt(0),
      templateId: templateId ? `${templateId.slice(0, 8)}... (len=${templateId.length})` : 'MISSING',
      timestamp,
      // Partial signatures (first 20 chars) for each path variant
      sig_fullPath: sig('POST', pathFull, timestamp, secret).slice(0, 20),
      sig_shortPath: sig('POST', pathShort, timestamp, secret).slice(0, 20),
      sig_v1Path: sig('POST', pathVer, timestamp, secret).slice(0, 20),
      // Same but with lowercase method (just in case)
      sig_lowercaseMethod: sig('post', pathFull, timestamp, secret).slice(0, 20),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
