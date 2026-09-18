import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import { isAllowedInstallUrl } from '@/lib/pixel/install-url'

/**
 * Public, unauthenticated: resolves a Cursive pixel id to its provisioned
 * AudienceLab script. Loaded by public/pixel.js on customer sites.
 *
 * Service-role read is justified: the caller is an anonymous site visitor, and
 * the only value returned (install_url) is already public in the customer's
 * page source. Nothing else from the row is exposed.
 */
const PIXEL_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function noop(reason: string, cacheSeconds: number) {
  return new NextResponse(`/* cursive: ${reason} */`, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
    },
  })
}

export async function GET(_req: Request, { params }: { params: Promise<{ pixelId: string }> }) {
  const { pixelId } = await params
  if (!PIXEL_ID.test(pixelId)) return noop('invalid pixel id', 3600)

  const { data, error } = await createAdminClient()
    .from('audiencelab_pixels')
    .select('install_url')
    .eq('pixel_id', pixelId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (error) {
    safeError('[pixel/script] lookup failed', error)
    return noop('lookup failed', 30)
  }
  if (!isAllowedInstallUrl(data?.install_url)) return noop('pixel not found', 300)

  return NextResponse.redirect(data.install_url, {
    status: 302,
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  })
}
