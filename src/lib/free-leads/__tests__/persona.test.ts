import { beforeEach, describe, expect, it, vi } from 'vitest'

const create = vi.hoisted(() => vi.fn())
vi.mock('@anthropic-ai/sdk', () => ({ default: class { messages = { create } } }))

import { cleanText, generatePersona, parsePersona, PersonaError } from '../persona'
import type { Icp } from '../contract'

const ICP: Icp = {
  summary: 'You sell maintenance software to student-housing operators.', industries: ['Real Estate'], job_titles: ['VP Operations'],
  seniority: ['VP'], company_size: ['51 to 200'], countries: ['United States'], states: ['Texas'], cities: ['Austin'],
}
const GOOD = {
  name: 'Dana', role: 'VP Operations', company: 'a 12-property student-housing operator in Austin',
  day: 'Mondays she walks two buildings with the maintenance lead.', measured_on: ['Occupancy above 94%', 'Work orders closed in 3 days'],
  replies_when: 'A short note with one number she can check.',
}
const message = (body: unknown, stop_reason = 'end_turn') => ({
  model: 'claude-sonnet-5-5', stop_reason, usage: { input_tokens: 10, output_tokens: 10 },
  content: [{ type: 'text', text: typeof body === 'string' ? body : JSON.stringify(body) }],
})

beforeEach(() => {
  create.mockReset()
  process.env.ANTHROPIC_API_KEY = 'test-key'
})

describe('cleanText', () => {
  it('replaces dashes, strips emojis and exclamation marks', () => {
    expect(cleanText('Busy — very – busy \u{1F680}!')).toBe('Busy, very, busy .')
  })
})

describe('parsePersona', () => {
  it('sanitizes and validates', () => {
    const p = parsePersona(JSON.stringify({ ...GOOD, day: 'Walks the site — then reports \u{1F600}' }))
    expect(p.day).toBe('Walks the site, then reports')
    expect(p.measured_on).toHaveLength(2)
  })

  it.each([
    ['too-long name', { ...GOOD, name: 'x'.repeat(21) }],
    ['one measured_on item', { ...GOOD, measured_on: ['only one'] }],
    ['four measured_on items', { ...GOOD, measured_on: ['a', 'b', 'c', 'd'] }],
    ['long replies_when', { ...GOOD, replies_when: 'x'.repeat(221) }],
    ['missing role', { ...GOOD, role: undefined }],
  ])('rejects %s', (_n, body) => {
    expect(() => parsePersona(JSON.stringify(body))).toThrow(PersonaError)
  })

  it('rejects non-JSON', () => {
    expect(() => parsePersona('nope')).toThrow(PersonaError)
  })
})

describe('generatePersona', () => {
  it('returns the persona and reports usage', async () => {
    create.mockResolvedValue(message(GOOD))
    const onUsage = vi.fn()
    expect(await generatePersona(ICP, null, { onUsage })).toEqual(GOOD)
    expect(onUsage).toHaveBeenCalledWith({ input_tokens: 10, output_tokens: 10 }, 'claude-sonnet-5-5')
    expect(create.mock.calls[0][0]).toMatchObject({ model: 'claude-sonnet-5-5', output_config: { effort: 'low' } })
  })

  it('retries once on invalid output, then throws a typed error', async () => {
    create.mockResolvedValue(message({ ...GOOD, name: '' }))
    await expect(generatePersona(ICP, null)).rejects.toBeInstanceOf(PersonaError)
    expect(create).toHaveBeenCalledTimes(2)
  })

  it('throws not_configured without a key', async () => {
    delete process.env.ANTHROPIC_API_KEY
    await expect(generatePersona(ICP, null)).rejects.toMatchObject({ code: 'not_configured' })
  })
})
