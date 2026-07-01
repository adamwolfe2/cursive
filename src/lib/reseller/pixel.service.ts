/**
 * Reseller Pixel Service
 *
 * Wraps the EXISTING provisioning flow (provisionCustomerPixel + audiencelab_pixels
 * insert) to create a pixel for a reseller's end-customer. Each end-customer is a
 * headless, reseller-owned workspace so the whole existing ingest -> leads ->
 * `lead/created` pipeline is reused unchanged. Provisioning with the child
 * workspace id scopes the AL webhook URL (?ws=<id>) for deterministic routing.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { provisionCustomerPixel, deletePixel } from '@/lib/audiencelab/api-client'
import { generateApiKey } from './api-key.service'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import type { Reseller, ResellerPixel } from './types'

const LOG_PREFIX = '[ResellerPixel]'

export interface CreateResellerPixelInput {
  websiteUrl: string
  websiteName?: string
  externalCustomerRef: string
  destinationUrl?: string
  signingSecret?: string
  leadCapPerPeriod?: number | null
  throttleMode?: boolean | null
}

export interface CreatedResellerPixel {
  pixel_id: string
  install_url: string | null
  embed_snippet: string
  external_customer_ref: string
  signing_secret: string | null
  existing: boolean
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Build a unique, slug-safe workspace slug for a reseller child workspace. */
function buildChildSlug(reseller: Reseller): string {
  const short = reseller.id.replace(/-/g, '').slice(0, 8)
  const rand = Math.abs(hashString(`${reseller.id}:${Date.now()}:${Math.random()}`)).toString(36).slice(0, 8)
  return `r-${short}-${rand}`
}

// Small deterministic-ish hash for slug entropy (not security-sensitive).
function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return h
}

/**
 * Create (or return existing) a pixel for a reseller's end-customer.
 * Idempotent on (reseller_id, external_customer_ref).
 */
export async function createResellerPixel(
  reseller: Reseller,
  input: CreateResellerPixelInput,
): Promise<{ ok: true; data: CreatedResellerPixel } | { ok: false; status: number; error: string }> {
  const supabase = createAdminClient()
  const domain = extractDomain(input.websiteUrl)
  const websiteName = input.websiteName || domain || input.externalCustomerRef

  // ── Idempotency: existing pixel for this customer ref? ────────────────────
  const { data: existing } = await supabase
    .from('reseller_pixels')
    .select('*')
    .eq('reseller_id', reseller.id)
    .eq('external_customer_ref', input.externalCustomerRef)
    .maybeSingle()

  if (existing) {
    const ex = existing as ResellerPixel
    // Fetch the stored snippet from audiencelab_pixels for the embed.
    const { data: alPixel } = await supabase
      .from('audiencelab_pixels')
      .select('snippet, install_url')
      .eq('pixel_id', ex.pixel_id)
      .maybeSingle()
    return {
      ok: true,
      data: {
        pixel_id: ex.pixel_id,
        install_url: alPixel?.install_url ?? null,
        embed_snippet: alPixel?.snippet ?? snippetFrom(alPixel?.install_url ?? null),
        external_customer_ref: ex.external_customer_ref,
        signing_secret: ex.signing_secret,
        existing: true,
      },
    }
  }

  // ── 1. Create a headless child workspace ──────────────────────────────────
  let workspaceId: string
  try {
    workspaceId = await createChildWorkspace(supabase, reseller, websiteName)
  } catch (err) {
    safeError(`${LOG_PREFIX} child workspace creation failed:`, err)
    return { ok: false, status: 500, error: 'Failed to create customer workspace' }
  }

  // ── 2. Provision the pixel via the EXISTING AL flow ───────────────────────
  let pixelId: string
  let installUrl: string | null
  let script: string | undefined
  try {
    const result = await provisionCustomerPixel({
      websiteName,
      websiteUrl: input.websiteUrl,
      workspaceId, // scopes the AL webhook to ?ws=<id> for deterministic routing
    })
    pixelId = result.pixel_id
    installUrl = result.install_url ?? null
    script = result.script
  } catch (err) {
    safeError(`${LOG_PREFIX} AL provisioning failed:`, err)
    // Roll back the empty workspace so we don't leak orphans.
    await supabase.from('workspaces').delete().eq('id', workspaceId)
    return { ok: false, status: 502, error: 'Pixel provisioning failed upstream' }
  }

  if (!installUrl && !script) {
    await supabase.from('workspaces').delete().eq('id', workspaceId)
    return { ok: false, status: 502, error: 'Pixel provisioning returned no install URL' }
  }

  const snippet = script || snippetFrom(installUrl)

  // ── 3. Store in audiencelab_pixels (reuse existing routing table) ─────────
  const { error: alInsertErr } = await supabase.from('audiencelab_pixels').insert({
    pixel_id: pixelId,
    workspace_id: workspaceId,
    domain,
    is_active: true,
    label: websiteName,
    install_url: installUrl,
    snippet,
    // Resellers are not on trial — mark active so trial-expiry jobs skip them.
    trial_status: 'active',
    trial_ends_at: null,
  })
  if (alInsertErr) {
    safeError(`${LOG_PREFIX} audiencelab_pixels insert failed:`, alInsertErr)
    // AL SuperPixel was created but our DB row was not — clean up both.
    await cleanupOrphanedProvision(supabase, workspaceId, pixelId)
    return { ok: false, status: 500, error: 'Failed to persist pixel' }
  }

  // ── 4. Store the reseller mapping + delivery config ───────────────────────
  const signingSecret = input.signingSecret ?? (await generateApiKey()).rawKey
  const { error: mapErr } = await supabase.from('reseller_pixels').insert({
    reseller_id: reseller.id,
    workspace_id: workspaceId,
    pixel_id: pixelId,
    external_customer_ref: input.externalCustomerRef,
    website_url: input.websiteUrl,
    domain,
    status: 'active',
    destination_url: input.destinationUrl ?? null,
    signing_secret: signingSecret,
    lead_cap_per_period: input.leadCapPerPeriod ?? null,
    throttle_mode: input.throttleMode ?? null,
  })
  if (mapErr) {
    // Unique violation => a concurrent create for the same external_customer_ref
    // won the race. Clean up the workspace + pixel THIS call just provisioned
    // (otherwise orphaned), then return the winner's pixel.
    if ((mapErr as { code?: string }).code === '23505') {
      await cleanupOrphanedProvision(supabase, workspaceId, pixelId)
      return createResellerPixel(reseller, input)
    }
    safeError(`${LOG_PREFIX} reseller_pixels insert failed:`, mapErr)
    return { ok: false, status: 500, error: 'Failed to persist reseller mapping' }
  }

  safeLog(`${LOG_PREFIX} created pixel ${pixelId} for reseller ${reseller.id} customer ${input.externalCustomerRef}`)

  return {
    ok: true,
    data: {
      pixel_id: pixelId,
      install_url: installUrl,
      embed_snippet: snippet,
      external_customer_ref: input.externalCustomerRef,
      signing_secret: signingSecret,
      existing: false,
    },
  }
}

function snippetFrom(installUrl: string | null): string {
  return installUrl ? `<script src="${installUrl}" defer></script>` : ''
}

/**
 * Delete a just-provisioned pixel + its child workspace after a create fails or
 * loses an idempotency race, so nothing is orphaned. audiencelab_pixels has no
 * ON DELETE CASCADE from workspaces, so the pixel row is removed BEFORE the
 * workspace. AL-side deletion is best-effort.
 */
async function cleanupOrphanedProvision(
  supabase: ReturnType<typeof createAdminClient>,
  workspaceId: string,
  pixelId: string,
): Promise<void> {
  try {
    await deletePixel(pixelId)
  } catch (err) {
    safeError(`${LOG_PREFIX} AL pixel cleanup failed (non-fatal):`, err)
  }
  await supabase.from('audiencelab_pixels').delete().eq('pixel_id', pixelId).eq('workspace_id', workspaceId)
  await supabase.from('workspaces').delete().eq('id', workspaceId)
}

/** Create a headless workspace owned by the reseller (retries slug on collision). */
async function createChildWorkspace(
  supabase: ReturnType<typeof createAdminClient>,
  reseller: Reseller,
  name: string,
): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = buildChildSlug(reseller)
    const { data, error } = await supabase
      .from('workspaces')
      // onboarding_status MUST be set explicitly: the column default
      // ('not_started') violates the workspaces valid_onboarding_status check
      // (pending|in_progress|completed|skipped). A reseller child workspace is
      // headless / fully provisioned, so it is 'completed'.
      .insert({ slug, name: name.slice(0, 200), onboarding_status: 'completed' })
      .select('id')
      .maybeSingle()

    if (!error && data) return data.id
    // 23505 = unique slug collision; retry with fresh slug.
    if ((error as { code?: string } | null)?.code !== '23505') {
      throw new Error(error?.message || 'workspace insert failed')
    }
  }
  throw new Error('workspace slug collision after retries')
}

// ── Read / mutate helpers ───────────────────────────────────────────────────

export async function listResellerPixels(resellerId: string): Promise<ResellerPixel[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('reseller_pixels')
    .select('*')
    .eq('reseller_id', resellerId)
    .order('created_at', { ascending: false })
  if (error) {
    safeError(`${LOG_PREFIX} list failed:`, error)
    return []
  }
  return (data ?? []) as ResellerPixel[]
}

export async function getResellerPixel(resellerId: string, pixelId: string): Promise<ResellerPixel | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('reseller_pixels')
    .select('*')
    .eq('reseller_id', resellerId)
    .eq('pixel_id', pixelId)
    .maybeSingle()
  return (data as ResellerPixel) ?? null
}

/** Deactivate a pixel: stops inbound routing (is_active=false) + outbound delivery. */
export async function deactivateResellerPixel(resellerId: string, pixelId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const pixel = await getResellerPixel(resellerId, pixelId)
  if (!pixel) return false

  await supabase.from('reseller_pixels').update({ status: 'inactive' }).eq('id', pixel.id)
  await supabase
    .from('audiencelab_pixels')
    .update({ is_active: false })
    .eq('pixel_id', pixelId)
    .eq('workspace_id', pixel.workspace_id)
  return true
}

export interface DeliveryUpdate {
  destinationUrl?: string
  signingSecret?: string
  leadCapPerPeriod?: number | null
  throttleMode?: boolean | null
}

export async function updateResellerPixelDelivery(
  resellerId: string,
  pixelId: string,
  update: DeliveryUpdate,
): Promise<ResellerPixel | null> {
  const supabase = createAdminClient()
  const pixel = await getResellerPixel(resellerId, pixelId)
  if (!pixel) return null

  const patch: Record<string, unknown> = {}
  if (update.destinationUrl !== undefined) patch.destination_url = update.destinationUrl
  if (update.signingSecret !== undefined) patch.signing_secret = update.signingSecret
  if (update.leadCapPerPeriod !== undefined) patch.lead_cap_per_period = update.leadCapPerPeriod
  if (update.throttleMode !== undefined) patch.throttle_mode = update.throttleMode

  const { data, error } = await supabase
    .from('reseller_pixels')
    .update(patch)
    .eq('id', pixel.id)
    .select('*')
    .maybeSingle()

  if (error) {
    safeError(`${LOG_PREFIX} delivery update failed:`, error)
    return null
  }
  return (data as ResellerPixel) ?? null
}
