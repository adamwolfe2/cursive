/**
 * Unit tests for text sanitization utilities (XSS prevention)
 */

import { describe, it, expect } from 'vitest'
import {
  sanitizeText,
  sanitizeName,
  sanitizeCompanyName,
  sanitizeEmail,
} from '@/lib/utils/sanitize-text'

describe('sanitizeText', () => {
  describe('null/undefined/empty', () => {
    it('returns empty string for null, undefined, and empty string', () => {
      expect(sanitizeText(null)).toBe('')
      expect(sanitizeText(undefined)).toBe('')
      expect(sanitizeText('')).toBe('')
    })
  })

  describe('HTML tag removal', () => {
    it('strips plain HTML tags', () => {
      expect(sanitizeText('<b>bold</b> text')).toBe('bold text')
      expect(sanitizeText('<div><p>hello</p></div>')).toBe('hello')
    })

    it('strips script tags -- but the inner JS text survives as plain text', () => {
      // Actual behavior: the generic `<[^>]*>` tag-stripping regex runs FIRST
      // and removes the <script> and </script> tags themselves, so the
      // dedicated "remove script tags and their content" regex that runs
      // second has nothing left to match (no <script> tag remains). The
      // JS source text is left behind as inert text content, not executed.
      // This differs from the doc comment's stated intent ("Remove script
      // tags and their content") but is the real, current behavior.
      expect(sanitizeText('<script>alert(1)</script>hello')).toBe('alert(1)hello')
    })
  })

  describe('event-handler attribute stripping', () => {
    it('strips onerror= handlers that are part of a full tag (removed with the tag)', () => {
      expect(sanitizeText('<img src=x onerror="alert(1)">safe')).toBe('safe')
    })

    it('strips a standalone onclick= attribute pattern outside of tag context', () => {
      expect(sanitizeText('click me onclick="doEvil()" now')).toBe('click me now')
    })
  })

  describe('javascript: protocol stripping', () => {
    it('removes the javascript: protocol prefix, case-insensitively', () => {
      expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)')
      expect(sanitizeText('JAVASCRIPT:alert(1)')).toBe('alert(1)')
    })
  })

  describe('whitespace normalization', () => {
    it('collapses multiple spaces into one and trims', () => {
      expect(sanitizeText('  hello    world  ')).toBe('hello world')
    })
  })

  describe('length truncation', () => {
    it('truncates to the default max length of 500', () => {
      const long = 'a'.repeat(600)
      const result = sanitizeText(long)
      expect(result).toHaveLength(500)
    })

    it('truncates to a custom max length', () => {
      const result = sanitizeText('abcdefghij', 5)
      expect(result).toBe('abcde')
    })

    it('does not truncate text shorter than the max length', () => {
      expect(sanitizeText('short', 500)).toBe('short')
    })
  })

  describe('unicode/emoji passthrough', () => {
    it('preserves unicode characters and emoji', () => {
      expect(sanitizeText('Café résumé 日本語 🎉')).toBe('Café résumé 日本語 🎉')
    })
  })
})

describe('sanitizeName', () => {
  describe('null/undefined/empty', () => {
    it('returns empty string for null, undefined, and empty string', () => {
      expect(sanitizeName(null)).toBe('')
      expect(sanitizeName(undefined)).toBe('')
      expect(sanitizeName('')).toBe('')
    })
  })

  it('strips HTML tags', () => {
    expect(sanitizeName('<b>John</b>')).toBe('John')
  })

  it('allows only letters, numbers, spaces, hyphens, apostrophes, periods', () => {
    expect(sanitizeName("O'Brien-Smith Jr.")).toBe("O'Brien-Smith Jr.")
    expect(sanitizeName('John_Doe #1 <script>')).toBe('JohnDoe 1')
  })

  it('strips unicode/emoji (not in the allowed charset)', () => {
    expect(sanitizeName('José 🎉')).toBe('Jos')
  })

  it('collapses whitespace and trims', () => {
    expect(sanitizeName('  John   Doe  ')).toBe('John Doe')
  })

  it('truncates to the documented cap of 100', () => {
    const long = 'a'.repeat(150)
    expect(sanitizeName(long)).toHaveLength(100)
  })
})

describe('sanitizeCompanyName', () => {
  describe('null/undefined/empty', () => {
    it('returns empty string for null, undefined, and empty string', () => {
      expect(sanitizeCompanyName(null)).toBe('')
      expect(sanitizeCompanyName(undefined)).toBe('')
      expect(sanitizeCompanyName('')).toBe('')
    })
  })

  it('strips HTML tags', () => {
    expect(sanitizeCompanyName('<b>Acme</b> Corp')).toBe('Acme Corp')
  })

  it('allows business punctuation: hyphen, apostrophe, period, ampersand, comma, parens', () => {
    expect(sanitizeCompanyName("Smith & Sons, Inc. (Est. 1990) - O'Brien")).toBe(
      "Smith & Sons, Inc. (Est. 1990) - O'Brien"
    )
  })

  it('strips disallowed characters like # and _', () => {
    expect(sanitizeCompanyName('Acme_Corp #1')).toBe('AcmeCorp 1')
  })

  it('truncates to the documented cap of 200', () => {
    const long = 'a'.repeat(250)
    expect(sanitizeCompanyName(long)).toHaveLength(200)
  })
})

describe('sanitizeEmail', () => {
  describe('null/undefined/empty', () => {
    it('returns empty string for null, undefined, and empty string', () => {
      expect(sanitizeEmail(null)).toBe('')
      expect(sanitizeEmail(undefined)).toBe('')
      expect(sanitizeEmail('')).toBe('')
    })
  })

  describe('valid emails', () => {
    it('accepts and lowercases a valid email', () => {
      expect(sanitizeEmail('User@Example.com')).toBe('user@example.com')
    })

    it('trims surrounding whitespace', () => {
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com')
    })
  })

  describe('invalid emails', () => {
    it('rejects a string with no @', () => {
      expect(sanitizeEmail('not-an-email')).toBe('')
    })

    it('rejects a string with no domain dot', () => {
      expect(sanitizeEmail('user@localhost')).toBe('')
    })

    it('rejects a string with internal whitespace', () => {
      expect(sanitizeEmail('user name@example.com')).toBe('')
    })

    it('rejects a string with multiple @ signs', () => {
      expect(sanitizeEmail('user@@example.com')).toBe('')
    })
  })

  it('truncates before validation to the documented cap of 254', () => {
    const localPart = 'a'.repeat(300)
    const result = sanitizeEmail(`${localPart}@example.com`)
    // Truncated string no longer matches the valid-email pattern -> rejected
    expect(result).toBe('')
  })
})
