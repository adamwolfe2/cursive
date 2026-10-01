import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { countContacts, GetLeadsError, searchContacts, type GetLeadsFilters } from '../client'

const filters: GetLeadsFilters = { industries: ['Marketing Services'], email_status: ['VALID'] }
const fetchMock = vi.fn()

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }))
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('GETLEADS_API_KEY', 'gl_test_key')
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('getleads client', () => {
  it('counts with bearer auth and the filters as body', async () => {
    respond(200, { ok: true, total_matching: 53, credits_used: 0 })
    await expect(countContacts(filters)).resolves.toBe(53)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://app.getleads.io/api/v1/contacts/search/count')
    expect(init.headers.Authorization).toBe('Bearer gl_test_key')
    expect(JSON.parse(init.body)).toEqual(filters)
  })

  it('searches with limit/offset and normalizes null fields', async () => {
    respond(200, {
      ok: true,
      total_available: 183,
      contacts: [{ first_name: 'Risa', last_name: null, email_address: 'r@x.com', cellphone: '' }],
    })
    const res = await searchContacts(filters, { limit: 2 })
    expect(res.totalAvailable).toBe(183)
    expect(res.contacts[0].last_name).toBe('')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ limit: 2, offset: 0 })
  })

  it('fails closed without an API key and never calls upstream', async () => {
    vi.stubEnv('GETLEADS_API_KEY', '')
    await expect(countContacts(filters)).rejects.toMatchObject({ code: 'not_configured' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps ok:false to a rejected error without leaking the key', async () => {
    respond(400, { ok: false, message: 'Invalid industries: Foo' })
    const err = await countContacts(filters).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(GetLeadsError)
    expect((err as GetLeadsError).code).toBe('rejected')
    expect((err as GetLeadsError).message).not.toContain('gl_test_key')
  })

  it('rejects unexpected shapes', async () => {
    respond(200, { ok: true, total_matching: 'lots' })
    await expect(countContacts(filters)).rejects.toMatchObject({ code: 'invalid_response' })
  })

  it('maps timeouts', async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error('timed out'), { name: 'TimeoutError' }))
    await expect(countContacts(filters)).rejects.toMatchObject({ code: 'timeout' })
  })
})
