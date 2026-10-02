import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { HeroDemo } from '../HeroDemo'

const motion = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }))

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

/** Each step schedules the next from an effect, so time has to pass in slices. */
const advance = (ms: number) => {
  for (let t = 0; t < ms; t += 250) act(() => vi.advanceTimersByTime(250))
}

const leadVisible = () => screen.queryByText('Rachel J.') !== null

it('plays through to the leads when nothing holds it', () => {
  motion(false)
  render(<HeroDemo held={false} />)
  expect(leadVisible()).toBe(false)
  advance(6000)
  expect(leadVisible()).toBe(true)
})

it('does not advance while the reader is typing (held) or after pressing pause', () => {
  motion(false)
  const { rerender } = render(<HeroDemo held />)
  advance(6000)
  expect(leadVisible()).toBe(false)

  rerender(<HeroDemo held={false} />)
  fireEvent.click(screen.getByRole('button', { name: 'Pause the example' }))
  advance(6000)
  expect(leadVisible()).toBe(false)
})

it('shows the finished example, with no autoplay controls, under reduced motion', () => {
  motion(true)
  render(<HeroDemo held={false} />)
  expect(leadVisible()).toBe(true)
  expect(screen.queryByRole('button', { name: /Pause the example/ })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Example scan of webflow.com' }))
  expect(screen.getByText('Greg M.')).toBeTruthy()
})
