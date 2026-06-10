/**
 * Canonical event → pixel attribution (S2).
 *
 * AudienceLab stamps inbound events with a `pixel_id` (or null) that differs
 * from the management `pixel_id` we store at pixel creation, so the raw value
 * is NOT a reliable attribution key. The canonical key is the managed pixel
 * ROW (`audiencelab_pixels.id`); that row's `workspace_id` owns the event.
 *
 * This module is the single shared resolver. Producers (S3) stamp
 * `audiencelab_events.pixel_row_id` with the result; consumers (S4) read by it.
 * Attribution is deterministic: exactly one active managed pixel resolves;
 * zero or many resolve to nothing so the caller can quarantine rather than
 * guess a tenant boundary.
 */

import type { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface PixelAttribution {
  pixelRowId: string
  workspaceId: string
}

export interface CandidatePixelRow {
  id: string
  workspace_id: string | null
}

/**
 * Pure: choose the canonical attribution from candidate managed-pixel rows.
 * Exactly one workspace-owned candidate → attributed; zero or many → null
 * (ambiguous or unknown — never guess across a tenant boundary).
 */
export function decideAttribution(
  candidates: CandidatePixelRow[]
): PixelAttribution | null {
  const valid = candidates.filter(
    (p): p is CandidatePixelRow & { workspace_id: string } => !!p.workspace_id
  )
  if (valid.length !== 1) return null
  const only = valid[0]
  return { pixelRowId: only.id, workspaceId: only.workspace_id }
}

/**
 * Pure: the canonical `pixel_row_id` to STAMP on a stored event, given the
 * resolver's attribution and the workspace the event is actually stored under.
 * Returns the pixel row only when its workspace matches the stored workspace —
 * so a canonical pixel id is never written across a tenant boundary even if the
 * (legacy) routing workspace and the resolver ever disagree.
 */
export function pixelRowForWorkspace(
  attribution: PixelAttribution | null,
  storedWorkspaceId: string | null
): string | null {
  if (!attribution) return null
  return attribution.workspaceId === storedWorkspaceId
    ? attribution.pixelRowId
    : null
}

/**
 * Resolve an inbound event to its canonical { pixelRowId, workspaceId }.
 *
 * Precedence mirrors the durable webhook routing:
 *   1. `?ws=<workspace_id>` (the workspace-scoped webhook URL) → that
 *      workspace's single ACTIVE managed pixel.
 *   2. the raw upstream `pixel_id` mapped to a managed pixel row.
 * Returns null when neither yields exactly one active managed pixel.
 */
export async function resolveEventAttribution(
  admin: AdminClient,
  input: { wsParam?: string | null; eventPixelId?: string | null }
): Promise<PixelAttribution | null> {
  const wsParam = input.wsParam?.trim() || null
  const eventPixelId = input.eventPixelId?.trim() || null

  if (wsParam && UUID_RE.test(wsParam)) {
    const { data } = await admin
      .from('audiencelab_pixels')
      .select('id, workspace_id')
      .eq('workspace_id', wsParam)
      .eq('is_active', true)
    const decided = decideAttribution((data as CandidatePixelRow[]) ?? [])
    if (decided) return decided
  }

  if (eventPixelId) {
    const { data } = await admin
      .from('audiencelab_pixels')
      .select('id, workspace_id')
      .eq('pixel_id', eventPixelId)
      .eq('is_active', true)
    const decided = decideAttribution((data as CandidatePixelRow[]) ?? [])
    if (decided) return decided
  }

  return null
}
