import { describe, expect, it, vi } from 'vitest'

// Regression: leads has no updated_at column. Selecting it 500'd every /api/leads
// call in prod (2026-10-02) and the Leads page showed "No leads this week yet".
const selects: string[] = []
const chain: Record<string, unknown> = {}
for (const m of ['eq', 'gte', 'lte', 'or', 'order', 'range']) chain[m] = () => chain
chain.select = (cols: string) => {
  selects.push(cols)
  return chain
}
chain.then = (resolve: (v: unknown) => void) => resolve({ data: [], error: null, count: 0 })

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: () => chain }),
}))

describe('LeadRepository.findByWorkspace', () => {
  it('never selects columns the leads table does not have', async () => {
    const { LeadRepository } = await import('../lead.repository')
    await new LeadRepository().findByWorkspace('ws', { date_from: '2026-10-01' })
    expect(selects.length).toBeGreaterThan(0)
    for (const cols of selects) expect(cols).not.toMatch(/\bupdated_at\b/)
  })
})
