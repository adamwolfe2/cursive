/**
 * Minimal in-memory stand-in for the supabase-js query builder, covering only the
 * calls made by free-leads claims and the route rate limiter. Each query resolves
 * after a random short delay so Promise.all callers genuinely interleave.
 */
type Row = Record<string, unknown>
type Filter = (r: Row) => boolean
export type UniqueCheck = (table: string, rows: Row[]) => boolean

function field(r: Row, key: string): unknown {
  const json = key.match(/^(\w+)->>(\w+)$/)
  if (json) return (r[json[1]] as Row | null)?.[json[2]]
  return r[key]
}

export function fakeSupabase(tables: Record<string, Row[]>, unique: UniqueCheck = () => true) {
  let nextId = 1

  class Query implements PromiseLike<{ data: unknown; error: unknown; count?: number | null }> {
    private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
    private conflictKey = 'id'
    private ignoreDuplicates = false
    private filters: Filter[] = []
    private payload: Row | Row[] = {}
    private head = false
    private returning = false
    private mode: 'many' | 'one' | 'maybe' = 'many'
    private max = Infinity

    constructor(private table: string) {
      tables[table] ??= []
    }

    select(_cols?: string, opts?: { count?: string; head?: boolean }) {
      if (this.op === 'select') this.head = Boolean(opts?.head)
      else this.returning = true
      return this
    }
    insert(p: Row | Row[]) {
      this.op = 'insert'
      this.payload = p
      return this
    }
    upsert(p: Row, opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
      this.op = 'upsert'
      this.payload = p
      this.conflictKey = opts?.onConflict ?? 'id'
      this.ignoreDuplicates = Boolean(opts?.ignoreDuplicates)
      return this
    }
    gt(k: string, v: string) {
      this.filters.push((r) => field(r, k) != null && String(field(r, k)) > v)
      return this
    }
    update(p: Row) {
      this.op = 'update'
      this.payload = p
      return this
    }
    delete() {
      this.op = 'delete'
      return this
    }
    eq(k: string, v: unknown) {
      this.filters.push((r) => field(r, k) === v)
      return this
    }
    lt(k: string, v: number) {
      this.filters.push((r) => (field(r, k) as number) < v)
      return this
    }
    gte(k: string, v: string) {
      this.filters.push((r) => field(r, k) != null && String(field(r, k)) >= v)
      return this
    }
    in(k: string, vs: unknown[]) {
      this.filters.push((r) => vs.includes(field(r, k)))
      return this
    }
    order() {
      return this
    }
    limit(n: number) {
      this.max = n
      return this
    }
    single() {
      this.mode = 'one'
      return this
    }
    maybeSingle() {
      this.mode = 'maybe'
      return this
    }

    then<A, B>(ok?: (v: { data: unknown; error: unknown; count?: number | null }) => A, fail?: (e: unknown) => B) {
      const delay = new Promise((r) => setTimeout(r, Math.random() * 3))
      return delay.then(() => this.exec()).then(ok, fail)
    }

    private shape(rows: Row[]) {
      if (this.mode === 'many') return { data: rows, error: null }
      if (rows.length === 0) return this.mode === 'one' ? { data: null, error: { message: 'no rows' } } : { data: null, error: null }
      return { data: { ...rows[0] }, error: null }
    }

    private exec() {
      const rows = tables[this.table]
      const match = rows.filter((r) => this.filters.every((f) => f(r)))
      if (this.op === 'select') {
        if (this.head) return { data: null, error: null, count: match.length }
        return this.shape(match.slice(0, this.max))
      }
      if (this.op === 'insert') {
        const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((p) => ({
          id: `id-${nextId++}`,
          created_at: new Date().toISOString(),
          ...p,
        }))
        if (!unique(this.table, [...rows, ...list])) return { data: null, error: { code: '23505', message: 'duplicate' } }
        rows.push(...list)
        return this.returning ? this.shape(list) : { data: null, error: null }
      }
      if (this.op === 'upsert') {
        const p = this.payload as Row
        const existing = rows.find((r) => r[this.conflictKey] === p[this.conflictKey])
        if (existing) {
          if (!this.ignoreDuplicates) Object.assign(existing, p)
        } else rows.push({ created_at: new Date().toISOString(), ...p })
        return { data: null, error: null }
      }
      if (this.op === 'update') {
        const next = rows.map((r) => (match.includes(r) ? { ...r, ...(this.payload as Row) } : r))
        if (!unique(this.table, next)) return { data: null, error: { code: '23505', message: 'duplicate' } }
        match.forEach((r) => Object.assign(r, this.payload))
        return this.returning ? this.shape(match) : { data: null, error: null }
      }
      tables[this.table] = rows.filter((r) => !match.includes(r))
      return { data: null, error: null }
    }
  }

  return { from: (table: string) => new Query(table), tables }
}
