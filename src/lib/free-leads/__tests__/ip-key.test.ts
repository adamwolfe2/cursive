import { describe, expect, it } from 'vitest'
import { ipKey } from '../http'

describe('ipKey (rate-limit identity)', () => {
  it('keeps IPv4 as-is and unwraps IPv4-mapped IPv6', () => {
    expect(ipKey('203.0.113.7')).toBe('203.0.113.7')
    expect(ipKey('::ffff:203.0.113.7')).toBe('203.0.113.7')
  })

  it('keys IPv6 by its /64 so one client cannot rotate through its prefix', () => {
    const a = ipKey('2001:db8:abcd:12:1::1')
    expect(a).toBe('2001:db8:abcd:12::/64')
    expect(ipKey('2001:0db8:abcd:0012:ffff:ffff:ffff:ffff')).toBe(a)
    expect(ipKey('2001:DB8:ABCD:12::99')).toBe(a)
    expect(ipKey('2001:db8:abcd:13::1')).not.toBe(a)
  })

  it('expands :: correctly at either end and strips zone ids', () => {
    expect(ipKey('::1')).toBe('0:0:0:0::/64')
    expect(ipKey('2001:db8::')).toBe('2001:db8:0:0::/64')
    expect(ipKey('fe80::1%eth0')).toBe('fe80:0:0:0::/64')
    expect(ipKey('64:ff9b::192.0.2.1')).toBe('64:ff9b:0:0::/64')
  })

  it('passes through junk without throwing', () => {
    expect(ipKey('unknown')).toBe('unknown')
    expect(ipKey('')).toBe('unknown')
  })
})
