import { describe, expect, it } from 'vitest'
import { IN_PROGRESS_LEASE_MS, existingEventAction } from '../event-lease'

const now = Date.parse('2026-10-02T12:00:00Z')
const ago = (ms: number) => new Date(now - ms).toISOString()

describe('existingEventAction', () => {
  it('processes an event never seen before', () => {
    expect(existingEventAction(null, now)).toBe('process')
  })

  it('skips an event that finished cleanly', () => {
    expect(existingEventAction({ error_message: null, processing_duration_ms: 120, created_at: ago(1000) }, now)).toBe('duplicate')
  })

  it('retries an event whose last attempt failed', () => {
    expect(existingEventAction({ error_message: 'boom', processing_duration_ms: 50, created_at: ago(1000) }, now)).toBe('reclaim')
  })

  it('asks Stripe to retry while another run is still inside its lease', () => {
    expect(existingEventAction({ error_message: null, processing_duration_ms: null, created_at: ago(30_000) }, now)).toBe('in_progress')
  })

  it('reclaims a run that never finished once the lease has passed (crash mid-processing)', () => {
    expect(existingEventAction({ error_message: null, processing_duration_ms: null, created_at: ago(IN_PROGRESS_LEASE_MS + 1) }, now)).toBe('reclaim')
  })

  it('outlasts the longest possible function run (Vercel max 800s)', () => {
    expect(IN_PROGRESS_LEASE_MS).toBeGreaterThan(800_000)
  })
})
