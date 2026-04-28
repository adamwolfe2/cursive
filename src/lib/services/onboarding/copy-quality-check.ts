import type {
  DraftSequences,
  QualityCheckResult,
  QualityIssue,
} from '@/types/onboarding'
import { scoreCopy, CORPORATE_KILL_SIGNALS, LLM_ISM_RED_FLAGS } from '../autoresearch/cold-email-knowledge'

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
 * Single-brace matching, with carve-outs so:
 *  - Double-brace merge tags `{{firstName}}` (no pipe) are left alone.
 *  - Merge tags NESTED INSIDE spintax options (e.g. `{A|B {{companyName}} C}`)
 *    are matched correctly and preserved through to the output. The legacy
 *    `[^{}]+` pattern silently rejected these blocks, which then leaked raw
 *    braces into the inbox via EmailBison.
 */
export function expandSpintax(text: string): string[] {
  // Match a spintax block whose contents may include literal merge tags.
  const pattern = /\{((?:[^{}]|\{\{\w+\}\})+)\}/
  const match = pattern.exec(text)

  if (!match) {
    return [text]
  }

  // If there is no pipe, this is not actually a spintax block, leave it alone
  // and skip past it so we don't infinite-loop.
  if (!match[1].includes('|')) {
    const before = text.slice(0, match.index + match[0].length)
    const after = text.slice(match.index + match[0].length)
    const tail = expandSpintax(after)
    return tail.map((t) => before + t)
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
// Masterclass checks (cold-email-knowledge.ts integration)
// ---------------------------------------------------------------------------

function checkCorporateKillSignals(
  body: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const lower = body.toLowerCase()
  const issues: QualityIssue[] = []

  for (const signal of CORPORATE_KILL_SIGNALS) {
    if (lower.includes(signal.toLowerCase())) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'corporate_kill_signal',
        detail: `Body contains corporate kill signal: "${signal}".`,
      })
    }
  }

  return issues
}

function checkLlmIsms(
  body: string,
  subjectLine: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const fullText = `${subjectLine} ${body}`.toLowerCase()
  const issues: QualityIssue[] = []

  for (const flag of LLM_ISM_RED_FLAGS) {
    if (fullText.includes(flag.toLowerCase())) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'llm_ism',
        detail: `Copy contains LLM-ism red flag: "${flag}".`,
      })
    }
  }

  return issues
}

function checkPsychologicalPrinciples(
  body: string,
  subjectLine: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  const result = scoreCopy({
    subject: subjectLine,
    body,
    hasSocialProof: /\d+\s*(clients?|companies|businesses)/i.test(body),
    hasSpecificNumbers: /\$[\d,]+|\d+%|\d+x/i.test(body),
    hasOffer: /free|no cost|no charge|guarantee|at no/i.test(body),
    hasCta: /\?|reply|call|chat|ring|send/i.test(body),
    hasPersonalization: /\{\{firstName\}\}|\{\{companyName\}\}/i.test(body),
  })

  if (!result.passesMinimum) {
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'warning',
        check: 'psychological_principles',
        detail: `Email scores ${result.score}/7 on psychological principles (minimum 4). Present: ${result.principlesPresent.join(', ') || 'none'}.`,
      },
    ]
  }

  return []
}

function checkSubjectLowercase(
  subjectLine: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  // Expand spintax to check each variant
  const variants = expandSpintax(subjectLine)
  const issues: QualityIssue[] = []

  for (const variant of variants) {
    // Strip merge tags before checking case
    const stripped = stripMergeTags(variant)
    // Allow uppercase acronyms but flag other uppercase letters
    const withoutAcronyms = stripped.replace(/\b[A-Z]{2,}\b/g, '')
    if (withoutAcronyms !== withoutAcronyms.toLowerCase()) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'warning',
        check: 'subject_not_lowercase',
        detail: `Subject line variant "${variant}" is not lowercase — lowercase signals casual and personal.`,
      })
      break
    }
  }

  return issues
}

function checkEmDashes(
  body: string,
  subjectLine: string,
  previewText: string | undefined,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  // Em-dashes (—) and en-dashes (–) are forbidden. They are a known AI tell
  // and tank reply rates. The post-generation sanitizer in copy-generation.ts
  // strips them, but this check catches anything that slipped through (or
  // was added manually) before the copy ships.
  const haystack = `${subjectLine}\n${previewText ?? ''}\n${body}`
  if (/[—–]/.test(haystack)) {
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'em_dash',
        detail: 'Email contains an em-dash (—) or en-dash (–). Replace with a comma, period, or rephrasing. Em-dashes are an AI-generation tell.',
      },
    ]
  }
  return []
}

function checkDoubleBraceSpintax(
  body: string,
  subjectLine: string,
  previewText: string | undefined,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  // Catches {{a|b|c}} spintax-with-double-braces, which the renderer treats
  // as a merge tag and won't expand, so it leaks raw braces into the inbox.
  // Single-brace {a|b|c} is correct spintax. Double-brace {{firstName}} (no
  // pipe) is a real merge tag and is fine.
  const haystack = `${subjectLine}\n${previewText ?? ''}\n${body}`
  const match = /\{\{[^{}]*\|[^{}]*\}\}/.exec(haystack)
  if (match) {
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'double_brace_spintax',
        detail: `Found spintax with double braces "${match[0]}". Use single braces {a|b|c} so the renderer expands variants. Double braces are reserved for merge tags like {{firstName}}.`,
      },
    ]
  }
  return []
}

function checkPhantomCallback(
  body: string,
  emails: ReadonlyArray<{ body: string; subject_line: string }>,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  // Email 1 cannot have a phantom callback (no prior email exists).
  // Emails 2+ may reference prior content only if it actually appears in an
  // earlier email of THIS sequence. Email 4 (breakup) is allowed to say
  // "haven't heard back" / "no response" because that is honest.
  if (emailIdx === 0) {
    // Email 1 should never reference a "prior conversation". Flag if it does.
    // Constrain matches to leading position (start of body or start of a
    // paragraph) so legitimate prose like "noticed that conversation in
    // your blog" does not false-positive and trigger an auto-fix loop.
    const phantomPatterns = [
      /(^|\n)\s*as we discussed\b/i,
      /(^|\n)\s*as you mentioned\b/i,
      /(^|\n)\s*following up on (our|the|that|your)\b/i,
      /(^|\n)\s*circling back\b/i,
      /(^|\n)\s*your (response|reply) to\b/i,
      /(^|\n)\s*from our last (call|conversation|chat|note|email)\b/i,
    ]
    for (const pat of phantomPatterns) {
      const m = pat.exec(body)
      if (m) {
        return [
          {
            sequence_index: seqIdx,
            email_index: emailIdx,
            severity: 'error',
            check: 'phantom_callback',
            detail: `Email 1 references a prior conversation that does not exist (matched "${m[0].trim()}"). Email 1 is the first contact. Open cold.`,
          },
        ]
      }
    }
    return []
  }

  // Email 4 (breakup, idx 3) is allowed to acknowledge no response.
  if (emailIdx >= 3) return []

  // For emails 2 and 3: search for callback patterns that reference content
  // not present in earlier emails.
  const calloutPattern = /(that\s+(\w+(?:\s+\w+)?)\s+(?:comment|comment\.|comment,|conversation|note|point|line))|((?:following up|circling back) on (?:the|that|our)\s+(\w+(?:\s+\w+)?))/i
  const match = calloutPattern.exec(body)
  if (!match) return []

  // The thing being referenced (e.g. "creative waste" from "that creative waste comment")
  const referenced = (match[2] || match[4] || '').trim().toLowerCase()
  if (!referenced || referenced.length < 3) return []

  const earlier = emails
    .slice(0, emailIdx)
    .map((e) => `${e.subject_line} ${e.body}`)
    .join(' ')
    .toLowerCase()

  if (!earlier.includes(referenced)) {
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'phantom_callback',
        detail: `Email ${emailIdx + 1} references "${referenced}" as if it appeared in an earlier email, but it does not. Either remove the callback or add the topic to email ${emailIdx} first.`,
      },
    ]
  }
  return []
}

function checkBodyStartsWithI(
  body: string,
  seqIdx: number,
  emailIdx: number,
): QualityIssue[] {
  // Strip merge tags, then check if the very first word is "I"
  const stripped = stripMergeTags(body).trimStart()
  const firstWord = stripped.split(/[\s,]/)[0] ?? ''

  if (firstWord === 'I' || firstWord === "I'm" || firstWord === "I've" || firstWord === "I'd" || firstWord === "I'll") {
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'body_starts_with_i',
        detail: `Email starts with "${firstWord}" as the first word — never start with "I". Lead with the prospect.`,
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
      const { subject_line, body, preview_text } = email

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
        // Hard rules
        ...checkEmDashes(body, subject_line, preview_text, seqIdx, emailIdx),
        ...checkDoubleBraceSpintax(body, subject_line, preview_text, seqIdx, emailIdx),
        ...checkPhantomCallback(body, sequence.emails, seqIdx, emailIdx),
        // Masterclass checks
        ...checkCorporateKillSignals(body, seqIdx, emailIdx),
        ...checkLlmIsms(body, subject_line, seqIdx, emailIdx),
        ...checkPsychologicalPrinciples(body, subject_line, seqIdx, emailIdx),
        ...checkSubjectLowercase(subject_line, seqIdx, emailIdx),
        ...checkBodyStartsWithI(body, seqIdx, emailIdx),
      )
    }

    issues.push(...checkDuplicateOpenings(sequence.emails, seqIdx))
  }

  const passed = issues.every((issue) => issue.severity !== 'error')

  return { passed, issues }
}
