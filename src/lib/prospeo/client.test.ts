import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { canLookUp, findWorkEmail, ProspeoError } from './client'

const q = { firstName: 'Ada', lastName: 'L', companyDomain: 'acme.com' }
const reply = (body: unknown, status = 200) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))

describe('findWorkEmail', () => {
  beforeEach(() => { process.env.PROSPEO_API_KEY = 'k' })
  afterEach(() => vi.unstubAllGlobals())

  it('returns the lowercased verified email and sends key, only_verified_email and the company website', async () => {
    const f = reply({ error: false, person: { email: { status: 'VERIFIED', email: 'Ada@Acme.com', revealed: true } } })
    vi.stubGlobal('fetch', f)
    expect(await findWorkEmail(q)).toBe('ada@acme.com')
    const [url, init] = f.mock.calls[0]
    expect(url).toBe('https://api.prospeo.io/enrich-person')
    expect(init.headers['X-KEY']).toBe('k')
    expect(JSON.parse(init.body)).toEqual({ only_verified_email: true, data: { first_name: 'Ada', last_name: 'L', company_website: 'acme.com' } })
  })

  it('prefers a LinkedIn URL when there is one', async () => {
    const f = reply({ error: true, error_code: 'NO_MATCH' }, 400)
    vi.stubGlobal('fetch', f)
    expect(await findWorkEmail({ ...q, linkedinUrl: 'https://linkedin.com/in/x' })).toBeNull()
    expect(JSON.parse(f.mock.calls[0][1].body).data).toEqual({ linkedin_url: 'https://linkedin.com/in/x' })
  })

  it('NO_MATCH is null; other errors, bad shapes and timeouts throw', async () => {
    vi.stubGlobal('fetch', reply({ error: true, error_code: 'NO_MATCH' }, 400))
    expect(await findWorkEmail(q)).toBeNull()
    vi.stubGlobal('fetch', reply({ error: true, error_code: 'INSUFFICIENT_CREDITS' }, 400))
    await expect(findWorkEmail(q)).rejects.toMatchObject({ code: 'rejected' })
    vi.stubGlobal('fetch', reply({ nope: 1 }))
    await expect(findWorkEmail(q)).rejects.toMatchObject({ code: 'invalid_response' })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('t'), { name: 'TimeoutError' })))
    await expect(findWorkEmail(q)).rejects.toMatchObject({ code: 'timeout' })
  })

  it('throws before any request without a key', async () => {
    delete process.env.PROSPEO_API_KEY
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    await expect(findWorkEmail(q)).rejects.toBeInstanceOf(ProspeoError)
    expect(f).not.toHaveBeenCalled()
  })

  it('canLookUp needs a name plus a domain, or a LinkedIn URL', () => {
    expect(canLookUp(q)).toBe(true)
    expect(canLookUp({ ...q, companyDomain: undefined })).toBe(false)
    expect(canLookUp({ firstName: '', lastName: '', linkedinUrl: 'x' })).toBe(true)
  })
})
