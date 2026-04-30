/**
 * GHL Marketplace App — OAuth callback.
 *
 * Handles the post-consent redirect. For agency-level installs this loops
 * over `/oauth/installedLocations` and provisions a Cursive workspace per
 * location via provisionFromInstall(). For location-level installs (single
 * sub-account) it provisions just one.
 *
 * Resulting redirect: agency → /admin/marketplace/ghl-overview (sees all
 * locations they just provisioned). Single location → magic-link into the
 * new workspace's portal directly.
 */

export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { provisionFromInstall } from '@/lib/provisioning/install-from-marketplace'
import {
  exchangeGhlCode,
  listInstalledLocations,
  mintLocationToken,
  upsertCustomValue,
} from '@/lib/marketplace/ghl/client'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'

// The 6 custom values written to each GHL location after pixel provision.
// Per PRD §F2 — exposes our pixel state inside the GHL location's UI.
function buildCustomValues(params: {
  pixelId: string
  pixelInstallUrl: string
  agencyCompanyId?: string | null
}): Array<{ name: string; value: string }> {
  return [
    { name: 'identity_pixel_id', value: params.pixelId },
    { name: 'identity_pixel_type', value: 'subaccount' },
    { name: 'identity_pixel_status', value: 'pending' },
    { name: 'identity_pixel_version', value: 'v4' },
    { name: 'identity_pixel_install_url', value: params.pixelInstallUrl },
    {
      name: 'identity_agency_company_id',
      value: params.agencyCompanyId ?? '',
    },
  ]
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // Provider-side error (user denied, etc.)
  if (error) {
    safeError('[ghl-app callback] provider error', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=ghl_install_denied', url),
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard?error=ghl_install_no_code', url),
    )
  }

  // CSRF state check
  const cookieState = req.cookies.get('ghl_oauth_state')?.value
  if (state && cookieState && state !== cookieState) {
    safeError('[ghl-app callback] state mismatch')
    return NextResponse.redirect(
      new URL('/dashboard?error=ghl_install_state_mismatch', url),
    )
  }

  const clientId = process.env.GHL_APP_CLIENT_ID
  const clientSecret = process.env.GHL_APP_CLIENT_SECRET
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com').replace(/\/$/, '')
  const redirectUri = `${baseUrl}/api/integrations/ghl-app/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'GHL marketplace app not configured' },
      { status: 503 },
    )
  }

  try {
    // 1. Exchange code → tokens
    const tokenResp = await exchangeGhlCode({
      code,
      clientId,
      clientSecret,
      redirectUri,
    })

    safeLog('[ghl-app callback] token exchange ok', {
      userType: tokenResp.userType,
      companyId: tokenResp.companyId,
      locationId: tokenResp.locationId,
    })

    // 2. Branch on install type
    if (tokenResp.userType === 'Company' && tokenResp.companyId) {
      // Agency install — provision every location
      return await handleAgencyInstall({
        req,
        tokenResp,
        baseUrl,
      })
    } else if (tokenResp.locationId) {
      // Single-location install — provision just this one
      return await handleLocationInstall({
        req,
        tokenResp,
        baseUrl,
      })
    } else {
      throw new Error('Token response missing both companyId and locationId')
    }
  } catch (err) {
    safeError('[ghl-app callback] failure', err)
    void sendSlackAlert({
      type: 'system_event',
      severity: 'error',
      message: `GHL marketplace install failed: ${err instanceof Error ? err.message : String(err)}`,
    })
    return NextResponse.redirect(
      new URL('/dashboard?error=ghl_install_failed', url),
    )
  }
}

// ---------------------------------------------------------------------------
// Agency install (bulk)
// ---------------------------------------------------------------------------

async function handleAgencyInstall(params: {
  req: NextRequest
  tokenResp: Awaited<ReturnType<typeof exchangeGhlCode>>
  baseUrl: string
}): Promise<NextResponse> {
  const { tokenResp, baseUrl } = params
  const admin = createAdminClient()
  const companyId = tokenResp.companyId!

  const appId = process.env.GHL_APP_ID
  if (!appId) {
    throw new Error('GHL_APP_ID env var required for bulk install')
  }

  // Look up locations the agency has installed the app on
  const locations = await listInstalledLocations({
    agencyAccessToken: tokenResp.access_token,
    appId,
    companyId,
  })

  safeLog('[ghl-app callback] agency install — found locations', {
    count: locations.length,
    companyId,
  })

  // Provision each location (sequentially to respect GHL rate limits;
  // could batch if ever needed)
  let firstInstallerEmail: string | null = null
  let firstWorkspaceId: string | null = null
  let firstPortalUrl: string | null = null
  let succeeded = 0
  let failed = 0

  for (const loc of locations) {
    if (!loc.isInstalled) continue

    try {
      // Mint a per-location token
      const locToken = await mintLocationToken({
        agencyAccessToken: tokenResp.access_token,
        companyId,
        locationId: loc._id,
      })

      // Look up location details for site URL + name + email
      // (Simplified — would call /locations/{id} for full details. For MVP,
      //  use the location name and skip site URL until manually configured.)
      const installerEmail = await fetchLocationEmail({
        accessToken: locToken.access_token,
        locationId: loc._id,
        admin,
        fallback: 'agency-install@meetcursive.com',
      })

      const result = await provisionFromInstall({
        source: 'ghl',
        externalId: loc._id,
        externalParentId: companyId,
        externalName: loc.name || `GHL Location ${loc._id.slice(0, 6)}`,
        installerEmail,
        siteUrl: `https://app.gohighlevel.com/v2/location/${loc._id}`,
        accessToken: locToken.access_token,
        refreshToken: locToken.refresh_token,
        tokenExpiresAt: new Date(Date.now() + locToken.expires_in * 1000),
        scopes: locToken.scope.split(' '),
        metadata: {
          ghl_location_id: loc._id,
          ghl_company_id: companyId,
          install_type: 'agency_bulk',
        },
      })

      // Write our 6 Custom Values into the GHL location so the pixel state
      // is visible inside their location settings.
      const customValues = buildCustomValues({
        pixelId: result.pixel.id,
        pixelInstallUrl: result.pixel.installUrl,
        agencyCompanyId: companyId,
      })
      for (const cv of customValues) {
        try {
          await upsertCustomValue({
            accessToken: locToken.access_token,
            locationId: loc._id,
            name: cv.name,
            value: cv.value,
          })
        } catch (cvErr) {
          // Custom values are best-effort — don't fail the install
          safeError('[ghl-app callback] custom value write failed', {
            locationId: loc._id,
            name: cv.name,
            err: cvErr instanceof Error ? cvErr.message : String(cvErr),
          })
        }
      }

      // Track first install for the redirect
      if (!firstWorkspaceId) {
        firstWorkspaceId = result.workspace.id
        firstInstallerEmail = installerEmail
        firstPortalUrl = result.portalUrl
      }

      succeeded++
    } catch (locErr) {
      failed++
      safeError('[ghl-app callback] location provision failed', {
        locationId: loc._id,
        err: locErr instanceof Error ? locErr.message : String(locErr),
      })
    }
  }

  safeLog('[ghl-app callback] agency install complete', { succeeded, failed })

  if (failed > 0) {
    void sendSlackAlert({
      type: 'system_event',
      severity: 'warning',
      message: `GHL agency install partial failure — companyId=${companyId} succeeded=${succeeded} failed=${failed}`,
    })
  }

  // Redirect into the first provisioned workspace's portal (most users only
  // have one location at install time)
  if (firstPortalUrl) {
    return NextResponse.redirect(firstPortalUrl)
  }

  return NextResponse.redirect(new URL('/dashboard?ghl_installed=1', params.baseUrl))
}

// ---------------------------------------------------------------------------
// Single-location install
// ---------------------------------------------------------------------------

async function handleLocationInstall(params: {
  req: NextRequest
  tokenResp: Awaited<ReturnType<typeof exchangeGhlCode>>
  baseUrl: string
}): Promise<NextResponse> {
  const { tokenResp, baseUrl } = params
  const admin = createAdminClient()
  const locationId = tokenResp.locationId!

  const installerEmail = await fetchLocationEmail({
    accessToken: tokenResp.access_token,
    locationId,
    admin,
    fallback: 'location-install@meetcursive.com',
  })

  const result = await provisionFromInstall({
    source: 'ghl',
    externalId: locationId,
    externalParentId: tokenResp.companyId,
    externalName: `GHL Location ${locationId.slice(0, 6)}`,
    installerEmail,
    siteUrl: `https://app.gohighlevel.com/v2/location/${locationId}`,
    accessToken: tokenResp.access_token,
    refreshToken: tokenResp.refresh_token,
    tokenExpiresAt: new Date(Date.now() + tokenResp.expires_in * 1000),
    scopes: tokenResp.scope.split(' '),
    metadata: {
      ghl_location_id: locationId,
      ghl_company_id: tokenResp.companyId ?? null,
      install_type: 'single_location',
    },
  })

  // Write the 6 Custom Values
  const customValues = buildCustomValues({
    pixelId: result.pixel.id,
    pixelInstallUrl: result.pixel.installUrl,
    agencyCompanyId: tokenResp.companyId ?? null,
  })
  for (const cv of customValues) {
    try {
      await upsertCustomValue({
        accessToken: tokenResp.access_token,
        locationId,
        name: cv.name,
        value: cv.value,
      })
    } catch (cvErr) {
      safeError('[ghl-app callback] custom value write failed', {
        locationId,
        name: cv.name,
        err: cvErr instanceof Error ? cvErr.message : String(cvErr),
      })
    }
  }

  return NextResponse.redirect(result.portalUrl)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LocationDetailsSchema = z.object({
  location: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    domain: z.string().optional(),
  }),
})

async function fetchLocationEmail(params: {
  accessToken: string
  locationId: string
  admin: ReturnType<typeof createAdminClient>
  fallback: string
}): Promise<string> {
  try {
    const res = await fetch(
      `https://services.leadconnectorhq.com/locations/${encodeURIComponent(params.locationId)}`,
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          Version: '2021-07-28',
          Accept: 'application/json',
        },
      },
    )
    if (!res.ok) return params.fallback

    const json = LocationDetailsSchema.safeParse(await res.json())
    if (!json.success) return params.fallback

    return json.data.location.email ?? params.fallback
  } catch {
    return params.fallback
  }
}
