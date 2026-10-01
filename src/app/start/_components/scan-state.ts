import type { Fact, FactKey, ScanEvent } from '@/lib/free-leads/contract'

/** Pure helpers for the live scan rail. Everything here mirrors a real ScanEvent; nothing is invented. */

export type PageEvent = Extract<ScanEvent, { type: 'page' }>
export type PageRow = { path: string; state: PageEvent['state']; title: string | null; chars: number | null }

/** Upsert by path, keeping first-seen order so rows never jump. */
export function withPage(pages: PageRow[], e: PageEvent): PageRow[] {
  const next: PageRow = {
    path: e.path,
    state: e.state,
    title: e.title ?? null,
    chars: typeof e.chars === 'number' ? e.chars : null,
  }
  const i = pages.findIndex((p) => p.path === e.path)
  if (i === -1) return [...pages, next]
  const prev = pages[i]
  return pages.map((p, j) => (j === i ? { ...next, title: next.title ?? prev.title, chars: next.chars ?? prev.chars } : p))
}

export interface FactGroup {
  key: FactKey
  label: string
  facts: Fact[]
}

/** Group facts by key in first-arrival order, so a new key always lands at the bottom. */
export function groupFacts(facts: Fact[]): FactGroup[] {
  return facts.reduce<FactGroup[]>((groups, f) => {
    const i = groups.findIndex((g) => g.key === f.key)
    if (i === -1) return [...groups, { key: f.key, label: f.label, facts: [f] }]
    return groups.map((g, j) => (j === i ? { ...g, facts: [...g.facts, f] } : g))
  }, [])
}

/** "12.4k" style, for character counts of pages read. */
export function compactChars(n: number): string {
  if (n < 1000) return String(n)
  return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`
}

/** "Read 3 of 4 pages, 21.5k characters" once every page has settled; null while any is in flight. */
export function pagesSummary(pages: PageRow[]): string | null {
  if (!pages.length || pages.some((p) => p.state === 'fetching')) return null
  const read = pages.filter((p) => p.state === 'read')
  const chars = read.reduce((s, p) => s + (p.chars ?? 0), 0)
  const n = read.length === pages.length ? `${read.length} ${read.length === 1 ? 'page' : 'pages'}` : `${read.length} of ${pages.length} pages`
  return chars ? `Read ${n}, ${compactChars(chars)} characters` : `Read ${n}`
}

/** Honest provenance for a replayed scan: "From a scan of this site earlier today." */
export function replayLabel(scannedAt: string, now: Date = new Date()): string {
  const t = new Date(scannedAt)
  if (Number.isNaN(t.getTime())) return 'From an earlier scan of this site.'
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((day(now) - day(t)) / 86_400_000)
  if (days <= 0) return 'From a scan of this site earlier today.'
  if (days === 1) return 'From a scan of this site yesterday.'
  return `From a scan of this site ${days} days ago.`
}
