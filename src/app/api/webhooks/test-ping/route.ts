import { NextResponse } from 'next/server'

// SECURITY: This endpoint is restricted to non-production environments only.
// It was previously open to the public with no authentication.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, runtime: 'edge', ts: Date.now() })
}

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, runtime: 'edge', method: 'POST', ts: Date.now() })
}
