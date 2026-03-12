/**
 * Knowledge Base Library Tests
 * Tests for AI-powered company intelligence generation with OpenAI
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { BrandDNA } from '@/lib/ai-studio/firecrawl'

// ============================================
// MOCKS
// ============================================

const { mockCreate } = vi.hoisted(() => {
  return {
    mockCreate: vi.fn(),
  }
})

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      }
    },
  }
})

// Mock api-logger (knowledge.ts now calls logApiCall)
vi.mock('@/lib/services/api-logger', () => ({
  logApiCall: vi.fn(),
}))

// Mock log-sanitizer
vi.mock('@/lib/utils/log-sanitizer', () => ({
  safeLog: vi.fn(),
  safeError: vi.fn(),
  safeWarn: vi.fn(),
}))

// Import AFTER mocks
import { generateKnowledgeBase, generateCustomerProfiles } from '@/lib/ai-studio/knowledge'
import type { KnowledgeBase } from '@/lib/ai-studio/knowledge'

// ============================================
// TEST DATA
// ============================================

const mockBrandData: BrandDNA = {
  company_name: 'Acme Corp',
  tagline: 'Innovation at Scale',
  headline: 'Building the Future of Technology',
  meta_description: 'Leading provider of innovative tech solutions',
  primary_color: '#FF0000',
  secondary_color: '#0000FF',
  accent_color: '#00FF00',
  background_color: '#FFFFFF',
  heading_font: 'Great Vibes',
  body_font: 'Inter',
  brand_personality: ['Professional', 'Innovative'],
  value_propositions: ['Fast delivery', 'Best quality'],
  logo_url: 'https://acme.com/logo.png',
  favicon_url: 'https://acme.com/favicon.ico',
  images: [],
  hero_images: ['https://acme.com/hero.jpg'],
  product_images: ['https://acme.com/product.jpg'],
  team_images: [],
  icon_urls: ['https://acme.com/icon.svg'],
  og_image: 'https://acme.com/og.jpg',
}

const mockKnowledgeBase: KnowledgeBase = {
  company_overview: 'Acme Corp is a leading technology company...',
  products_services: [
    {
      name: 'Premium Plan',
      description: 'Our flagship product with all features',
      target_audience: 'Startup founders aged 25-45',
    },
  ],
  target_audience: 'Tech-savvy professionals in startups',
  value_proposition: ['Save time', 'Increase revenue', 'Reduce costs'],
  brand_voice: {
    tone: 'Professional yet approachable',
    energy_level: 'Energetic',
    communication_style: 'Direct and clear',
  },
  key_messages: ['Innovation', 'Reliability', 'Growth'],
  messaging_framework: {
    headlines: ['Transform your workflow in minutes'],
    subheadlines: ['Join 10,000+ happy customers'],
    call_to_actions: ['Get started free', 'Book a demo'],
    social_proof_points: ['Trusted by Fortune 500 companies'],
  },
  competitive_advantages: ['Fastest in market', 'Most features'],
  use_cases: ['Startups use it to scale', 'Enterprises use it to optimize'],
}

const mockCustomerProfiles = {
  personas: [
    {
      name: 'Alex, the Startup Founder',
      title: 'Startup Founder',
      description: 'Tech-savvy entrepreneur looking to scale',
      demographics: {
        age_range: '28-35',
        income_range: '$70,000-120,000',
        location: 'San Francisco',
        education: "Bachelor's degree",
      },
      pain_points: ['Too many tools', 'Wasting time'],
      goals: ['Scale business', 'Automate workflows'],
      preferred_channels: ['LinkedIn', 'Twitter'],
    },
    {
      name: 'Sarah, the Product Manager',
      title: 'Product Manager',
      description: 'Experienced PM at a growing tech company',
      demographics: {
        age_range: '30-40',
        income_range: '$90,000-150,000',
        location: 'New York',
        education: 'MBA',
      },
      pain_points: ['Coordination overhead', 'Lack of visibility'],
      goals: ['Ship faster', 'Better collaboration'],
      preferred_channels: ['Product Hunt', 'LinkedIn'],
    },
  ],
}

// ============================================
// TESTS
// ============================================

describe('Knowledge Base Library', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key')

    // Default: Successful knowledge base generation
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockKnowledgeBase),
          },
        },
      ],
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // ============================================
  // ENVIRONMENT VALIDATION
  // ============================================

  describe('Environment Validation', () => {
    it('should throw when OPENAI_API_KEY is missing', async () => {
      vi.unstubAllEnvs()
      delete process.env.OPENAI_API_KEY

      await expect(
        generateKnowledgeBase('test markdown', mockBrandData)
      ).rejects.toThrow(/OPENAI_API_KEY.*not set/i)
    })

    it('should successfully generate when API key is set', async () => {
      const result = await generateKnowledgeBase('test markdown', mockBrandData)

      expect(result).toBeDefined()
      expect(result.company_overview).toBeDefined()
    })
  })

  // ============================================
  // KNOWLEDGE BASE GENERATION
  // ============================================

  describe('Knowledge Base Generation', () => {
    it('should call OpenAI with correct model', async () => {
      await generateKnowledgeBase('test markdown', mockBrandData)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
        })
      )
    })

    it('should include system prompt with instructions', async () => {
      await generateKnowledgeBase('test markdown', mockBrandData)

      const call = mockCreate.mock.calls[0][0]
      expect(call.messages[0].role).toBe('system')
      expect(call.messages[0].content).toContain('brand strategist')
      expect(call.messages[0].content).toContain('JSON')
    })

    it('should include markdown content in user prompt', async () => {
      await generateKnowledgeBase('# Website Content\n\nSome content', mockBrandData)

      const call = mockCreate.mock.calls[0][0]
      expect(call.messages[1].role).toBe('user')
      expect(call.messages[1].content).toContain('# Website Content')
      expect(call.messages[1].content).toContain('Some content')
    })

    it('should include brand data in user prompt', async () => {
      await generateKnowledgeBase('test', mockBrandData)

      const call = mockCreate.mock.calls[0][0]
      const userPrompt = call.messages[1].content
      expect(userPrompt).toContain('Acme Corp')
      expect(userPrompt).toContain('Innovation at Scale')
      expect(userPrompt).toContain('#FF0000')
      expect(userPrompt).toContain('Professional, Innovative')
    })

    it('should truncate markdown to 12000 characters', async () => {
      const longMarkdown = 'x'.repeat(20000)
      await generateKnowledgeBase(longMarkdown, mockBrandData)

      const call = mockCreate.mock.calls[0][0]
      const userPrompt = call.messages[1].content
      // Markdown is truncated in the prompt, but full length passed to function
      expect(userPrompt).toContain('x'.repeat(12000))
    })

    it('should request JSON response format', async () => {
      await generateKnowledgeBase('test', mockBrandData)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: { type: 'json_object' },
        })
      )
    })

    it('should use temperature 0.7', async () => {
      await generateKnowledgeBase('test', mockBrandData)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7,
        })
      )
    })

    it('should request max 4000 tokens', async () => {
      await generateKnowledgeBase('test', mockBrandData)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 4000,
        })
      )
    })

    it('should parse and return knowledge base', async () => {
      const result = await generateKnowledgeBase('test', mockBrandData)

      expect(result).toEqual(mockKnowledgeBase)
      expect(result.company_overview).toBe('Acme Corp is a leading technology company...')
      expect(result.products_services).toHaveLength(1)
      expect(result.brand_voice.tone).toBe('Professional yet approachable')
    })
  })

  // ============================================
  // CUSTOMER PROFILE GENERATION
  // ============================================

  describe('Customer Profile Generation', () => {
    beforeEach(() => {
      mockCreate.mockReset()
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockCustomerProfiles),
            },
          },
        ],
      })
    })

    it('should throw when OPENAI_API_KEY is missing', async () => {
      vi.unstubAllEnvs()
      delete process.env.OPENAI_API_KEY

      await expect(generateCustomerProfiles(mockKnowledgeBase)).rejects.toThrow(
        /OPENAI_API_KEY.*not set/i
      )
    })

    it('should call OpenAI with correct model', async () => {
      await generateCustomerProfiles(mockKnowledgeBase)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
        })
      )
    })

    it('should include system prompt for persona development', async () => {
      await generateCustomerProfiles(mockKnowledgeBase)

      const call = mockCreate.mock.calls[0][0]
      expect(call.messages[0].role).toBe('system')
      expect(call.messages[0].content).toContain('buyer persona')
      expect(call.messages[0].content).toContain('3-5 detailed')
    })

    it('should include knowledge base in user prompt', async () => {
      await generateCustomerProfiles(mockKnowledgeBase)

      const call = mockCreate.mock.calls[0][0]
      expect(call.messages[1].role).toBe('user')
      expect(call.messages[1].content).toContain('Acme Corp is a leading technology company')
      expect(call.messages[1].content).toContain('Premium Plan')
    })

    it('should use temperature 0.8', async () => {
      await generateCustomerProfiles(mockKnowledgeBase)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8,
        })
      )
    })

    it('should request max 2000 tokens', async () => {
      await generateCustomerProfiles(mockKnowledgeBase)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 2000,
        })
      )
    })

    it('should parse and return personas array', async () => {
      const result = await generateCustomerProfiles(mockKnowledgeBase)

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Alex, the Startup Founder')
      expect(result[0].demographics.age_range).toBe('28-35')
      expect(result[1].name).toBe('Sarah, the Product Manager')
    })

    it('should return empty array if no personas in response', async () => {
      mockCreate.mockReset()
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({}),
            },
          },
        ],
      })

      const result = await generateCustomerProfiles(mockKnowledgeBase)

      expect(result).toEqual([])
    })
  })

  // ============================================
  // ERROR HANDLING
  // ============================================

  describe('Error Handling', () => {
    it('should throw when OpenAI returns no content', async () => {
      mockCreate.mockReset()
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      })

      await expect(generateKnowledgeBase('test', mockBrandData)).rejects.toThrow(
        /No content returned/i
      )
    })

    it('should throw when JSON parsing fails', async () => {
      mockCreate.mockReset()
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'invalid json',
            },
          },
        ],
      })

      await expect(generateKnowledgeBase('test', mockBrandData)).rejects.toThrow(
        /Failed to generate knowledge base/i
      )
    })

    it('should throw when OpenAI API fails', async () => {
      mockCreate.mockReset()
      mockCreate.mockRejectedValue(new Error('API rate limit exceeded'))

      await expect(generateKnowledgeBase('test', mockBrandData)).rejects.toThrow(
        /API rate limit exceeded/
      )
    })

    it('should include original error message', async () => {
      mockCreate.mockReset()
      mockCreate.mockRejectedValue(new Error('Insufficient quota'))

      await expect(generateKnowledgeBase('test', mockBrandData)).rejects.toThrow(
        /Insufficient quota/
      )
    })

    it('should handle empty markdown content', async () => {
      const result = await generateKnowledgeBase('', mockBrandData)

      expect(result).toEqual(mockKnowledgeBase)
      // Should still work, just with empty markdown
    })

    it('should handle customer profile generation errors', async () => {
      mockCreate.mockReset()
      mockCreate.mockRejectedValue(new Error('OpenAI error'))

      await expect(generateCustomerProfiles(mockKnowledgeBase)).rejects.toThrow(
        /Failed to generate customer profiles/i
      )
    })
  })

  // ============================================
  // INTEGRATION SCENARIOS
  // ============================================

  describe('Integration Scenarios', () => {
    it('should generate complete knowledge base with all fields', async () => {
      const result = await generateKnowledgeBase('test', mockBrandData)

      // Verify all expected fields exist
      expect(result).toHaveProperty('company_overview')
      expect(result).toHaveProperty('products_services')
      expect(result).toHaveProperty('target_audience')
      expect(result).toHaveProperty('value_proposition')
      expect(result).toHaveProperty('brand_voice')
      expect(result).toHaveProperty('key_messages')
      expect(result).toHaveProperty('messaging_framework')
      expect(result).toHaveProperty('competitive_advantages')
      expect(result).toHaveProperty('use_cases')

      // Verify nested structures
      expect(result.brand_voice).toHaveProperty('tone')
      expect(result.brand_voice).toHaveProperty('energy_level')
      expect(result.brand_voice).toHaveProperty('communication_style')

      expect(result.messaging_framework).toHaveProperty('headlines')
      expect(result.messaging_framework).toHaveProperty('subheadlines')
      expect(result.messaging_framework).toHaveProperty('call_to_actions')
      expect(result.messaging_framework).toHaveProperty('social_proof_points')
    })

    it('should generate personas with complete profile structure', async () => {
      mockCreate.mockReset()
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockCustomerProfiles),
            },
          },
        ],
      })

      const result = await generateCustomerProfiles(mockKnowledgeBase)

      result.forEach((persona) => {
        expect(persona).toHaveProperty('name')
        expect(persona).toHaveProperty('title')
        expect(persona).toHaveProperty('description')
        expect(persona).toHaveProperty('demographics')
        expect(persona).toHaveProperty('pain_points')
        expect(persona).toHaveProperty('goals')
        expect(persona).toHaveProperty('preferred_channels')

        expect(persona.demographics).toHaveProperty('age_range')
        expect(persona.demographics).toHaveProperty('income_range')
        expect(persona.demographics).toHaveProperty('location')
        expect(persona.demographics).toHaveProperty('education')
      })
    })
  })
})
