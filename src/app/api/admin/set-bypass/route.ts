import { NextResponse } from 'next/server'

// Public endpoint to set admin bypass cookie
// This allows admin to navigate the platform even when session cookies aren't working
export async function GET() {
  const response = NextResponse.json({
    success: true,
    message: 'Admin bypass cookie set - you can now navigate the platform',
    note: 'This cookie grants full platform access for demonstration purposes'
  })

  response.cookies.set('admin_bypass_waitlist', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })

  return response
}
