import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Icp, ScanEvent } from '@/lib/free-leads/contract'

const h = vi.hoisted(() => ({ postJson: vi.fn(), streamScan: vi.fn() }))
vi.mock('../api', async (orig) => ({
  ...(await orig<typeof import('../api')>()),
  postJson: h.postJson,
  streamScan: h.streamScan,
  trackStep: vi.fn(),
}))

import { StartFlow } from '../StartFlow'

const ICP: Icp = {
  summary: 'You sell audits to software companies.',
  industries: ['Software Development'],
  job_titles: ['CTO', 'Founder'],
  seniority: ['VP'],
  company_size: ['11 to 50'],
  countries: ['United States'],
  states: [],
  cities: [],
}

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

/** Starts a scan via `?site=` and hands back the stream's emitter and its end. */
function startScan() {
  const ctl: { emit: (e: ScanEvent) => void; end: ReturnType<typeof deferred<void>> } = {
    emit: () => {},
    end: deferred<void>(),
  }
  h.streamScan.mockImplementation((_input: unknown, onEvent: (e: ScanEvent) => void) => {
    ctl.emit = onEvent
    return ctl.end.promise
  })
  render(<StartFlow mock={null} initialSite="acme.com" />)
  return ctl
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
})

describe('StartFlow count and refine races', () => {
  it('a failed recount clears the old total and keeps Approve blocked', async () => {
    h.postJson.mockImplementation(async (path: string) => {
      if (path === '/api/start/count') throw new Error('count down')
      return null
    })
    const scan = startScan()
    await waitFor(() => expect(h.streamScan).toHaveBeenCalled())
    act(() => {
      scan.emit({ type: 'icp', icp: ICP })
      scan.emit({ type: 'count', total: 120 })
    })
    await act(async () => {
      scan.emit({ type: 'done' })
      scan.end.resolve()
    })
    await waitFor(() => expect(screen.getByRole('button', { name: /Approve/ })).toBeEnabled())

    fireEvent.click(screen.getByRole('button', { name: 'Remove CTO' }))
    await waitFor(() => expect(screen.getByText('Count unavailable right now.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Approve/ })).toBeDisabled()
  })

  it('ignores the scan count that lands after the reader edited the profile', async () => {
    h.postJson.mockImplementation(async (path: string) => (path === '/api/start/count' ? { total: 50 } : null))
    const scan = startScan()
    await waitFor(() => expect(h.streamScan).toHaveBeenCalled())
    act(() => scan.emit({ type: 'icp', icp: ICP }))

    fireEvent.click(screen.getByRole('button', { name: 'Remove CTO' }))
    await waitFor(() => expect(screen.getByText('50 people match.')).toBeInTheDocument())

    await act(async () => {
      scan.emit({ type: 'count', total: 999 })
      scan.emit({ type: 'done' })
      scan.end.resolve()
    })
    expect(screen.getByText('50 people match.')).toBeInTheDocument()
    expect(screen.queryByText('999 people match.')).toBeNull()
  })

  it('clears the refine state when a chip edit lands mid-refine, and keeps the edit', async () => {
    const refine = deferred<unknown>()
    h.postJson.mockImplementation((path: string) =>
      path === '/api/start/refine' ? refine.promise : Promise.resolve({ total: 40 })
    )
    const scan = startScan()
    await waitFor(() => expect(h.streamScan).toHaveBeenCalled())
    await act(async () => {
      scan.emit({ type: 'icp', icp: ICP })
      scan.emit({ type: 'count', total: 100 })
      scan.emit({ type: 'done' })
      scan.end.resolve()
    })

    const box = screen.getByLabelText('Or say what to change')
    fireEvent.change(box, { target: { value: 'only Texas' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply change' }))
    await waitFor(() => expect(box).toBeDisabled())

    fireEvent.click(screen.getByRole('button', { name: 'Remove CTO' }))
    await act(async () => {
      refine.resolve({ icp: { ...ICP, states: ['Texas'] }, note: 'Limited to Texas.', total: 7 })
    })

    await waitFor(() => expect(screen.getByLabelText('Or say what to change')).not.toBeDisabled())
    expect(screen.getByText(/kept your edit/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove CTO' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Remove Texas' })).toBeNull()
    await waitFor(() => expect(screen.getByText('40 people match.')).toBeInTheDocument())
  })

  it('shows how an edit moved the count and offers the removed value back', async () => {
    h.postJson.mockImplementation(async (path: string) => (path === '/api/start/count' ? { total: 140 } : null))
    const scan = startScan()
    await waitFor(() => expect(h.streamScan).toHaveBeenCalled())
    await act(async () => {
      scan.emit({ type: 'icp', icp: ICP })
      scan.emit({ type: 'count', total: 100 })
      scan.emit({ type: 'done' })
      scan.end.resolve()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Remove CTO' }))
    await waitFor(() => expect(screen.getByText('140 people match.')).toBeInTheDocument())
    expect(screen.getAllByText('since you removed CTO').length).toBeGreaterThan(0)
    expect(screen.getAllByText('+40').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Add back CTO' }))
    expect(screen.getByRole('button', { name: 'Remove CTO' })).toBeInTheDocument()
  })
})
