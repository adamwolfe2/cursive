// Marketplace install → portal magic link
//
// After a GHL or Shopify install provisions a Cursive workspace, the user
// needs to land in the Cursive portal already authenticated. Supabase Auth's
// admin.generateLink creates a one-time token that verifies the email and
// sets a session — same mechanism as passwordless sign-in, but triggered
// programmatically from our callback instead of from a user-clicked email.

import { createAdminClient } from '@/lib/supabase/admin'

type GenerateResult = {
  url: string
  expiresAt: Date
}

const DEFAULT_REDIRECT_PATH = '/dashboard'

/**
 * Generate a magic sign-in link for a workspace installer.
 *
 * The link verifies the installer's email and drops them into the portal at
 * the provided redirect path. If the user doesn't yet exist in Supabase Auth,
 * the admin client auto-creates them on link generation.
 *
 * @param email Installer email from the marketplace OAuth payload
 * @param redirectPath App-relative destination after login (default: /dashboard)
 * @param metadata Stored on the Supabase user for later lookup (source, workspace)
 */
export async function generatePortalMagicLink(params: {
  email: string
  redirectPath?: string
  metadata?: Record<string, unknown>
}): Promise<GenerateResult> {
  const supabase = createAdminClient()
  const baseUrl = getBaseUrl()
  const redirectPath = params.redirectPath ?? DEFAULT_REDIRECT_PATH

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: params.email,
    options: {
      redirectTo: `${baseUrl}${redirectPath}`,
      data: params.metadata,
    },
  })

  if (error || !data?.properties?.action_link) {
    throw new Error(`Failed to generate magic link: ${error?.message ?? 'no action_link in response'}`)
  }

  // Supabase default: magic links expire in 1 hour; we surface this for callers
  // that want to display the expiry to the user.
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  return {
    url: data.properties.action_link,
    expiresAt,
  }
}

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com'
  return raw.replace(/\/$/, '')
}
