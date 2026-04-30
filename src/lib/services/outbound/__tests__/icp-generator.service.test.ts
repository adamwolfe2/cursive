/**
 * ICP Generator — unit tests
 *
 * Tests parseAndValidate (the pure parser) directly and validates the
 * Anthropic-mocked path of generateIcpFromProduct.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Module-level mock Anthropic with a swappable messages.create implementation.
// We capture the create fn so each test can override it via setMockResponse().
const mockMessagesCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: mockMessagesCreate }
    constructor(_opts: unknown) { /* noop */ }
  }
  return { default: MockAnthropic }
})

import {
  generateIcpFromProduct,
  parseAndValidate,
} from '@/lib/services/outbound/icp-generator.service'

beforeEach(() => {
  mockMessagesCreate.mockReset()
  process.env.ANTHROPIC_API_KEY = 'test-key'
})

// ============================================================================
// parseAndValidate — pure parser
// ============================================================================
describe('parseAndValidate', () => {
  it('parses valid JSON with all fields', () => {
    const input = JSON.stringify({
      industries: ['Software', 'Marketing'],
      seniority_levels: ['VP', 'Director'],
      states: ['ca', 'tx'],
      job_titles: ['Head of Growth'],
      company_sizes: ['51-200'],
      departments: ['Marketing'],
      icp_summary: 'B2B SaaS founders.',
      persona_summary: 'Marketing leaders at growing companies.',
    })
    const result = parseAndValidate(input)
    expect(result.industries).toEqual(['Software', 'Marketing'])
    expect(result.seniority_levels).toEqual(['VP', 'Director'])
    expect(result.states).toEqual(['CA', 'TX'])
    expect(result.icp_summary).toBe('B2B SaaS founders.')
  })

  it('strips markdown code fences', () => {
    const wrapped = '```json\n' + JSON.stringify({
      industries: ['Software'],
      seniority_levels: ['Director'],
      states: [],
      job_titles: [],
      company_sizes: [],
      departments: [],
      icp_summary: 'Test',
      persona_summary: 'Persona',
    }) + '\n```'
    const result = parseAndValidate(wrapped)
    expect(result.industries).toEqual(['Software'])
  })

  it('normalizes seniority synonyms', () => {
    const input = JSON.stringify({
      industries: ['Software'],
      seniority_levels: ['CEO', 'Vice President', 'Head of Sales', 'Team Lead'],
      states: [],
      job_titles: [],
      company_sizes: [],
      departments: [],
      icp_summary: '',
      persona_summary: '',
    })
    const result = parseAndValidate(input)
    expect(result.seniority_levels).toEqual(['C-Suite', 'VP', 'Director', 'Manager'])
  })

  it('drops invalid seniority values', () => {
    const input = JSON.stringify({
      industries: [],
      seniority_levels: ['unknown_role', 'Director'],
      states: [],
      job_titles: [],
      company_sizes: [],
      departments: [],
      icp_summary: '',
      persona_summary: '',
    })
    const result = parseAndValidate(input)
    expect(result.seniority_levels).toEqual(['Director'])
  })

  it('throws on non-JSON input', () => {
    expect(() => parseAndValidate('Hello world')).toThrow(/No JSON object found/)
  })

  it('throws on malformed JSON inside braces', () => {
    expect(() => parseAndValidate('{this is: not, valid json}')).toThrow(/Invalid JSON/)
  })

  it('coerces missing fields to safe defaults', () => {
    const result = parseAndValidate('{}')
    expect(result.industries).toEqual([])
    expect(result.seniority_levels).toEqual([])
    expect(result.icp_summary).toBe('No ICP summary provided.')
    expect(result.persona_summary).toBe('No persona summary provided.')
  })

  it('filters non-string entries from arrays', () => {
    const input = JSON.stringify({
      industries: ['Software', null, 42, 'Marketing'],
      seniority_levels: [],
      states: ['CA', 99],
      job_titles: [],
      company_sizes: [],
      departments: [],
      icp_summary: '',
      persona_summary: '',
    })
    const result = parseAndValidate(input)
    expect(result.industries).toEqual(['Software', 'Marketing'])
    expect(result.states).toEqual(['CA'])
  })
})

// ============================================================================
// generateIcpFromProduct — Anthropic mocked
// ============================================================================
describe('generateIcpFromProduct', () => {
  it('rejects empty/short input before calling Claude', async () => {
    await expect(generateIcpFromProduct('short')).rejects.toThrow(/too short/)
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it('calls Claude with the product text and parses the JSON response', async () => {
    mockMessagesCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            industries: ['Software'],
            seniority_levels: ['VP'],
            states: ['CA'],
            job_titles: ['VP of Sales'],
            company_sizes: ['51-200'],
            departments: ['Sales'],
            icp_summary: 'B2B SaaS sellers.',
            persona_summary: 'Sales VPs at startups.',
          }),
        },
      ],
    })

    const result = await generateIcpFromProduct(
      'We sell autonomous SDR software to early-stage B2B SaaS founders.'
    )
    expect(result.industries).toEqual(['Software'])
    expect(result.icp_summary).toBe('B2B SaaS sellers.')
    expect(mockMessagesCreate).toHaveBeenCalledOnce()
    expect(mockMessagesCreate.mock.calls[0][0]).toMatchObject({
      model: 'claude-haiku-4-5-20251001',
    })
  })

  it('throws if Claude returns no content', async () => {
    mockMessagesCreate.mockResolvedValue({ content: [] })

    await expect(
      generateIcpFromProduct('We sell sales automation tools for B2B teams.')
    ).rejects.toThrow(/Empty or non-text/)
  })
})
