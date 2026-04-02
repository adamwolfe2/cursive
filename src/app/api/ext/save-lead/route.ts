export const runtime = 'edge'

import { NextResponse } from 'next/server'

// Extension endpoints disabled — not ready for production use
export async function POST() {
  return NextResponse.json(
    { error: 'Extension API is temporarily disabled' },
    { status: 503 }
  )
}
