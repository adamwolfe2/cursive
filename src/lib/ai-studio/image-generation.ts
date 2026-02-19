/**
 * Image Generation - AI-powered ad creative generation
 * Uses Fal.ai with Flux model for fast, high-quality image generation
 */

import * as fal from '@fal-ai/client'
import type { BrandDNA } from './firecrawl'
import type { CustomerProfile, KnowledgeBase } from './knowledge'
import { logApiCall } from '@/lib/services/api-logger'
import { safeError } from '@/lib/utils/log-sanitizer'

function configureFal() {
  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY is not set in environment variables')
  }
  ;(fal as any).config({
    credentials: process.env.FAL_KEY,
  })
}

export type CreativeFormat = 'square' | 'story' | 'landscape'
export type StylePreset =
  | 'Write with Elegance'
  | 'Flow of Creativity'
  | 'Handcrafted Perfection'
  | 'Timeless Style'

export type QualityLevel = 'fast' | 'balanced' | 'high'

export interface GenerateCreativeInput {
  prompt: string
  brandData: BrandDNA
  knowledgeBase?: KnowledgeBase | null
  icp?: CustomerProfile | null
  offer?: { name: string; description: string } | null
  stylePreset?: StylePreset
  format?: CreativeFormat
  quality?: QualityLevel
}

export interface GenerateCreativeOutput {
  imageUrl: string
  enhancedPrompt: string
}

/**
 * Generate ad creative image with Fal.ai Flux model
 */
export async function generateAdCreative({
  prompt,
  brandData,
  knowledgeBase,
  icp,
  offer,
  stylePreset,
  format = 'square',
  quality = 'high'
}: GenerateCreativeInput): Promise<GenerateCreativeOutput> {
  try {
    configureFal()
    // Build enhanced prompt with full brand intelligence
    const enhancedPrompt = buildPrompt({
      userPrompt: prompt,
      brandData,
      knowledgeBase,
      icp,
      offer,
      stylePreset,
    })

    // Image dimensions based on format
    const dimensions = getImageDimensions(format)

    // Select model and settings based on quality
    const { model, steps } = getQualitySettings(quality)

    // Generate with Flux (Pro for quality, Dev for balanced, Schnell for fast)
    const falStart = Date.now()
    const result = await (fal as any).subscribe(model, {
      input: {
        prompt: enhancedPrompt,
        image_size: dimensions,
        num_inference_steps: steps,
        num_images: 1,
        enable_safety_checker: true,
        guidance_scale: quality === 'high' ? 3.5 : 3.0, // Higher guidance for better brand adherence
      }
    }) as any
    const falEndpoint = model.replace('fal-ai/', '')
    logApiCall({ service: 'fal', endpoint: falEndpoint, durationMs: Date.now() - falStart,
      statusCode: result?.images?.length ? 200 : 500,
      metadata: { model, format, quality } })

    if (!result.images || result.images.length === 0) {
      throw new Error('No images generated')
    }

    const imageUrl = result.images[0].url

    return {
      imageUrl,
      enhancedPrompt,
    }
  } catch (error: any) {
    safeError('[ImageGen] Error generating creative:', error)
    throw new Error(`Failed to generate creative: ${error.message}`)
  }
}

/**
 * Get model and steps based on quality level
 */
function getQualitySettings(quality: QualityLevel): { model: string; steps: number } {
  switch (quality) {
    case 'fast':
      return {
        model: 'fal-ai/flux/schnell',  // Fastest, 4 steps
        steps: 4
      }
    case 'balanced':
      return {
        model: 'fal-ai/flux/dev',  // Balanced quality/speed, 20 steps
        steps: 20
      }
    case 'high':
      return {
        model: 'fal-ai/flux-pro',  // Highest quality, 30 steps
        steps: 30
      }
  }
}

/**
 * Build comprehensive prompt with full brand intelligence
 */
function buildPrompt({
  userPrompt,
  brandData,
  knowledgeBase,
  icp,
  offer,
  stylePreset,
}: {
  userPrompt: string
  brandData: BrandDNA
  knowledgeBase?: KnowledgeBase | null
  icp?: CustomerProfile | null
  offer?: { name: string; description: string } | null
  stylePreset?: StylePreset
}): string {
  // Start with company context
  let prompt = `Professional advertisement for ${brandData.company_name}`

  // Add tagline if available
  if (brandData.tagline) {
    prompt += ` - "${brandData.tagline}"`
  }
  prompt += '. '

  // Add brand voice and personality (from knowledge base)
  if (knowledgeBase?.brand_voice) {
    prompt += `Brand personality: ${knowledgeBase.brand_voice.tone}, ${knowledgeBase.brand_voice.energy_level}. `
    prompt += `Communication style: ${knowledgeBase.brand_voice.communication_style}. `
  } else if (brandData.brand_personality.length > 0) {
    prompt += `Brand personality: ${brandData.brand_personality.join(', ')}. `
  }

  // Add style preset
  if (stylePreset) {
    const styleGuides: Record<StylePreset, string> = {
      'Write with Elegance': 'Visual style: Elegant, sophisticated, minimal design with refined typography, clean layouts, and premium aesthetics. ',
      'Flow of Creativity': 'Visual style: Creative, flowing organic shapes, abstract artistic backgrounds, vibrant gradients, and dynamic elements. ',
      'Handcrafted Perfection': 'Visual style: Hand-drawn artisanal elements, organic textures, warm authentic feel, crafted details. ',
      'Timeless Style': 'Visual style: Classic, timeless design with enduring elegance, clean layouts, traditional refinement. ',
    }
    prompt += styleGuides[stylePreset]
  }

  // Comprehensive color palette
  prompt += `Color palette: Primary ${brandData.primary_color}, Secondary ${brandData.secondary_color}, Accent ${brandData.accent_color}, Background ${brandData.background_color}. `
  prompt += `These colors MUST be prominently featured and accurately matched. `

  // Typography direction
  prompt += `Typography style: Headings in ${brandData.heading_font}, Body text in ${brandData.body_font}. `

  // Target audience context (critical for relevance)
  if (icp) {
    prompt += `Target audience: ${icp.name} (${icp.title}). `
    prompt += `Demographics: ${icp.demographics.age_range}, ${(icp.demographics as any).income_level ?? ''}, ${icp.demographics.location}. `
    prompt += `Pain points: ${icp.pain_points.slice(0, 2).join(', ')}. `
    prompt += `Goals: ${icp.goals.slice(0, 2).join(', ')}. `
  } else if (knowledgeBase?.target_audience) {
    prompt += `Target audience: ${knowledgeBase.target_audience.slice(0, 200)}. `
  }

  // Offer/product context
  if (offer) {
    prompt += `Featuring: ${offer.name} - ${offer.description}. `
  } else if (knowledgeBase?.products_services[0]) {
    const product = knowledgeBase.products_services[0]
    prompt += `Featuring: ${product.name} - ${product.description.slice(0, 150)}. `
  }

  // Value proposition (why should they care?)
  if (knowledgeBase?.value_proposition && knowledgeBase.value_proposition.length > 0) {
    prompt += `Key benefit: ${knowledgeBase.value_proposition[0]}. `
  } else if (brandData.value_propositions.length > 0) {
    prompt += `Key benefit: ${brandData.value_propositions[0]}. `
  }

  // User's creative direction (most important)
  prompt += `\n\nCREATIVE DIRECTION: ${userPrompt}\n\n`

  // Technical quality requirements
  prompt += `Technical requirements: Professional commercial photography style, ultra high quality, 8K resolution, modern composition, perfect lighting (studio quality or natural golden hour). `
  prompt += `Sharp focus, depth of field, cinematic color grading. `
  prompt += `Include clear space for text overlay (headline area at top or bottom third). `
  prompt += `Composition should follow rule of thirds. `
  prompt += `Photo-realistic, not illustrated or cartoon style. `
  prompt += `Professional marketing photography that converts. `
  prompt += `Avoid any text, words, or letters in the image itself. `

  return prompt
}

/**
 * Get exact pixel dimensions for optimal quality
 */
function getImageDimensions(format: CreativeFormat): { width: number; height: number } {
  const dimensions = {
    square: { width: 1024, height: 1024 },       // 1:1 - Instagram feed, Facebook post (1080x1080)
    story: { width: 1080, height: 1920 },        // 9:16 - Instagram Stories, TikTok, Reels
    landscape: { width: 1200, height: 628 },     // 1.91:1 - Facebook link preview, Twitter/X card
  }

  return dimensions[format]
}

/**
 * Estimate credit cost for generation
 */
export function estimateCreditCost(format: CreativeFormat): number {
  // Approximate costs (in cents) based on Fal.ai pricing
  const costs = {
    square: 5,      // ~$0.05
    story: 5,       // ~$0.05
    landscape: 5,   // ~$0.05
  }
  return costs[format]
}
