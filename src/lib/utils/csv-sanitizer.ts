// CSV Injection Prevention
// Sanitizes CSV values to prevent formula injection attacks
// https://owasp.org/www-community/attacks/CSV_Injection

/**
 * Characters that can trigger formula execution in Excel/Google Sheets
 * = (formula), + (addition), - (subtraction/negation), @ (macro), \t (tab), \r (carriage return)
 */
const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r'] as const

/**
 * Sanitize a single CSV value to prevent injection attacks
 *
 * How it works:
 * - If value starts with =, +, -, @, tab, or carriage return, prefix with single quote
 * - This forces spreadsheet apps to treat it as text, not a formula
 *
 * Examples:
 * - "=SUM(A1:A10)" becomes "'=SUM(A1:A10)" (safe text)
 * - "+1234567890" becomes "'+1234567890" (safe text, not addition)
 * - "normal value" stays "normal value" (no change needed)
 *
 * @param value - The CSV cell value to sanitize
 * @returns Sanitized value safe for CSV export
 */
export function sanitizeCsvValue(value: string | null | undefined): string {
  // Handle null/undefined
  if (value == null) {
    return ''
  }

  // Convert to string
  const stringValue = String(value).trim()

  // Empty strings are safe
  if (stringValue.length === 0) {
    return ''
  }

  // Check if value starts with a dangerous character
  const startsWithDangerous = DANGEROUS_PREFIXES.some(prefix =>
    stringValue.startsWith(prefix)
  )

  // Prefix with single quote to force text interpretation
  if (startsWithDangerous) {
    return `'${stringValue}`
  }

  return stringValue
}

/**
 * Sanitize an entire row of CSV values
 *
 * @param row - Array of cell values
 * @returns Array of sanitized values
 */
export function sanitizeCsvRow(row: (string | null | undefined)[]): string[] {
  return row.map(sanitizeCsvValue)
}

/**
 * Sanitize an array of CSV rows
 *
 * @param rows - 2D array of CSV data
 * @returns 2D array of sanitized data
 */
export function sanitizeCsvData(rows: (string | null | undefined)[][]): string[][] {
  return rows.map(sanitizeCsvRow)
}

/**
 * Check if a value contains potential CSV injection
 * Use this for validation/warnings without modifying the value
 *
 * @param value - Value to check
 * @returns true if value looks like CSV injection attempt
 */
export function isPotentialCsvInjection(value: string | null | undefined): boolean {
  if (value == null) return false

  const stringValue = String(value).trim()
  if (stringValue.length === 0) return false

  return DANGEROUS_PREFIXES.some(prefix => stringValue.startsWith(prefix))
}

/**
 * Validate CSV row for injection attempts
 * Returns indices of suspicious cells
 *
 * @param row - Array of cell values
 * @returns Array of indices where injection was detected
 */
export function findCsvInjectionIndices(row: (string | null | undefined)[]): number[] {
  const suspiciousIndices: number[] = []

  row.forEach((value, index) => {
    if (isPotentialCsvInjection(value)) {
      suspiciousIndices.push(index)
    }
  })

  return suspiciousIndices
}

/**
 * Sanitize an object's values for CSV export
 * Useful when converting objects to CSV rows
 *
 * @param obj - Object with string values
 * @returns Object with sanitized string values
 */
export function sanitizeCsvObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T

  for (const key in obj) {
    const value = obj[key]

    if (typeof value === 'string') {
      sanitized[key] = sanitizeCsvValue(value) as any
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}
