import type {
  DraftSequences,
  QualityCheckResult,
  QualityIssue,
} from '@/types/onboarding'

// ---------------------------------------------------------------------------
// Spam trigger words
// ---------------------------------------------------------------------------

const SPAM_WORDS = [
  'free',
  'guarantee',
  'act now',
  'limited time',
  'click here',
  'buy now',
  'discount',
  'congratulations',
  'winner',
  'urgent',
  'expire',
  'offer ends',
  'risk-free',
  'no obligation',
  'special promotion',
] as const

// ---------------------------------------------------------------------------
// Weak opening phrases
// ---------------------------------------------------------------------------

const WEAK_OPENINGS = [
  'i wanted to reach out',
  'i hope this',
  'i came across',
  'i noticed that',
  'just following up',
  'checking in',
  'touching base',
  'i wanted to connect',
  'my name is',
] as const

// ---------------------------------------------------------------------------
// CTA-like phrases
// ---------------------------------------------------------------------------

const CTA_PHRASES = [
  'book a call',
  'schedule a',
  'reply to this',
  'click here',
  'check out',
  'visit our',
  'sign up',
  'learn more',
  'see how',
  'let me know',
  'interested?',
  'worth a chat',
  'open to',
] as const

// ---------------------------------------------------------------------------
// Allowed all-caps acronyms
// ---------------------------------------------------------------------------

const ALLOWED_ACRONYMS = new Set([
  'CEO',
  'CTO',
  'CMO',
  'VP',
  'SDR',
  'BDR',
  'SAAS',
  'ROI',
  'KPI',
  'CRM',
  'API',
  'B2B',
  'B2C',
  'AI',
  'SEO',
  'PPC',
  'CAC',
  'LTV',
  'ARR',
  'MRR',
  'SQL',
  'MQL',
  'USA',
  'UK',
  'CPA',
  'CPL',
  'ROAS',
])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strips merge tags like `{{firstName}}` from text.
 */
export function stripMergeTags(text: string): string {
  return text.replace(/\{\{[^}]*\}\}/g, '')
}

/**
 * Counts words in text after removing merge tags.
 */
export function countWords(text: string): number {
  const stripped = stripMergeTags(text).trim()
  if (stripped.length === 0) return 0
  return stripped.split(/\s+/).length
}

/**
 * Expands all spintax blocks `{opt1|opt2|opt3}` in the given text and returns
 * every possible combination.
 *
 * Uses single-brace matching (`{...}`) while avoiding double-brace merge tags
 * (`{{...}}`).
 */
export function expandSpintax(text: string): string[] {
  const pattern = /\{([^{}]+)\}/
  const match = pattern.exec(text)

  if (!match) {
    return [text]
  }

  const options = match[1].split('|')
  const results: string[] = []

  for (const option of options) {
    const expanded = text.slice(0, match.index) + option + text.slice(match.index + match[0].length)
    const nested = expandSpintax(expanded)
    results.push(...nested)
  }

  return results
}

// ---------------------------------------------------------------------------
// Per-email checks
// ---------------------------------------------------------------------------

function checkWordCount(
  body: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const variants = expandSpintax(body)
  const issues: QualityIssue[] = []

  for (const variant of variants) {
    const wc = countWords(variant)
    if (wc > 100) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'word_count',
        detail: `Email body has ${wc} words in a spintax variant (max 100).`,
      })
      break
    }
  }

  return issues
}

function checkSubjectLength(
  subjectLine: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const variants = expandSpintax(subjectLine)
  const issues: QualityIssue[] = []

  for (const variant of variants) {
    const wc = countWords(variant)
    if (wc > 6) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'subject_length',
        detail: `Subject line has ${wc} words in a spintax variant (max 6).`,
      })
      break
    }
  }

  return issues
}

function checkSpamWords(
  body: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const lower = body.toLowerCase()
  const issues: QualityIssue[] = []

  for (const word of SPAM_WORDS) {
    if (lower.includes(word)) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'spam_word',
        detail: `Body contains spam trigger word: "${word}".`,
      })
    }
  }

  return issues
}

function checkStartsWithI(
  body: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const trimmed = body.trimStart()
  const firstWord = trimmed.split(/\s/)[0] ?? ''

  if (firstWord === 'I' || firstWord === "I'm" || firstWord === "I've") {
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'warning',
        check: 'starts_with_i',
        detail: `Body starts with "${firstWord}" — consider a more prospect-focused opening.`,
      },
    ]
  }

  return []
}

function checkWeakOpening(
  body: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const lower = body.toLowerCase()
  const issues: QualityIssue[] = []

  for (const phrase of WEAK_OPENINGS) {
    if (lower.includes(phrase)) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'weak_opening',
        detail: `Body contains weak opening phrase: "${phrase}".`,
      })
    }
  }

  return issues
}

function checkMultipleCTAs(
  body: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const lower = body.toLowerCase()
  let ctaCount = 0

  for (const phrase of CTA_PHRASES) {
    if (lower.includes(phrase)) {
      ctaCount++
    }
  }

  if (ctaCount > 2) {
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'warning',
        check: 'multiple_ctas',
        detail: `Body contains ${ctaCount} CTA-like phrases (recommended max 2).`,
      },
    ]
  }

  return []
}

function checkMultipleLinks(
  body: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const linkMatches = body.match(/https?:\/\//g)
  const linkCount = linkMatches?.length ?? 0
  const issues: QualityIssue[] = []

  if (linkCount > 1) {
    issues.push({
      sequence_index: seqIdx,
      email_index: emailIdx,
      severity: 'warning',
      check: 'multiple_links',
      detail: `Body contains ${linkCount} links (recommended max 1).`,
    })
  }

  if (emailIdx === 0 && linkCount > 0) {
    issues.push({
      sequence_index: seqIdx,
      email_index: emailIdx,
      severity: 'warning',
      check: 'multiple_links',
      detail: `First email in sequence contains a link — avoid links in the opening email for deliverability.`,
    })
  }

  return issues
}

function checkInsufficientSpintax(
  body: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const spintaxBlocks = body.match(/\{([^{}]+\|[^{}]+)\}/g)
  const blockCount = spintaxBlocks?.length ?? 0

  if (blockCount < 2) {
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'warning',
        check: 'insufficient_spintax',
        detail: `Body has ${blockCount} spintax block(s) (recommended at least 2).`,
      },
    ]
  }

  return []
}

function checkNoSubjectSpintax(
  subjectLine: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const hasSpintax = /\{([^{}]+\|[^{}]+)\}/.test(subjectLine)

  if (!hasSpintax) {
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'warning',
        check: 'no_subject_spintax',
        detail: 'Subject line has no spintax — add variants for A/B testing.',
      },
    ]
  }

  return []
}

function checkSubjectExclamation(
  subjectLine: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  if (subjectLine.includes('!')) {
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'subject_exclamation',
        detail: 'Subject line contains an exclamation mark — remove it for deliverability.',
      },
    ]
  }

  return []
}

function checkExcessiveExclamations(
  body: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const exclamationCount = (body.match(/!/g) ?? []).length

  if (exclamationCount > 1) {
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'warning',
        check: 'excessive_exclamations',
        detail: `Body contains ${exclamationCount} exclamation marks (recommended max 1).`,
      },
    ]
  }

  return []
}

function checkAllCaps(
  body: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const allCapsWords = body.match(/\b[A-Z]{2,}\b/g) ?? []
  const disallowed = allCapsWords.filter((w) => !ALLOWED_ACRONYMS.has(w))

  if (disallowed.length > 0) {
    const unique = [...new Set(disallowed)]
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'warning',
        check: 'all_caps',
        detail: `Body contains all-caps word(s): ${unique.join(', ')}. Consider using normal casing.`,
      },
    ]
  }

  return []
}

// ---------------------------------------------------------------------------
// Per-sequence checks
// ---------------------------------------------------------------------------

function checkDuplicateOpenings(
  emails: ReadonlyArray<{ body: string }>,
  seqIdx: number,
): QualityIssue[] {
  const openings = emails.map((email) => {
    const firstLine = email.body.trimStart().split('\n')[0] ?? ''
    return firstLine.toLowerCase().slice(0, 30)
  })

  const seen = new Map<string, number>()
  const duplicateIndices: number[] = []

  for (let i = 0; i < openings.length; i++) {
    const opening = openings[i]
    const prev = seen.get(opening)
    if (prev !== undefined) {
      duplicateIndices.push(i)
      if (!duplicateIndices.includes(prev)) {
        duplicateIndices.push(prev)
      }
    } else {
      seen.set(opening, i)
    }
  }

  if (duplicateIndices.length > 0) {
    return [
      {
        sequence_index: seqIdx,
        email_index: -1,
        severity: 'warning',
        check: 'duplicate_openings',
        detail: `Emails ${duplicateIndices.sort((a, b) => a - b).map((i) => i + 1).join(', ')} share similar opening lines — vary them for engagement.`,
      },
    ]
  }

  return []
}

// ---------------------------------------------------------------------------
// Main quality check
// ---------------------------------------------------------------------------

/**
 * Runs all quality checks on the provided email sequences and returns the
 * overall result with a list of issues found.
 */
export function checkCopyQuality(sequences: DraftSequences): QualityCheckResult {
  const issues: QualityIssue[] = []

  for (let seqIdx = 0; seqIdx < sequences.sequences.length; seqIdx++) {
    const sequence = sequences.sequences[seqIdx]

    for (let emailIdx = 0; emailIdx < sequence.emails.length; emailIdx++) {
      const email = sequence.emails[emailIdx]
      const { subject_line, body } = email

      issues.push(
        ...checkWordCount(body, seqIdx, emailIdx),
        ...checkSubjectLength(subject_line, seqIdx, emailIdx),
        ...checkSpamWords(body, seqIdx, emailIdx),
        ...checkStartsWithI(body, seqIdx, emailIdx),
        ...checkWeakOpening(body, seqIdx, emailIdx),
        ...checkMultipleCTAs(body, seqIdx, emailIdx),
        ...checkMultipleLinks(body, seqIdx, emailIdx),
        ...checkInsufficientSpintax(body, seqIdx, emailIdx),
        ...checkNoSubjectSpintax(subject_line, seqIdx, emailIdx),
        ...checkSubjectExclamation(subject_line, seqIdx, emailIdx),
        ...checkExcessiveExclamations(body, seqIdx, emailIdx),
        ...checkAllCaps(body, seqIdx, emailIdx),
      )
    }

    issues.push(...checkDuplicateOpenings(sequence.emails, seqIdx))
  }

  const passed = issues.every((issue) => issue.severity !== 'error')

  return { passed, issues }
}
