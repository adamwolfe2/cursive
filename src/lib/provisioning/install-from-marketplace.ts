// Shared "install → Cursive workspace + pixel + API key + portal login" flow.
//
// Called from both the GHL OAuth callback (once per location, looped for
// bulk agency installs) and the Shopify OAuth callback (once per shop).
//
// Responsibilities:
//   1. Idempotency — same (source, external_id) returns the existing install
//   2. Workspace creation — one Cursive workspace per install
//   3. Pixel provisioning — calls AudienceLab; pixel is stamped with the
//      workspace's webhook URL so visitor events auto-route to this tenant
//   4. Pixel→workspace mapping in audiencelab_pixels (required by the live
//      superpixel webhook at /api/webhooks/audiencelab/superpixel)
//   5. User profile creation for the installer (so the API key has an owner)
//   6. API key minting (csk_ format, scopes default to read + extension surface)
//   7. app_installs row linking marketplace identity → workspace
//   8. Magic-link URL that drops the installer into /dashboard already signed in

import { createAdminClient } from '@/lib/supabase/admin'
import { provisionCustomerPixel } from '@/lib/audiencelab/api-client'
import { createApiKey } from '@/lib/services/workspace-settings.service'
import { generatePortalMagicLink } from '@/lib/provisioning/magic-link'

export type AppInstallSource = 'ghl' | 'shopify'

export interface ProvisionFromInstallParams {
  source: AppInstallSource
  // Source-specific canonical ID (GHL location_id, Shopify shop domain)
  externalId: string
  // Optional source-specific grouping ID (GHL agency company_id)
  externalParentId?: string
  // Human-readable name shown in Cursive portal (shop name, location name)
  externalName: string
  // Installer identity — used for magic-link and user profile
  installerEmail: string
  installerName?: string
  // URL the pixel will deploy to (funnel domain, shop domain)
  siteUrl: string
  // Marketplace OAuth
  accessToken: string
  refreshToken?: string
  tokenExpiresAt?: Date
  scopes?: string[]
  // Source-specific stash (GHL custom values, Shopify shop metadata, etc.)
  metadata?: Record<string, unknown>
}

export interface ProvisionFromInstallResult {
  install: {
    id: string
    isNew: boolean
  }
  workspace: {
    id: string
    slug: string
    name: string
  }
  pixel: {
    id: string
    installUrl: string
    snippet: string
  }
  apiKey: {
    id: string
    plainKey: string // shown once only
  } | null
  portalUrl: string // magic link — drops installer into /dashboard signed in
}

/**
 * Provision everything needed for a marketplace install to light up:
 * workspace, pixel, API key, install record, magic-link portal URL.
 *
 * Idempotent on (source, external_id). Re-running for the same install:
 *  - if install is active → returns existing workspace + pixel, refreshed magic-link
 *  - if install was previously uninstalled → reactivates it with new tokens
 *  - if workspace got deleted out from under us → throws (manual intervention required)
 *
 * Call this from OAuth callbacks BEFORE redirecting the user. On success the
 * returned portalUrl can be used as a 302 Location header.
 */
export async function provisionFromInstall(
  params: ProvisionFromInstallParams,
): Promise<ProvisionFromInstallResult> {
  const admin = createAdminClient()

  // 1. Idempotency — has this install been seen before?
  const { data: existing } = await admin
    .from('app_installs')
    .select('id, workspace_id, pixel_id, pixel_install_url, status')
    .eq('source', params.source)
    .eq('external_id', params.externalId)
    .maybeSingle()

  if (existing) {
    return reactivateExistingInstall(admin, existing, params)
  }

  // 2. Create workspace
  const slug = await generateUniqueSlug(admin, params.externalName, params.source)
  const { data: workspace, error: wsErr } = await admin
    .from('workspaces')
    .insert({
      name: params.externalName,
      slug,
      subdomain: slug,
      onboarding_status: 'completed',
      settings: {
        install_source: params.source,
      },
    })
    .select('id, slug, name')
    .maybeSingle()

  if (wsErr || !workspace) {
    throw new Error(`Workspace creation failed: ${wsErr?.message ?? 'no row returned'}`)
  }

  // 3. Create auth user + user profile for the installer
  // The magic-link generator will reuse this auth user; creating it here first
  // lets us tie the API key to a real users row.
  const { authUserId, userId } = await ensureUser(admin, {
    email: params.installerEmail,
    fullName: params.installerName ?? params.externalName,
    workspaceId: workspace.id,
  })

  // 4. Provision AudienceLab pixel.
  // The webhookUrl defaults inside provisionCustomerPixel to our live superpixel
  // handler; every resolution event carries the pixel_id → workspace_id mapping
  // stored in audiencelab_pixels (step 5) is what isolates tenants.
  const pixel = await provisionCustomerPixel({
    websiteName: params.externalName,
    websiteUrl: params.siteUrl,
  })

  // 5. Stamp pixel→workspace mapping (the isolation wire)
  await admin.from('audiencelab_pixels').upsert(
    {
      workspace_id: workspace.id,
      pixel_id: pixel.pixel_id,
      domain: normalizeDomain(params.siteUrl),
      is_active: true,
    },
    { onConflict: 'pixel_id' },
  )

  // 6. Mint workspace API key for the install to call back with (Shopify
  // extension runtime, GHL CustomJS widget, future MCP surface)
  const keyResult = await createApiKey(workspace.id, userId, {
    name: `${params.source}-install`,
    scopes: ['read:leads', 'read:campaigns', 'read:analytics'],
  })

  // 7. Insert app_installs row
  const { data: install, error: installErr } = await admin
    .from('app_installs')
    .insert({
      source: params.source,
      external_id: params.externalId,
      external_parent_id: params.externalParentId,
      external_name: params.externalName,
      workspace_id: workspace.id,
      pixel_id: pixel.pixel_id,
      pixel_install_url: pixel.install_url,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      token_expires_at: params.tokenExpiresAt?.toISOString(),
      scopes: params.scopes,
      installer_email: params.installerEmail,
      installer_name: params.installerName,
      site_url: params.siteUrl,
      status: 'active',
      metadata: params.metadata ?? {},
    })
    .select('id')
    .maybeSingle()

  if (installErr || !install) {
    throw new Error(`app_installs insert failed: ${installErr?.message ?? 'no row returned'}`)
  }

  // 8. Magic-link for portal redirect
  const { url: portalUrl } = await generatePortalMagicLink({
    email: params.installerEmail,
    redirectPath: '/dashboard',
    metadata: {
      source: params.source,
      workspace_id: workspace.id,
      install_id: install.id,
    },
  })

  return {
    install: { id: install.id, isNew: true },
    workspace,
    pixel: {
      id: pixel.pixel_id,
      installUrl: pixel.install_url,
      snippet: buildSnippet(pixel.install_url),
    },
    apiKey: keyResult.success && keyResult.apiKey
      ? { id: keyResult.apiKey.id, plainKey: keyResult.apiKey.key }
      : null,
    portalUrl,
  }
}

// ---------------------------------------------------------------------------

type AdminClient = ReturnType<typeof createAdminClient>

type ExistingInstallRow = {
  id: string
  workspace_id: string
  pixel_id: string | null
  pixel_install_url: string | null
  status: string
}

async function reactivateExistingInstall(
  admin: AdminClient,
  existing: ExistingInstallRow,
  params: ProvisionFromInstallParams,
): Promise<ProvisionFromInstallResult> {
  // Refresh tokens + status even if install was already active; a reinstall
  // means the user granted fresh credentials.
  const { error: updateErr } = await admin
    .from('app_installs')
    .update({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      token_expires_at: params.tokenExpiresAt?.toISOString(),
      scopes: params.scopes,
      installer_email: params.installerEmail,
      installer_name: params.installerName,
      site_url: params.siteUrl,
      external_name: params.externalName,
      external_parent_id: params.externalParentId,
      metadata: params.metadata ?? {},
      status: 'active',
      uninstalled_at: null,
      last_refreshed_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  if (updateErr) {
    throw new Error(`app_installs refresh failed: ${updateErr.message}`)
  }

  const { data: workspace } = await admin
    .from('workspaces')
    .select('id, slug, name')
    .eq('id', existing.workspace_id)
    .maybeSingle()

  if (!workspace) {
    throw new Error(
      `Install ${existing.id} references missing workspace ${existing.workspace_id} — manual intervention required`,
    )
  }

  if (!existing.pixel_id || !existing.pixel_install_url) {
    throw new Error(
      `Install ${existing.id} is missing pixel data — run the pixel backfill before retrying`,
    )
  }

  const { url: portalUrl } = await generatePortalMagicLink({
    email: params.installerEmail,
    redirectPath: '/dashboard',
    metadata: {
      source: params.source,
      workspace_id: existing.workspace_id,
      install_id: existing.id,
    },
  })

  return {
    install: { id: existing.id, isNew: false },
    workspace,
    pixel: {
      id: existing.pixel_id,
      installUrl: existing.pixel_install_url,
      snippet: buildSnippet(existing.pixel_install_url),
    },
    apiKey: null, // existing keys are not re-issued on reinstall
    portalUrl,
  }
}

async function generateUniqueSlug(
  admin: AdminClient,
  baseName: string,
  source: AppInstallSource,
): Promise<string> {
  const normalized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40)
  const base = normalized || `${source}-install`

  const { data: collision } = await admin
    .from('workspaces')
    .select('id')
    .eq('slug', base)
    .maybeSingle()

  if (!collision) return base

  const suffix = crypto.randomUUID().replace(/-/g, '').substring(0, 6)
  return `${base}-${suffix}`
}

async function ensureUser(
  admin: AdminClient,
  params: { email: string; fullName: string; workspaceId: string },
): Promise<{ authUserId: string; userId: string }> {
  // Look up existing auth user by email.
  const { data: existingUserProfile } = await admin
    .from('users')
    .select('id, auth_user_id, workspace_id')
    .eq('email', params.email)
    .maybeSingle()

  if (existingUserProfile) {
    // If the existing user is bound to a different workspace, we still reuse
    // their auth identity but DO NOT rewrite their primary workspace — Cursive
    // treats users as belonging to one workspace. The new install's magic-link
    // will still route them into the new workspace via session targeting.
    return {
      authUserId: existingUserProfile.auth_user_id,
      userId: existingUserProfile.id,
    }
  }

  // Create Supabase auth user (idempotent — returns existing if already there).
  // Using inviteUserByEmail-adjacent path: createUser with email_confirm = true
  // so the subsequent magic-link lands on an already-confirmed account.
  const { data: authResult, error: authErr } = await admin.auth.admin.createUser({
    email: params.email,
    email_confirm: true,
    user_metadata: {
      full_name: params.fullName,
      source: 'marketplace_install',
    },
  })

  let authUserId: string
  if (authErr) {
    // Email may already exist in auth.users without a users row (orphaned).
    // Look it up to recover.
    if (/already.*registered|duplicate/i.test(authErr.message)) {
      const { data: lookup } = await admin.auth.admin.listUsers()
      const match = lookup?.users?.find((u) => u.email === params.email)
      if (!match) {
        throw new Error(`Auth user lookup failed after duplicate-email error: ${authErr.message}`)
      }
      authUserId = match.id
    } else {
      throw new Error(`Auth user creation failed: ${authErr.message}`)
    }
  } else if (authResult?.user) {
    authUserId = authResult.user.id
  } else {
    throw new Error('Auth user creation returned no user')
  }

  // Insert users row
  const { data: userRow, error: userErr } = await admin
    .from('users')
    .insert({
      auth_user_id: authUserId,
      workspace_id: params.workspaceId,
      email: params.email,
      full_name: params.fullName,
      role: 'owner' as const,
      plan: 'free' as const,
      is_partner: false,
      is_active: true,
    })
    .select('id')
    .maybeSingle()

  if (userErr || !userRow) {
    throw new Error(`users row insert failed: ${userErr?.message ?? 'no row returned'}`)
  }

  return { authUserId, userId: userRow.id }
}

function normalizeDomain(urlOrDomain: string): string {
  try {
    const url = urlOrDomain.startsWith('http') ? new URL(urlOrDomain) : new URL(`https://${urlOrDomain}`)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return urlOrDomain
  }
}

function buildSnippet(installUrl: string): string {
  return `<script src="${installUrl}" defer></script>`
}
