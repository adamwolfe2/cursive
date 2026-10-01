import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/env-validation', () => ({ validateRequiredEnvVars: () => {} }))

describe('instrumentation register()', () => {
  const before = process.listeners('uncaughtException')
  afterEach(() => {
    for (const l of process.listeners('uncaughtException')) if (!before.includes(l)) process.off('uncaughtException', l)
    vi.unstubAllEnvs()
  })

  it('adds no uncaughtException listener (a throwing listener kills the server on client aborts)', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs')
    const { register } = await import('@/instrumentation')
    await register()
    expect(process.listeners('uncaughtException')).toEqual(before)
  })
})
