/**
 * Unit tests for CSV injection sanitization utilities
 * https://owasp.org/www-community/attacks/CSV_Injection
 */

import { describe, it, expect, test } from 'vitest'
import {
  sanitizeCsvValue,
  sanitizeCsvRow,
  sanitizeCsvData,
  sanitizeCsvObject,
  isPotentialCsvInjection,
  findCsvInjectionIndices,
} from '@/lib/utils/csv-sanitizer'

describe('sanitizeCsvValue', () => {
  describe('dangerous prefixes get neutralized', () => {
    it('prefixes formula injection with a single quote', () => {
      expect(sanitizeCsvValue('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
      expect(sanitizeCsvValue('=cmd|"/c calc"!A1')).toBe('\'=cmd|"/c calc"!A1')
    })

    it('prefixes +, -, @ leading characters', () => {
      expect(sanitizeCsvValue('+1234567890')).toBe("'+1234567890")
      expect(sanitizeCsvValue('-1234567890')).toBe("'-1234567890")
      expect(sanitizeCsvValue('@SUM(1+1)')).toBe("'@SUM(1+1)")
    })

    it('a leading tab/CR is stripped by .trim() before the check, so the resulting quote-prefix reflects the NEXT char, not the tab/CR', () => {
      // BUG: DANGEROUS_PREFIXES includes '\t' and '\r', but the code calls
      // `String(value).trim()` before testing startsWith(), and .trim()
      // strips leading tabs/CRs. So '\t=SUM(A1)' becomes '=SUM(A1)' before
      // the dangerous-prefix check ever runs -- it still gets quoted here,
      // but only because '=' is also dangerous, not because of the tab.
      expect(sanitizeCsvValue('\t=SUM(A1)')).toBe("'=SUM(A1)")
      expect(sanitizeCsvValue('\r=SUM(A1)')).toBe("'=SUM(A1)")
    })

    // Resolved: '\t' and '\r' were removed from DANGEROUS_PREFIXES. They could
    // never match (trim() runs first) and did not need to — trim also strips
    // them from the RETURNED value, so the exported cell carries no leading
    // tab/CR to exploit. Quoting here would be noise, not safety.
    it('strips a lone leading tab/CR rather than quoting it — nothing to neutralize', () => {
      expect(sanitizeCsvValue('\tvalue')).toBe('value')
      expect(sanitizeCsvValue('\rvalue')).toBe('value')
    })
  })

  describe('safe values pass through untouched', () => {
    it('leaves normal text unchanged', () => {
      expect(sanitizeCsvValue('John Doe')).toBe('John Doe')
      expect(sanitizeCsvValue('Acme Corp')).toBe('Acme Corp')
    })

    it('leaves values with dangerous chars NOT in leading position unchanged', () => {
      expect(sanitizeCsvValue('total=5')).toBe('total=5')
      expect(sanitizeCsvValue('email@example.com')).toBe('email@example.com')
    })

    it('trims surrounding whitespace before checking', () => {
      expect(sanitizeCsvValue('  John Doe  ')).toBe('John Doe')
    })
  })

  describe('legitimate negative numbers (interesting edge case)', () => {
    // OWASP's own guidance treats a leading "-" as dangerous because
    // "-2+3+cmd|..." is a valid Excel formula. The code does NOT special-case
    // plain negative numbers, so they get quote-prefixed same as any other
    // leading "-" value. Documenting actual behavior, not a bug.
    it('quote-prefixes a plain negative number string', () => {
      expect(sanitizeCsvValue('-42')).toBe("'-42")
      expect(sanitizeCsvValue('-3.14')).toBe("'-3.14")
    })
  })

  describe('null/undefined/empty', () => {
    it('returns empty string for null', () => {
      expect(sanitizeCsvValue(null)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(sanitizeCsvValue(undefined)).toBe('')
    })

    it('returns empty string for empty string', () => {
      expect(sanitizeCsvValue('')).toBe('')
    })

    it('returns empty string for whitespace-only string', () => {
      expect(sanitizeCsvValue('   ')).toBe('')
    })
  })
})

describe('sanitizeCsvRow', () => {
  it('sanitizes every cell in a row', () => {
    expect(sanitizeCsvRow(['=SUM(1)', 'safe', null, undefined, '+123'])).toEqual([
      "'=SUM(1)",
      'safe',
      '',
      '',
      "'+123",
    ])
  })

  it('handles an empty row', () => {
    expect(sanitizeCsvRow([])).toEqual([])
  })
})

describe('sanitizeCsvData', () => {
  it('sanitizes every row in a 2D array', () => {
    const rows = [
      ['=1+1', 'name'],
      ['safe', '@evil'],
    ]
    expect(sanitizeCsvData(rows)).toEqual([
      ["'=1+1", 'name'],
      ['safe', "'@evil"],
    ])
  })

  it('handles an empty dataset', () => {
    expect(sanitizeCsvData([])).toEqual([])
  })
})

describe('isPotentialCsvInjection', () => {
  it('flags values starting with dangerous prefixes', () => {
    expect(isPotentialCsvInjection('=SUM(A1)')).toBe(true)
    expect(isPotentialCsvInjection('+123')).toBe(true)
    expect(isPotentialCsvInjection('-123')).toBe(true)
    expect(isPotentialCsvInjection('@macro')).toBe(true)
  })

  // See the note in sanitizeCsvValue: trim() removes a leading tab/CR from the
  // exported value, so there is no injection to flag.
  it('does not flag a lone tab/CR-prefixed value', () => {
    expect(isPotentialCsvInjection('\tvalue')).toBe(false)
    expect(isPotentialCsvInjection('\rvalue')).toBe(false)
  })

  it('still flags a tab-prefixed formula, via the formula char', () => {
    expect(isPotentialCsvInjection('\t=SUM(A1)')).toBe(true)
    expect(isPotentialCsvInjection('\r+1+1')).toBe(true)
  })

  it('does not flag safe values', () => {
    expect(isPotentialCsvInjection('normal value')).toBe(false)
    expect(isPotentialCsvInjection('a=b')).toBe(false)
  })

  it('returns false for null/undefined/empty', () => {
    expect(isPotentialCsvInjection(null)).toBe(false)
    expect(isPotentialCsvInjection(undefined)).toBe(false)
    expect(isPotentialCsvInjection('')).toBe(false)
    expect(isPotentialCsvInjection('   ')).toBe(false)
  })
})

describe('findCsvInjectionIndices', () => {
  it('returns indices of suspicious cells only', () => {
    const row = ['safe', '=SUM(1)', 'also safe', '+666', null]
    expect(findCsvInjectionIndices(row)).toEqual([1, 3])
  })

  it('returns an empty array when nothing is suspicious', () => {
    expect(findCsvInjectionIndices(['a', 'b', 'c'])).toEqual([])
  })

  it('returns an empty array for an empty row', () => {
    expect(findCsvInjectionIndices([])).toEqual([])
  })
})

describe('sanitizeCsvObject', () => {
  it('sanitizes string fields only, leaving other types untouched', () => {
    const obj = {
      name: '=SUM(1)',
      age: 30,
      active: true,
      notes: 'fine',
      tags: null as any,
    }
    expect(sanitizeCsvObject(obj)).toEqual({
      name: "'=SUM(1)",
      age: 30,
      active: true,
      notes: 'fine',
      tags: null,
    })
  })

  it('handles an empty object', () => {
    expect(sanitizeCsvObject({})).toEqual({})
  })

  it('does not mutate the original object', () => {
    const obj = { name: '=SUM(1)' }
    const result = sanitizeCsvObject(obj)
    expect(obj.name).toBe('=SUM(1)')
    expect(result.name).toBe("'=SUM(1)")
    expect(result).not.toBe(obj)
  })
})
