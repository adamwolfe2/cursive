import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import type { Icp, Persona, ScanEvent } from '@/lib/free-leads/contract'

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
  job_titles: ['CTO', 'Founder', 'CISO', 'VP of Engineering', 'Head of IT', 'Head of Security', 'Head of Compliance', 'Director of IT'],
  seniority: ['VP'],
  company_size: ['11 to 50'],
  countries: ['United States'],
  states: [],
  cities: [],
}
const PERSONA: Persona = {
  name: 'Dana',
  role: 'VP Operations',
  company: 'a 12-property student-housing operator in Austin',
  day: 'Walks two properties before lunch.',
  measured_on: ['Occupancy by August'],
  replies_when: 'A note that names her lease-up gap.',
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  h.postJson.mockResolvedValue({ total: 40 })
})

it('shows the persona, folds the rail behind a summary, and expands extra titles', async () => {
  let emit: (e: ScanEvent) => void = () => {}
  h.streamScan.mockImplementation((_i: unknown, onEvent: (e: ScanEvent) => void) => {
    emit = onEvent
    return new Promise(() => {})
  })
  render(<StartFlow mock={null} initialSite="acme.com" />)
  await waitFor(() => expect(h.streamScan).toHaveBeenCalled())

  act(() => {
    emit({ type: 'page', path: '/', state: 'read', chars: 1000 })
    emit({ type: 'fact', fact: { key: 'offer', source: 'model', label: 'What you sell', text: 'Audits' } })
    emit({ type: 'icp', icp: ICP })
    emit({ type: 'count', total: 120 })
  })
  expect(screen.queryByText('The person you are writing to')).toBeNull()
  expect(screen.getByText('What we read: 1 page, 1 fact')).toBeInTheDocument()

  act(() => emit({ type: 'persona', persona: PERSONA }))
  expect(screen.getByText('The person you are writing to')).toBeInTheDocument()
  expect(screen.getByText('Dana')).toBeInTheDocument()

  expect(screen.queryByText('Director of IT')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Show 2 more titles' }))
  expect(screen.getByText('Director of IT')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /more titles/ })).toBeNull()
})
