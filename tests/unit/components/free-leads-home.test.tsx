import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { FullLead, Icp } from '@/lib/free-leads/contract'

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/app/start/_components/api', () => ({
  postJson: vi.fn(),
  StartApiError: class extends Error {},
}))

import { FreeLeadsHome } from '@/app/(dashboard)/dashboard/FreeLeadsHome'
import { nextMonday, icpChips, leadStats, brandName } from '@/app/(dashboard)/dashboard/home-helpers'

const lead = (n: number, over: Partial<FullLead> = {}): FullLead => ({
  id: `l${n}`,
  first_name: `First${n}`,
  last_name: `Last${n}`,
  job_title: n % 2 ? 'Head of Growth' : 'Account Executive',
  seniority: null,
  company: `Co${n}`,
  company_domain: `co${n}.com`,
  industry: null,
  company_size: null,
  location: 'Austin',
  email: `p${n}@co${n}.com`,
  linkedin_url: null,
  phone: null,
  why: n === 1 ? 'Runs outbound for a SaaS team' : null,
  ...over,
})

const icp: Icp = {
  summary: 'You sell audits to SaaS teams.',
  industries: ['Software'],
  job_titles: ['Head of Growth'],
  seniority: [],
  company_size: ['11 to 50'],
  countries: ['United States'],
  states: [],
  cities: [],
}

const base = { domain: 'www.acme.com', icp, totalMatching: 1234, weekly: null, justStarted: false }

afterEach(() => vi.useRealTimers())

describe('home helpers', () => {
  it('nextMonday is strictly after today', () => {
    expect(nextMonday(new Date('2026-10-05T12:00:00Z'))).toBe('Mon, Oct 12') // a Monday
    expect(nextMonday(new Date('2026-10-02T12:00:00Z'))).toBe('Mon, Oct 5') // a Friday
    expect(nextMonday(new Date('2026-10-04T12:00:00Z'))).toBe('Mon, Oct 5') // a Sunday
  })
  it('brandName strips www and capitalizes', () => {
    expect(brandName('www.acme.com')).toBe('Acme')
  })
  it('leadStats counts deciders, emails, companies without mutating input', () => {
    const leads = [lead(1), lead(2), lead(3, { email: '' })]
    const frozen = JSON.stringify(leads)
    const stats = Object.fromEntries(leadStats(leads).map((s) => [s.label, s.value]))
    expect(stats['Leads in your list']).toBe(3)
    expect(stats['With a checked work email']).toBe(2)
    expect(stats['Decision makers']).toBe(2)
    expect(stats['Companies']).toBe(3)
    expect(JSON.stringify(leads)).toBe(frozen)
  })
  it('icpChips dedupes, caps and handles null', () => {
    expect(icpChips(null)).toEqual([])
    expect(icpChips(icp)).toEqual(['Head of Growth', 'Software', '11 to 50 people', 'United States'])
    expect(icpChips(icp, 2)).toHaveLength(2)
  })
})

describe('FreeLeadsHome', () => {
  it('shows the list, the buyer profile and no script font', () => {
    const { container } = render(<FreeLeadsHome {...base} leads={[lead(1), lead(2)]} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Your leads for Acme')
    expect(screen.getByText(/You sell audits to SaaS teams/)).toBeTruthy()
    expect(within(screen.getByRole('list', { name: 'Your buyer profile' })).getAllByRole('listitem').length).toBe(4)
    expect(screen.getByText('Why them')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Open all 2/ }).getAttribute('href')).toBe('/leads')
    expect(container.querySelector('.fl-script')).toBeNull()
    expect(screen.getByText('Weekly leads are off.')).toBeTruthy()
  })

  it('renders an empty state with the primary CTA when there are no leads', () => {
    render(<FreeLeadsHome {...base} leads={[]} />)
    expect(screen.getByText('No leads in this workspace yet.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Get my 25 leads' }).getAttribute('href')).toBe('/start')
    expect(screen.queryByRole('link', { name: /Download CSV/ })).toBeNull()
  })

  it('shows the next Monday delivery and trial end when subscribed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-02T12:00:00Z'))
    render(<FreeLeadsHome {...base} leads={[lead(1)]} weekly={{ state: 'active', trialEndsAt: '2026-10-10T00:00:00Z' }} />)
    expect(screen.getByText('Your next 25 arrive Mon, Oct 5.').getAttribute('role')).toBe('status')
    expect(screen.getByText(/Free until Oct 10/)).toBeTruthy()
    expect(screen.getByText('On')).toBeTruthy()
  })

  it('uses only approved prices and never names the data provider', () => {
    const { container } = render(<FreeLeadsHome {...base} leads={[lead(1)]} />)
    const text = container.textContent ?? ''
    expect(text).toContain('$197/mo')
    expect(text).toContain('$1,497/mo')
    expect(text).toContain('$2,500 setup + $500/mo')
    expect(text).not.toMatch(/getleads|audiencelab|verified|—/i)
  })
})
