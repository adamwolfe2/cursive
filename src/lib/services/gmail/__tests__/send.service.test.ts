/**
 * Gmail Send Service — unit tests
 *
 * Covers the RFC 2822 builder + base64url encoding. The actual fetch call
 * is not exercised here (covered by integration testing). We export the
 * private helpers via __testExports for direct assertion.
 */

import { describe, it, expect } from 'vitest'

// We don't have a __testExports right now — instead, build a tiny harness
// that re-implements the public surface without HTTP. The send service is
// pure aside from the fetch call, so we test by importing and overriding
// global.fetch for the integration-level test.
import { sendViaGmail } from '@/lib/services/gmail/send.service'

// =========================================================================
// Harness — we monkey-patch global.fetch and getValidAccessToken
// =========================================================================
import * as accountService from '@/lib/services/gmail/email-account.service'
import { vi, beforeEach, afterEach } from 'vitest'

let fetchSpy: ReturnType<typeof vi.fn>
let tokenSpy: ReturnType<typeof vi.spyOn>

// Build a fetch mock that responds differently to /messages/send vs
// /messages/<id> (the metadata read-back for Message-Id).
function makeFetchMock(metadataResponse?: { headers?: Array<{ name: string; value: string }> }) {
  return vi.fn(async (url: string) => {
    if (typeof url === 'string' && url.includes('/messages/send')) {
      return new Response(
        JSON.stringify({ id: 'msg-123', threadId: 'thr-456', labelIds: ['SENT'] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
    // Metadata GET (read-back of Message-Id header)
    return new Response(
      JSON.stringify({
        payload: {
          headers: metadataResponse?.headers ?? [
            { name: 'Message-Id', value: '<CABcD123@mail.gmail.com>' },
          ],
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  })
}

beforeEach(() => {
  fetchSpy = makeFetchMock()
  // @ts-expect-error overriding global
  global.fetch = fetchSpy
  tokenSpy = vi.spyOn(accountService, 'getValidAccessToken').mockResolvedValue('token-abc')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('sendViaGmail', () => {
  it('calls Gmail API with bearer token + base64url-encoded raw message + reads back Message-Id', async () => {
    const result = await sendViaGmail({
      accountId: 'acc-1',
      fromEmail: 'me@cursive.com',
      fromName: 'Adam',
      toEmail: 'jane@example.com',
      toName: 'Jane',
      subject: 'Hello there',
      bodyHtml: '<p>Hi Jane</p>',
      bodyText: 'Hi Jane',
    })

    expect(result).toMatchObject({
      messageId: 'msg-123',
      threadId: 'thr-456',
      rfc822MessageId: '<CABcD123@mail.gmail.com>',
    })
    expect(tokenSpy).toHaveBeenCalledWith('acc-1')
    // 1 send + 1 metadata read-back
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    const sendCall = fetchSpy.mock.calls.find(
      (c: any[]) => typeof c[0] === 'string' && c[0].includes('/messages/send')
    )
    expect(sendCall).toBeDefined()
    const [url, init] = sendCall!
    expect(url).toBe('https://gmail.googleapis.com/gmail/v1/users/me/messages/send')
    expect((init as RequestInit).method).toBe('POST')
    const headers = (init as RequestInit).headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer token-abc')
    expect(headers['Content-Type']).toBe('application/json')

    const body = JSON.parse((init as RequestInit).body as string) as { raw: string }
    expect(typeof body.raw).toBe('string')

    // Decode the base64url payload back to RFC 2822 and assert headers/body
    const decoded = Buffer.from(
      body.raw.replace(/-/g, '+').replace(/_/g, '/') + '==',
      'base64'
    ).toString('utf8')

    expect(decoded).toContain('From: Adam <me@cursive.com>')
    expect(decoded).toContain('To: Jane <jane@example.com>')
    expect(decoded).toContain('Subject: Hello there')
    expect(decoded).toContain('MIME-Version: 1.0')
    expect(decoded).toContain('multipart/alternative')
    expect(decoded).toContain('Hi Jane')
    expect(decoded).toContain('<p>Hi Jane</p>')

    // Metadata read-back call
    const metaCall = fetchSpy.mock.calls.find(
      (c: any[]) => typeof c[0] === 'string' && c[0].includes('/messages/msg-123')
    )
    expect(metaCall).toBeDefined()
  })

  it('returns null rfc822MessageId when metadata fetch fails (non-fatal)', async () => {
    fetchSpy = vi.fn(async (url: string) => {
      if (typeof url === 'string' && url.includes('/messages/send')) {
        return new Response(
          JSON.stringify({ id: 'msg-123', threadId: 'thr-456' }),
          { status: 200 }
        )
      }
      // metadata fetch returns 500
      return new Response('boom', { status: 500 })
    })
    // @ts-expect-error overriding global
    global.fetch = fetchSpy

    const result = await sendViaGmail({
      accountId: 'acc-1',
      fromEmail: 'me@cursive.com',
      toEmail: 'a@b.com',
      subject: 'x',
      bodyHtml: '<p>x</p>',
    })
    expect(result.messageId).toBe('msg-123')
    expect(result.rfc822MessageId).toBeNull()
  })

  it('encodes non-ASCII subject as RFC 2047 encoded-word', async () => {
    await sendViaGmail({
      accountId: 'acc-1',
      fromEmail: 'me@cursive.com',
      toEmail: 'a@b.com',
      subject: 'Olá — café',
      bodyHtml: '<p>x</p>',
    })
    const sendCall = fetchSpy.mock.calls.find(
      (c: any[]) => typeof c[0] === 'string' && c[0].includes('/messages/send')
    )!
    const body = JSON.parse(sendCall[1].body as string) as { raw: string }
    const decoded = Buffer.from(
      body.raw.replace(/-/g, '+').replace(/_/g, '/') + '==',
      'base64'
    ).toString('utf8')
    expect(decoded).toMatch(/Subject: =\?UTF-8\?B\?/)
  })

  it('quotes display names containing special characters', async () => {
    await sendViaGmail({
      accountId: 'acc-1',
      fromEmail: 'me@cursive.com',
      fromName: 'Smith, Adam',
      toEmail: 'a@b.com',
      subject: 'x',
      bodyHtml: '<p>x</p>',
    })
    const sendCall = fetchSpy.mock.calls.find(
      (c: any[]) => typeof c[0] === 'string' && c[0].includes('/messages/send')
    )!
    const body = JSON.parse(sendCall[1].body as string) as { raw: string }
    const decoded = Buffer.from(
      body.raw.replace(/-/g, '+').replace(/_/g, '/') + '==',
      'base64'
    ).toString('utf8')
    expect(decoded).toContain('From: "Smith, Adam" <me@cursive.com>')
  })

  it('falls back to stripped HTML when bodyText is empty', async () => {
    await sendViaGmail({
      accountId: 'acc-1',
      fromEmail: 'me@cursive.com',
      toEmail: 'a@b.com',
      subject: 'x',
      bodyHtml: '<p>Line one</p><p>Line two</p>',
    })
    const sendCall = fetchSpy.mock.calls.find(
      (c: any[]) => typeof c[0] === 'string' && c[0].includes('/messages/send')
    )!
    const body = JSON.parse(sendCall[1].body as string) as { raw: string }
    const decoded = Buffer.from(
      body.raw.replace(/-/g, '+').replace(/_/g, '/') + '==',
      'base64'
    ).toString('utf8')
    // The plain-text part should contain the stripped content
    expect(decoded).toContain('Line one')
    expect(decoded).toContain('Line two')
  })

  it('throws on non-2xx Gmail response', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('{"error":{"message":"invalid_grant"}}', { status: 401 })
    )
    await expect(
      sendViaGmail({
        accountId: 'acc-1',
        fromEmail: 'me@cursive.com',
        toEmail: 'a@b.com',
        subject: 'x',
        bodyHtml: '<p>x</p>',
      })
    ).rejects.toThrow(/Gmail send failed: 401/)
  })
})
