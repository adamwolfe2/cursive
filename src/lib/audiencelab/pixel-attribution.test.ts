import { describe, it, expect } from 'vitest'
import {
  decideAttribution,
  resolveEventAttribution,
} from './pixel-attribution'

// ─── S2: canonical event → pixel attribution ─────────────────────────────────
// AudienceLab stamps events with an id (or null) that differs from the
// management pixel_id stored at creation. The canonical key is the managed
// pixel ROW; its workspace owns the event. Attribution must be deterministic:
// exactly one active managed pixel → attributed; zero or many → unattributable
// (the caller quarantines rather than guessing a tenant).

describe('decideAttribution', () => {
  it('returns null for zero candidates', () => {
    expect(decideAttribution([])).toBeNull()
  })

  it('returns null when the only candidate has no workspace', () => {
    expect(decideAttribution([{ id: 'p1', workspace_id: null }])).toBeNull()
  })

  it('attributes a single workspace-owned pixel row', () => {
    expect(
      decideAttribution([{ id: 'p1', workspace_id: 'w1' }])
    ).toEqual({ pixelRowId: 'p1', workspaceId: 'w1' })
  })

  it('returns null for two valid candidates (ambiguous → never guess)', () => {
    expect(
      decideAttribution([
        { id: 'p1', workspace_id: 'w1' },
        { id: 'p2', workspace_id: 'w2' },
      ])
    ).toBeNull()
  })

  it('ignores workspace-less rows and attributes the single valid one', () => {
    expect(
      decideAttribution([
        { id: 'p0', workspace_id: null },
        { id: 'p1', workspace_id: 'w1' },
      ])
    ).toEqual({ pixelRowId: 'p1', workspaceId: 'w1' })
  })
})

// Minimal thenable Supabase-builder mock for the impure resolver. Honors the
// is_active filter so a regression that drops `.eq('is_active', true)` fails.
type PixelRowFixture = { id: string; workspace_id: string | null; is_active?: boolean }

function makeAdmin(opts: {
  byWorkspace?: Record<string, PixelRowFixture[]>
  byPixelId?: Record<string, PixelRowFixture[]>
}) {
  function from(_table: string) {
    let wsFilter: string | null = null
    let pixelIdFilter: string | null = null
    let activeFilter: boolean | null = null
    const chain: any = {
      select: () => chain,
      eq: (col: string, val: unknown) => {
        if (col === 'workspace_id') wsFilter = val as string
        if (col === 'pixel_id') pixelIdFilter = val as string
        if (col === 'is_active') activeFilter = val as boolean
        return chain
      },
      then: (resolve: (r: { data: unknown; error: null }) => void) => {
        let rows: PixelRowFixture[] = []
        if (wsFilter) rows = opts.byWorkspace?.[wsFilter] ?? []
        else if (pixelIdFilter) rows = opts.byPixelId?.[pixelIdFilter] ?? []
        if (activeFilter !== null)
          rows = rows.filter((r) => (r.is_active ?? true) === activeFilter)
        resolve({ data: rows, error: null })
      },
    }
    return chain
  }
  return { from } as never
}

describe('resolveEventAttribution', () => {
  it('binds a valid ?ws= param to that workspace\'s single active pixel', async () => {
    const admin = makeAdmin({
      byWorkspace: { 'a6fcf32f-32bc-4225-9af2-cd5c0f532359': [
        { id: 'pixrow-1', workspace_id: 'a6fcf32f-32bc-4225-9af2-cd5c0f532359' },
      ] },
    })
    const res = await resolveEventAttribution(admin, {
      wsParam: 'a6fcf32f-32bc-4225-9af2-cd5c0f532359',
      eventPixelId: 'whatever-al-sent',
    })
    expect(res).toEqual({
      pixelRowId: 'pixrow-1',
      workspaceId: 'a6fcf32f-32bc-4225-9af2-cd5c0f532359',
    })
  })

  it('falls back to the raw pixel_id mapping when no ws param', async () => {
    const admin = makeAdmin({
      byPixelId: { 'mgmt-pixel-id': [{ id: 'pixrow-2', workspace_id: 'w2' }] },
    })
    const res = await resolveEventAttribution(admin, {
      wsParam: null,
      eventPixelId: 'mgmt-pixel-id',
    })
    expect(res).toEqual({ pixelRowId: 'pixrow-2', workspaceId: 'w2' })
  })

  it('returns null when neither signal resolves to a managed pixel', async () => {
    const admin = makeAdmin({})
    const res = await resolveEventAttribution(admin, {
      wsParam: '00000000-0000-0000-0000-000000000000',
      eventPixelId: 'unknown',
    })
    expect(res).toBeNull()
  })

  it('ignores a malformed ws param and uses pixel_id', async () => {
    const admin = makeAdmin({
      byPixelId: { 'mgmt-x': [{ id: 'pixrow-3', workspace_id: 'w3' }] },
    })
    const res = await resolveEventAttribution(admin, {
      wsParam: 'not-a-uuid',
      eventPixelId: 'mgmt-x',
    })
    expect(res).toEqual({ pixelRowId: 'pixrow-3', workspaceId: 'w3' })
  })

  it('IDOR guard: ?ws=A never leaks workspace B\'s pixel; the ws branch wins', async () => {
    const A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    const admin = makeAdmin({
      byWorkspace: { [A]: [{ id: 'pix-A', workspace_id: A }] },
      // The event also carries a pixel_id that maps to a FOREIGN workspace B.
      byPixelId: { 'evil-id': [{ id: 'pix-B', workspace_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }] },
    })
    const res = await resolveEventAttribution(admin, { wsParam: A, eventPixelId: 'evil-id' })
    // ws precedence + scoping: A's pixel, never B's.
    expect(res).toEqual({ pixelRowId: 'pix-A', workspaceId: A })
  })

  it('applies the is_active filter — an inactive pixel does not attribute', async () => {
    const C = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
    const admin = makeAdmin({
      byWorkspace: { [C]: [{ id: 'pix-inactive', workspace_id: C, is_active: false }] },
    })
    const res = await resolveEventAttribution(admin, { wsParam: C, eventPixelId: null })
    expect(res).toBeNull()
  })

  it('never attributes an unclaimed demo pixel (null workspace) via pixel_id', async () => {
    const admin = makeAdmin({
      byPixelId: { 'demo-pixel': [{ id: 'pix-demo', workspace_id: null }] },
    })
    const res = await resolveEventAttribution(admin, { wsParam: null, eventPixelId: 'demo-pixel' })
    expect(res).toBeNull()
  })

  it('defensive: a workspace exposing two active pixels resolves to null', async () => {
    const D = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
    const admin = makeAdmin({
      byWorkspace: { [D]: [
        { id: 'p1', workspace_id: D },
        { id: 'p2', workspace_id: D },
      ] },
    })
    const res = await resolveEventAttribution(admin, { wsParam: D, eventPixelId: null })
    expect(res).toBeNull()
  })
})
