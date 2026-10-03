import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { hashIp } from '@/lib/free-leads/rules'

describe('hashIp FREE_LEADS_IP_SALT', () => {
  const original = process.env.FREE_LEADS_IP_SALT

  beforeEach(() => {
    delete process.env.FREE_LEADS_IP_SALT
  })
  afterEach(() => {
    if (original === undefined) delete process.env.FREE_LEADS_IP_SALT
    else process.env.FREE_LEADS_IP_SALT = original
  })

  it('fails closed with a clear error when the salt is missing', () => {
    expect(() => hashIp('1.2.3.4')).toThrow(/FREE_LEADS_IP_SALT is required/)
  })

  it('does not fall back to the service-role key', () => {
    const prev = process.env.SUPABASE_SERVICE_ROLE_KEY
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
    try {
      expect(() => hashIp('1.2.3.4')).toThrow()
    } finally {
      if (prev === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
      else process.env.SUPABASE_SERVICE_ROLE_KEY = prev
    }
  })

  it('is stable and keyed when the salt is set', () => {
    process.env.FREE_LEADS_IP_SALT = 'a'.repeat(32)
    const a = hashIp('1.2.3.4')
    expect(a).toBe(hashIp('1.2.3.4'))
    expect(a).toHaveLength(32)
    process.env.FREE_LEADS_IP_SALT = 'b'.repeat(32)
    expect(hashIp('1.2.3.4')).not.toBe(a)
  })
})
