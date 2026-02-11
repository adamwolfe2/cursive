import { NextResponse } from 'next/server'

// Explicitly use Node.js runtime (NOT edge) to test serverless function behavior
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ ok: true, runtime: 'nodejs', ts: Date.now() })
}

export async function POST() {
  return NextResponse.json({ ok: true, runtime: 'nodejs', method: 'POST', ts: Date.now() })
}
