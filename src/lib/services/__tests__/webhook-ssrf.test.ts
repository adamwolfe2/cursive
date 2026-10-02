import { describe, expect, it, vi } from 'vitest'

const { undiciFetch } = vi.hoisted(() => ({ undiciFetch: vi.fn() }))
vi.mock('undici', async (orig) => ({ ...(await orig<typeof import('undici')>()), fetch: undiciFetch }))

import { deliverWebhook } from '@/lib/services/webhook.service'

const payload = { event: 'lead.created', timestamp: '2026-10-02T00:00:00Z', data: {} } as never

describe('deliverWebhook SSRF guard', () => {
  it.each([
    'http://example.com/hook',
    'https://169.254.169.254/latest/meta-data',
    'https://10.0.0.5/hook',
    'https://localhost/hook',
    'https://metadata.google.internal/x',
  ])('refuses %s without sending a request', async (url) => {
    const res = await deliverWebhook(url, payload, 'secret')
    expect(res).toEqual({ success: false, error: 'Webhook URL is not allowed' })
    expect(undiciFetch).not.toHaveBeenCalled()
  })

  it('sends to a public https URL without following redirects', async () => {
    undiciFetch.mockResolvedValueOnce(new Response('ok', { status: 200 }))
    const res = await deliverWebhook('https://hooks.example.com/in', payload, 'secret')
    expect(res.success).toBe(true)
    expect(undiciFetch.mock.calls[0][1]).toMatchObject({ redirect: 'error', method: 'POST' })
  })
})
