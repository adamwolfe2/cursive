/**
 * A realistic, AI-generated portrait for the example buyer (fal Flux dev, 512px, about $0.007 each).
 * Returned inline as a data: URL so it caches with the scan for its full TTL; fal's hosted URLs may not last that long.
 * Best effort: any failure or a slow render returns null and the card shows the initial instead.
 */
import { createFalClient } from '@fal-ai/client'
import { z } from 'zod'
import { safeWarn } from '@/lib/utils/log-sanitizer'
import type { Persona } from './contract'

const MODEL = 'fal-ai/flux/dev'

const ResultSchema = z.object({
  images: z.array(z.object({ url: z.string().startsWith('data:image/') })).min(1),
  has_nsfw_concepts: z.array(z.boolean()).optional(),
})

export function photoPrompt(p: Persona): string {
  const who = [p.age ? `${p.age}-year-old` : null, p.gender ?? 'person'].filter(Boolean).join(' ')
  return [
    `Candid professional portrait photo of a ${who} who works as ${p.role} at ${p.company}.`,
    p.look ? `${p.look}.` : null,
    'Head and shoulders, looking at the camera with a relaxed, natural expression. Soft window light, shallow depth of field,',
    '50mm lens, realistic skin texture, real photograph, not posed like stock. No text, no logos, no watermark.',
  ]
    .filter(Boolean)
    .join(' ')
}

let client: ReturnType<typeof createFalClient> | null = null

/** null when FAL_KEY is missing, the render fails or is flagged, or it takes longer than `timeoutMs`. */
export async function personaPhoto(persona: Persona, timeoutMs: number): Promise<string | null> {
  if (!process.env.FAL_KEY || timeoutMs < 1_500) return null
  client ??= createFalClient({ credentials: process.env.FAL_KEY })
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs)
  })
  const render = client
    .subscribe(MODEL, {
      input: {
        prompt: photoPrompt(persona),
        image_size: 'square',
        num_images: 1,
        num_inference_steps: 28,
        enable_safety_checker: true,
        output_format: 'jpeg',
        sync_mode: true,
      },
    })
    .then((res) => {
      const parsed = ResultSchema.safeParse(res.data)
      if (!parsed.success) {
        safeWarn('[free-leads/persona-photo] unexpected response', parsed.error.message.slice(0, 200))
        return null
      }
      if (parsed.data.has_nsfw_concepts?.[0]) return null
      return parsed.data.images[0].url
    })
    .catch((err: unknown) => {
      // fal's ApiError keeps the reason ("Exhausted balance") in body, not message.
      const e = err as { status?: unknown; body?: unknown; message?: unknown }
      safeWarn('[free-leads/persona-photo] render failed', JSON.stringify({ status: e.status, body: e.body, message: e.message }).slice(0, 300))
      return null
    })
  const photo = await Promise.race([render, late])
  clearTimeout(timer)
  if (!photo) safeWarn('[free-leads/persona-photo] skipped', 'failed, flagged or over deadline')
  return photo
}
