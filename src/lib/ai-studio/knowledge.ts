/**
 * Knowledge Base Generation - AI-powered company intelligence
 * Uses OpenAI GPT-4 to generate structured company knowledge from scraped content
 */

import OpenAI from 'openai'
import type { BrandDNA } from './firecrawl'

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface ProductService {
  name: string
  description: string
  target_audience: string
}

export interface BrandVoice {
  tone: string
  energy_level: string
  communication_style: string
}

export interface MessagingFramework {
  headlines: string[]
  subheadlines: string[]
  call_to_actions: string[]
  social_proof_points: string[]
}

export interface KnowledgeBase {
  company_overview: string
  products_services: ProductService[]
  target_audience: string
  value_proposition: string[]
  brand_voice: BrandVoice
  key_messages: string[]
  messaging_framework: MessagingFramework
  competitive_advantages: string[]
  use_cases: string[]
}

/**
 * Generate comprehensive knowledge base from scraped website content
 */
export async function generateKnowledgeBase(
  markdown: string,
  brandData: BrandDNA
): Promise<KnowledgeBase> {
  try {
    const openai = getOpenAIClient()
    const systemPrompt = `You are an expert brand strategist and marketing intelligence analyst. Your job is to create a comprehensive brand knowledge base that can be used to generate perfectly on-brand advertising creatives, marketing copy, and messaging.

Analyze the website content deeply and extract actionable marketing intelligence.

Output Format (strict JSON):
{
  "company_overview": "3-4 paragraph deep analysis of the company: (1) What they do and their mission, (2) Their unique positioning and competitive advantages, (3) Their target market and why they matter, (4) Cultural/brand values that define them. Be specific with examples.",
  "products_services": [
    {
      "name": "Product/Service Name",
      "description": "Comprehensive description including: what it does, key features, main benefits, who it's for, and what problem it solves. Be detailed and specific.",
      "target_audience": "Specific persona: demographics (age, income, job role), psychographics (values, behaviors, pain points), and buying motivations"
    }
  ],
  "target_audience": "Detailed ideal customer profile: Demographics (age range, income level, location, job titles, company size if B2B), Psychographics (values, goals, challenges, behaviors), Pain points they experience, What success looks like for them, Where they spend time (channels/platforms)",
  "value_proposition": [
    "Primary value prop - the #1 transformation or outcome customers get",
    "Secondary value prop - supporting benefit",
    "Tertiary value prop - additional differentiation",
    "Emotional benefit - how it makes customers feel",
    "Practical benefit - tangible result they achieve"
  ],
  "brand_voice": {
    "tone": "Precise brand tone (e.g., 'Professional yet approachable with subtle humor', 'Bold and provocative with data-backed confidence', 'Warm and empathetic with educational authority')",
    "energy_level": "Energy and pacing (e.g., 'Calm, methodical, and reassuring', 'High-energy, urgent, and action-oriented', 'Steady, confident, and authoritative')",
    "communication_style": "How they talk to customers (e.g., 'Data-driven with visual storytelling', 'Simple explanations with relatable metaphors', 'Direct problem-solution framing', 'Aspirational storytelling with social proof')"
  },
  "key_messages": [
    "Core message 1 - primary brand promise customers should remember",
    "Core message 2 - key differentiator from competitors",
    "Core message 3 - emotional/aspirational message",
    "Core message 4 - credibility/trust message",
    "Core message 5 - call to action message"
  ],
  "messaging_framework": {
    "headlines": [
      "3-5 headline templates that match brand voice and value props",
      "Example: 'Transform [pain point] into [desired outcome] in [timeframe]'",
      "Example: '[Do thing] without [common obstacle]'"
    ],
    "subheadlines": [
      "3-5 supporting subheadline templates that add specificity",
      "Should expand on headline and provide social proof or credibility"
    ],
    "call_to_actions": [
      "5-7 CTA variations matching brand voice",
      "Mix of urgency levels (soft, medium, strong)",
      "Include specific action verbs they actually use"
    ],
    "social_proof_points": [
      "Customer results/testimonials format",
      "Statistics and credibility markers",
      "Awards, certifications, partnerships to highlight"
    ]
  },
  "competitive_advantages": [
    "Specific advantage 1 - what they do better/differently than competitors",
    "Specific advantage 2 - unique capability or approach",
    "Specific advantage 3 - barrier to entry or moat",
    "Specific advantage 4 - category innovation or market position"
  ],
  "use_cases": [
    "Use case 1: [Persona] uses [product] to [achieve outcome] because [pain point]",
    "Use case 2: [Different persona/situation]",
    "Use case 3: [Another scenario]"
  ]
}

CRITICAL Guidelines:
- Be hyper-specific. Extract real examples, actual numbers, named features
- Avoid generic marketing speak. If you say "innovative" explain exactly how
- Focus on customer outcomes and transformations, not just features
- Identify emotional AND practical benefits for every value prop
- Brand voice should be descriptive enough to write in their style
- Messaging framework should be templates that can generate 100s of variations
- Extract their actual language patterns (do they say "customers" or "users"? "platform" or "tool"?)
- Look for repeated phrases, positioning statements, and key differentiators they emphasize`

    const userPrompt = `Website Content (Markdown):
${markdown.slice(0, 12000)}

Brand Identity Extracted:
- Company: ${brandData.company_name}
- Tagline: ${brandData.tagline}
- Hero Headline: ${brandData.headline}
- Meta Description: ${brandData.meta_description}
- Primary Color: ${brandData.primary_color}
- Secondary Color: ${brandData.secondary_color}
- Brand Personality Traits: ${brandData.brand_personality.join(', ') || 'Not extracted'}
- Value Propositions Found: ${brandData.value_propositions.join('; ') || 'Not extracted'}

Visual Assets Available:
- Logo URL: ${brandData.logo_url || 'Not found'}
- ${brandData.hero_images.length} hero images
- ${brandData.product_images.length} product images
- ${brandData.icon_urls.length} icons

Analyze this content deeply and generate a comprehensive, actionable knowledge base in the exact JSON format specified. Be specific with examples from their actual content.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // Latest GPT-4 Omni model for best quality
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,  // Increased for comprehensive knowledge base
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content returned from OpenAI')
    }

    const knowledgeBase = JSON.parse(content) as KnowledgeBase

    return knowledgeBase
  } catch (error: any) {
    console.error('[Knowledge] Error generating knowledge base:', error)
    throw new Error(`Failed to generate knowledge base: ${error.message}`)
  }
}

/**
 * Generate customer personas (ICPs) from knowledge base
 */
export async function generateCustomerProfiles(
  knowledgeBase: KnowledgeBase
): Promise<CustomerProfile[]> {
  try {
    const openai = getOpenAIClient()
    const systemPrompt = `You are an expert in buyer persona development. Create 3-5 detailed, realistic buyer personas based on the company information provided.

Output Format (strict JSON):
{
  "personas": [
    {
      "name": "First Name, the Descriptive Title (e.g., 'Alex, the Tech-Savvy Startup Founder')",
      "title": "Job Title (e.g., 'Startup Founder')",
      "description": "2-3 sentence character description that brings this persona to life",
      "demographics": {
        "age_range": "Age range (e.g., '28-35')",
        "income_range": "Income range (e.g., '$70,000-120,000')",
        "location": "Geographic location (e.g., 'Urban areas, US')",
        "education": "Education level (e.g., 'Bachelor's degree')"
      },
      "pain_points": [
        "Specific pain point 1 that this product/service solves",
        "Specific pain point 2",
        "Specific pain point 3"
      ],
      "goals": [
        "Primary goal 1",
        "Primary goal 2",
        "Primary goal 3"
      ],
      "preferred_channels": [
        "Marketing channel 1 (e.g., 'LinkedIn')",
        "Marketing channel 2 (e.g., 'Tech forums')",
        "Marketing channel 3"
      ]
    }
  ]
}

Guidelines:
- Create diverse personas that represent different market segments
- Give each persona a memorable, specific name
- Pain points should directly relate to what the company solves
- Goals should align with the company's value proposition
- Preferred channels should be realistic for that persona type`

    const userPrompt = `Company Knowledge Base:
${JSON.stringify(knowledgeBase, null, 2)}

Generate 3-5 detailed buyer personas in the exact JSON format specified.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 2000,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content returned from OpenAI')
    }

    const result = JSON.parse(content)

    return result.personas || []
  } catch (error: any) {
    console.error('[Knowledge] Error generating customer profiles:', error)
    throw new Error(`Failed to generate customer profiles: ${error.message}`)
  }
}

export interface CustomerProfile {
  name: string
  title: string
  description: string
  demographics: {
    age_range: string
    income_range: string
    location: string
    education: string
  }
  pain_points: string[]
  goals: string[]
  preferred_channels: string[]
}
