import { afterEach, expect, it, vi } from 'vitest'

const subscribe = vi.hoisted(() => vi.fn())
vi.mock('@fal-ai/client', () => ({ createFalClient: () => ({ subscribe }) }))

import { personaPhoto, photoPrompt } from '../persona-photo'
import type { Persona } from '../contract'

const P: Persona = {
  name: 'Marco', role: 'Owner', company: 'a 9-person paid social agency in Scottsdale', day: 'x', measured_on: ['a', 'b'],
  replies_when: 'y', gender: 'man', age: 41, look: 'short dark beard, black polo, a small agency office',
}
afterEach(() => {
  subscribe.mockReset()
  delete process.env.FAL_KEY
})

it('describes the persona, not a generic face', () => {
  const prompt = photoPrompt(P)
  expect(prompt).toContain('41-year-old man who works as Owner at a 9-person paid social agency in Scottsdale')
  expect(prompt).toContain('short dark beard')
})

it('returns the inline image, and null when unconfigured, flagged or not an inline image', async () => {
  expect(await personaPhoto(P, 8_000)).toBeNull()
  process.env.FAL_KEY = 'k'
  subscribe.mockResolvedValueOnce({ data: { images: [{ url: 'data:image/jpeg;base64,AAA' }], has_nsfw_concepts: [false] } })
  expect(await personaPhoto(P, 8_000)).toBe('data:image/jpeg;base64,AAA')
  subscribe.mockResolvedValueOnce({ data: { images: [{ url: 'data:image/jpeg;base64,AAA' }], has_nsfw_concepts: [true] } })
  expect(await personaPhoto(P, 8_000)).toBeNull()
  subscribe.mockResolvedValueOnce({ data: { images: [{ url: 'https://fal.media/x.jpg' }] } })
  expect(await personaPhoto(P, 8_000)).toBeNull()
  subscribe.mockRejectedValueOnce(new Error('down'))
  expect(await personaPhoto(P, 8_000)).toBeNull()
})
