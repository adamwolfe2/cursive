import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: true, runtime: 'nodejs', ts: Date.now() })
}

export async function POST() {
  return NextResponse.json({ ok: true, runtime: 'nodejs', method: 'POST', ts: Date.now() })
}
