import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  return NextResponse.json({ ok: true, runtime: 'edge', ts: Date.now() })
}

export async function POST() {
  return NextResponse.json({ ok: true, runtime: 'edge', method: 'POST', ts: Date.now() })
}
