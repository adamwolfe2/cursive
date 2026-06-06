import { describe, it, expect } from 'vitest'
import { classifyPixelHealth, isPixelSilent } from './pixel-health'

const HOUR = 60 * 60 * 1000
const NOW = 1_780_000_000_000 // fixed epoch for deterministic tests

describe('classifyPixelHealth', () => {
  it('is no-pixel when never provisioned', () => {
    expect(
      classifyPixelHealth({
        pixelProvisionedAt: null,
        pixelLastEventAt: null,
        now: NOW,
      })
    ).toMatchObject({ status: 'no-pixel' })
  })

  it('is healthy whenever an event has arrived', () => {
    expect(
      classifyPixelHealth({
        pixelProvisionedAt: new Date(NOW - 100 * HOUR).toISOString(),
        pixelLastEventAt: new Date(NOW - HOUR).toISOString(),
        now: NOW,
      })
    ).toMatchObject({ status: 'healthy' })
  })

  it('is pending when recently provisioned with no events', () => {
    expect(
      classifyPixelHealth({
        pixelProvisionedAt: new Date(NOW - 2 * HOUR).toISOString(),
        pixelLastEventAt: null,
        now: NOW,
        silentThresholdHours: 6,
      })
    ).toMatchObject({ status: 'pending' })
  })

  it('is silent past the threshold with no events', () => {
    expect(
      classifyPixelHealth({
        pixelProvisionedAt: new Date(NOW - 8 * HOUR).toISOString(),
        pixelLastEventAt: null,
        now: NOW,
        silentThresholdHours: 6,
      })
    ).toMatchObject({ status: 'silent' })
  })

  it('respects a custom silent threshold', () => {
    const input = {
      pixelProvisionedAt: new Date(NOW - 3 * HOUR).toISOString(),
      pixelLastEventAt: null,
      now: NOW,
    }
    expect(
      classifyPixelHealth({ ...input, silentThresholdHours: 2 }).status
    ).toBe('silent')
    expect(
      classifyPixelHealth({ ...input, silentThresholdHours: 6 }).status
    ).toBe('pending')
  })

  it('defaults to a 6h threshold', () => {
    // 7h with no events → silent under the default threshold.
    expect(
      classifyPixelHealth({
        pixelProvisionedAt: new Date(NOW - 7 * HOUR).toISOString(),
        pixelLastEventAt: null,
        now: NOW,
      }).status
    ).toBe('silent')
  })

  it('does not crash on an unparseable provisioned-at', () => {
    expect(
      classifyPixelHealth({
        pixelProvisionedAt: 'not-a-date',
        pixelLastEventAt: null,
        now: NOW,
      })
    ).toMatchObject({ status: 'pending' })
  })
})

describe('isPixelSilent', () => {
  it('mirrors the silent classification', () => {
    expect(
      isPixelSilent({
        pixelProvisionedAt: new Date(NOW - 8 * HOUR).toISOString(),
        pixelLastEventAt: null,
        now: NOW,
        silentThresholdHours: 6,
      })
    ).toBe(true)
    expect(
      isPixelSilent({
        pixelProvisionedAt: new Date(NOW - 8 * HOUR).toISOString(),
        pixelLastEventAt: new Date(NOW - HOUR).toISOString(),
        now: NOW,
      })
    ).toBe(false)
  })
})
