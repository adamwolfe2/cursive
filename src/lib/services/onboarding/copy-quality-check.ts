import type {
  CaseStudy,
  CtaType,
  DraftSequences,
  OnboardingClient,
  QualityCheckResult,
  QualityIssue,
} from '@/types/onboarding'
import {
  scoreCopy,
  CORPORATE_KILL_SIGNALS,
  HIGH_TRUST_BANNED_PHRASES,
  HIGH_TRUST_BANNED_PATTERNS,
  LLM_ISM_RED_FLAGS,
  inferAovTier,
} from '../autoresearch/cold-email-knowledge'

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
 * Strips merge tags from text. Handles BOTH formats:
 *   1. EB-native single-brace UPPER_SNAKE_CASE: `{FIRST_NAME}`, `{COMPANY}`
 *   2. Legacy double-brace camelCase: `{{firstName}}`, `{{companyName}}`
 * Used for word counting so tags don't inflate counts past the per-position
 * word caps. Single-brace spintax blocks (`{a|b|c}`) are NOT touched here —
 * those are handled by expandSpintax.
 */
export function stripMergeTags(text: string): string {
  return text.replace(/\{\{[^}]*\}\}/g, '').replace(/\{[A-Z][A-Z_]*\}/g, '')
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
 * Iterative implementation, never recurses. The previous recursive version
 * blew the stack ("Maximum call stack size exceeded") on certain real outputs
 * even though the worst-case recursion depth was small in theory; some
 * input shape (combined with V8's stack accounting) tripped the limit.
 *
 * Carve-outs:
 *  - Double-brace merge tags `{{firstName}}` (no pipe) are left alone.
 *  - Merge tags NESTED INSIDE spintax options (e.g. `{A|B {{companyName}} C}`)
 *    are matched correctly and preserved through to the output.
 *
 * Hard cap: MAX_VARIANTS protects against pathological inputs that would
 * produce billions of combinations and OOM the function.
 */
const MAX_VARIANTS = 256
const MAX_ITERATIONS = 50_000

// Find the next spintax-with-pipe block at or after `from`. Skips no-pipe
// blocks (which look like {{merge tags}} or {plain word}). Returns the
// absolute start/end indices and split options, or null if none remain.
function findNextSpintaxBlock(
  text: string,
  from: number
): { start: number; end: number; options: string[] } | null {
  // Pattern with global flag so we can iterate via lastIndex.
  const re = /\{((?:[^{}]|\{\{\w+\}\})+)\}/g
  re.lastIndex = from
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m[1].includes('|')) {
      return {
        start: m.index,
        end: m.index + m[0].length,
        options: m[1].split('|'),
      }
    }
    // No pipe: advance by 1 char minimum if the engine didn't (it does for
    // non-zero-width matches, but be defensive).
    if (re.lastIndex === m.index) re.lastIndex = m.index + 1
  }
  return null
}

export function expandSpintax(text: string): string[] {
  // Worklist of strings still being expanded. Iterative, never recurses.
  // Hard caps protect against pathological inputs producing billions of
  // combinations (which would OOM or stack-overflow the recursive version).
  const queue: string[] = [text]
  const results: string[] = []
  let iterations = 0

  while (queue.length > 0) {
    if (++iterations > MAX_ITERATIONS) break
    const current = queue.shift() as string

    const found = findNextSpintaxBlock(current, 0)
    if (!found) {
      results.push(current)
      if (results.length >= MAX_VARIANTS) break
      continue
    }

    const before = current.slice(0, found.start)
    const after = current.slice(found.end)
    for (const option of found.options) {
      queue.push(before + option + after)
      if (queue.length + results.length > MAX_VARIANTS * 4) break
    }
  }

  return results.length > 0 ? results : [text]
}

// ---------------------------------------------------------------------------
// Per-email checks
// ---------------------------------------------------------------------------

/**
 * Per-position word caps:
 *   step 1 (the hook): 75 words max
 *   steps 2-3 (proof / shift): 60 words max
 *   step 4+ (breakup): 40 words max
 *
 * The cap is enforced against EVERY spintax-expanded variant — if any single
 * combination exceeds the cap, the email fails.
 */
function wordCapForStep(step: number): number {
  if (step <= 1) return 75
  if (step <= 3) return 60
  return 40
}

function checkWordCount(
  body: string,
  step: number,
  seqIdx: number,
  emailIdx: number
): QualityIssue[] {
  const variants = expandSpintax(body)
  const cap = wordCapForStep(step)
  const issues: QualityIssue[] = []

  for (const variant of variants) {
    const wc = countWords(variant)
    if (wc > cap) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'word_count',
        detail: `Email step ${step} body has ${wc} words in a variant (max ${cap} for this position).`,
      })
      break
    }
  }

  return issues
}

function checkSubjectLength(
  subjectLine: string,
  seqIdx: number,
  emailIdx: number
): QualityIssue[] {
  const variants = expandSpintax(subjectLine)
  const issues: QualityIssue[] = []

  for (const variant of variants) {
    const wc = countWords(variant)
    // Updated 2026-06: cap raised from 6 -> 7 to give the new Finn-style
    // subject doctrine ("anchor on a specific tool/role/process/observable")
    // enough room (e.g., "the meta ads situation at acmetech" is 6 words).
    if (wc > 7) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'subject_length',
        detail: `Subject line has ${wc} words in a spintax variant (max 7).`,
      })
      break
    }
  }

  return issues
}

function checkSpamWords(
  body: string,
  seqIdx: number,
  emailIdx: number
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
  emailIdx: number
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
  emailIdx: number
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
  emailIdx: number
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
  emailIdx: number
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
  emailIdx: number
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
  emailIdx: number
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
  emailIdx: number
): QualityIssue[] {
  if (subjectLine.includes('!')) {
    return [
      {
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'subject_exclamation',
        detail:
          'Subject line contains an exclamation mark — remove it for deliverability.',
      },
    ]
  }

  return []
}

function checkExcessiveExclamations(
  body: string,
  seqIdx: number,
  emailIdx: number
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
  emailIdx: number
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
  emailIdx: number
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
  emailIdx: number
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
  context: {
    highTrust?: boolean
    knownCaseStudyClients?: ReadonlyArray<string>
  } = {}
): QualityIssue[] {
  const result = scoreCopy({
    subject: subjectLine,
    body,
    // For volume doctrine, /\d+\s*(clients?|companies|businesses)/ counts as
    // social proof — the assumption is the number is real. For precision
    // doctrine (passed via context.highTrust), the scorer uses
    // knownCaseStudyClients to verify proof is real, not pattern-matched.
    hasSocialProof: /\d+\s*(clients?|companies|businesses)/i.test(body),
    hasSpecificNumbers: /\$[\d,]+|\d+%|\d+x/i.test(body),
    hasOffer: /free|no cost|no charge|guarantee|at no/i.test(body),
    hasCta: /\?|reply|call|chat|ring|send/i.test(body),
    // Accept either EB-native ({FIRST_NAME}, {COMPANY}, {TITLE}, {PROSPECT_SIGNAL})
    // or legacy double-brace ({{firstName}}, {{companyName}}) as evidence of
    // personalization. The LLM is now instructed to use EB-native; legacy is
    // kept for historical drafts that haven't been regenerated.
    hasPersonalization:
      /\{(FIRST_NAME|LAST_NAME|EMAIL|TITLE|COMPANY|PROSPECT_SIGNAL)\}/.test(
        body
      ) || /\{\{firstName\}\}|\{\{companyName\}\}/i.test(body),
    highTrust: context.highTrust,
    knownCaseStudyClients: context.knownCaseStudyClients,
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
  emailIdx: number
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
  emailIdx: number
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
        detail:
          'Email contains an em-dash (—) or en-dash (–). Replace with a comma, period, or rephrasing. Em-dashes are an AI-generation tell.',
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
  emailIdx: number
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
  emailIdx: number
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
  const calloutPattern =
    /(that\s+(\w+(?:\s+\w+)?)\s+(?:comment|comment\.|comment,|conversation|note|point|line))|((?:following up|circling back) on (?:the|that|our)\s+(\w+(?:\s+\w+)?))/i
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
  emailIdx: number
): QualityIssue[] {
  // Strip merge tags, then check if the very first word is "I"
  const stripped = stripMergeTags(body).trimStart()
  const firstWord = stripped.split(/[\s,]/)[0] ?? ''

  if (
    firstWord === 'I' ||
    firstWord === "I'm" ||
    firstWord === "I've" ||
    firstWord === "I'd" ||
    firstWord === "I'll"
  ) {
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
// High-trust banned phrases (V3 doctrine)
// ---------------------------------------------------------------------------
//
// HIGH_TRUST_BANNED_PHRASES are the second-wave clichés that signal templated
// outbound (founder-to-founder, false scarcity, "Here's why" sentence
// starters, etc.). They're banned for ALL clients now — they don't help
// anyone — but the doctrine is strictest for high-trust offers.

function checkHighTrustBannedPhrases(
  body: string,
  subjectLine: string,
  seqIdx: number,
  emailIdx: number
): QualityIssue[] {
  const haystack = `${subjectLine}\n${body}`.toLowerCase()
  const issues: QualityIssue[] = []
  const seenPhrases = new Set<string>()

  // Substring match (case-insensitive)
  for (const phrase of HIGH_TRUST_BANNED_PHRASES) {
    const lower = phrase.toLowerCase()
    if (haystack.includes(lower) && !seenPhrases.has(lower)) {
      seenPhrases.add(lower)
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'high_trust_banned_phrase',
        detail: `Copy contains banned phrase: "${phrase}". This signals templated outbound and burns trust.`,
      })
    }
  }

  // Pattern match (regex, sentence-start anchored)
  const fullText = `${subjectLine}\n${body}`
  for (const pat of HIGH_TRUST_BANNED_PATTERNS) {
    const m = pat.regex.exec(fullText)
    if (m) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'high_trust_banned_pattern',
        detail: `Copy matches banned pattern (${pat.name}): "${m[0].trim()}". Rephrase.`,
      })
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Fabricated claim detector (V3 doctrine — hardest rule)
// ---------------------------------------------------------------------------
//
// Catches social proof claims that are NOT backed by entries in the client's
// case_studies array. Fires on:
//   - Client-count claims: "X companies", "X clients", "X founders", "X
//     businesses" — unless X happens to appear in case_studies (very rare).
//   - "trusted by" / "leading X choose us" / "top-tier X" claims.
//   - Named clients NOT in case_studies (we look up names from the array
//     and compare against entities mentioned in the body).
//
// IMPORTANT: This check requires the client's case_studies to be passed in.
// If case_studies is undefined (older callers, regen flow with no client
// context), we skip the check rather than false-positive.

const CLIENT_COUNT_PATTERN =
  /(\d+|a few|several|many|dozens of|hundreds of)\s*(yc\s*)?(companies|clients|customers|founders|businesses|brands|agencies|startups|teams)\b/i

const TRUSTED_BY_PATTERN =
  /(trusted by|leading\s+[a-z\s]+\s+(?:brands|companies|founders|startups|agencies)\s+choose|top[-\s]?tier\s+[a-z\s]+\s+(?:brands|companies|partners))/i

const REVENUE_NUMBER_PATTERN =
  /\$[\d,.]+\s*(m(?:illion)?|b(?:illion)?|k|\/mo|\/month|\/year|\/yr|in\s+revenue|in\s+pipeline|generated|saved)/i

function checkFabricatedClaims(
  body: string,
  caseStudies: ReadonlyArray<CaseStudy> | undefined,
  seqIdx: number,
  emailIdx: number
): QualityIssue[] {
  // No case_studies context = skip (caller did not pass client). The check
  // would false-positive on legitimate situations where we lack ground truth.
  if (caseStudies === undefined) return []

  const issues: QualityIssue[] = []

  // Client-count claims: catch "we work with 12 founders" / "trusted by 50
  // companies" / "a few of the top 20 founders" patterns.
  const countMatch = CLIENT_COUNT_PATTERN.exec(body)
  if (countMatch) {
    issues.push({
      sequence_index: seqIdx,
      email_index: emailIdx,
      severity: 'error',
      check: 'fabricated_client_count',
      detail: `Body contains a client-count claim ("${countMatch[0]}") that is not supported by <case_studies>. Remove the count or replace with a generic in-group statement.`,
    })
  }

  // Trusted-by / leading-X language.
  const trustedMatch = TRUSTED_BY_PATTERN.exec(body)
  if (trustedMatch) {
    issues.push({
      sequence_index: seqIdx,
      email_index: emailIdx,
      severity: 'error',
      check: 'fabricated_trusted_by',
      detail: `Body contains an unverified trust claim ("${trustedMatch[0]}"). Replace with a specific case study reference (if available) or remove.`,
    })
  }

  // Revenue / quantified-result claims that are NOT in any case study.
  const revenueMatch = REVENUE_NUMBER_PATTERN.exec(body)
  if (revenueMatch) {
    const inCaseStudies = caseStudies.some((c) =>
      `${c.results} ${c.engagement}`
        .toLowerCase()
        .includes(revenueMatch[0].toLowerCase().trim())
    )
    if (!inCaseStudies) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'fabricated_quantified_result',
        detail: `Body contains a quantified financial claim ("${revenueMatch[0]}") not present in <case_studies>. Remove or replace with a real case study figure.`,
      })
    }
  }

  // Named clients not in case_studies. We look for "we worked with X" or
  // "X is one of our clients" patterns and compare X against case_studies.
  const namedClientPattern =
    /(?:we (?:worked|partnered) with|client(?:s)? include[ds]?|customer(?:s)? include[ds]?)\s+([A-Z][a-zA-Z0-9.&'-]+(?:\s+(?:[A-Z][a-zA-Z0-9.&'-]+|and|&)\s*[A-Z]?[a-zA-Z0-9.&'-]*)*)/g
  const namedClientsInBody: string[] = []
  let nm: RegExpExecArray | null
  while ((nm = namedClientPattern.exec(body)) !== null) {
    namedClientsInBody.push(nm[1].trim())
  }
  if (namedClientsInBody.length > 0) {
    const caseStudyNames = new Set(
      caseStudies
        .filter((c) => c.is_named)
        .map((c) => c.client_name.toLowerCase())
    )
    for (const cited of namedClientsInBody) {
      const inStudies = cited
        .split(/[,&]|\sand\s/i)
        .map((s) => s.trim().toLowerCase())
        .every((piece) => piece.length === 0 || caseStudyNames.has(piece))
      if (!inStudies) {
        issues.push({
          sequence_index: seqIdx,
          email_index: emailIdx,
          severity: 'error',
          check: 'fabricated_named_client',
          detail: `Body cites named client(s) ("${cited}") not present in <case_studies>. Remove or replace with a real case study reference.`,
        })
      }
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// CTA ladder violations (V3 doctrine)
// ---------------------------------------------------------------------------
//
// Enforces:
//   - Email 1 (step 1): no calendar link. The cta_type, if set, must be
//     "asset_offer" or "reply_only".
//   - Email 4 (step 4+): no CTA. The cta_type, if set, must be "breakup".
//   - Calendar link (URL containing "calendly.com", "cal.com", "savvycal",
//     "hubspot.com/meetings", "/booking", "/schedule") only allowed in
//     emails 2-3 (per ladder; email 3 is the canonical position).
//
// We detect calendar links by URL pattern AND by phrases that ASK for time
// ("Thursday at 2pm", "this week", "15 min") in email 1 — even without a
// link those phrasings violate the ladder.

// Matches calendar URLs both with and without protocol. Real cold emails
// often paste bare URLs ("calendly.com/me/intro") and Outlook auto-links
// them — we want to catch both forms.
const CALENDAR_URL_PATTERN =
  /(?:https?:\/\/)?(?:[a-z0-9-]+\.)*?(?:calendly\.com|cal\.com|savvycal\.com|hubspot\.com\/meetings|chilipiper\.com|book\.savvycal)\b/i

const TIME_OFFER_PATTERN_EMAIL_1 =
  /(?:available|free|works on my end|on my end|how about|are you free|got time)\s+(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|tomorrow|today|this week|early next week)/i

function checkCtaLadder(
  body: string,
  step: number,
  ctaType: CtaType | undefined,
  seqIdx: number,
  emailIdx: number
): QualityIssue[] {
  const issues: QualityIssue[] = []

  // Email 1: NO calendar link, NO time offer.
  if (step <= 1) {
    if (CALENDAR_URL_PATTERN.test(body)) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'cta_ladder_email_1_calendar',
        detail:
          'Email 1 contains a calendar link. The CTA ladder requires asset_offer or reply_only at this position. Move the calendar link to email 3.',
      })
    }
    if (TIME_OFFER_PATTERN_EMAIL_1.test(body)) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'cta_ladder_email_1_time_offer',
        detail:
          'Email 1 offers specific times ("Thursday at 2pm", "this week"). The CTA ladder reserves time-asks for email 3. Replace with an asset offer or reply ask.',
      })
    }
    if (ctaType && ctaType !== 'asset_offer' && ctaType !== 'reply_only') {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'cta_ladder_email_1_type',
        detail: `Email 1 cta_type is "${ctaType}". Must be "asset_offer" (high-trust) or "reply_only" (volume).`,
      })
    }
  }

  // Email 4: NO CTA at all. Calendar links forbidden.
  if (step >= 4) {
    if (CALENDAR_URL_PATTERN.test(body)) {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'cta_ladder_email_4_calendar',
        detail:
          'Email 4 (breakup) contains a calendar link. Breakup emails should have NO CTA — door open, no ask.',
      })
    }
    if (ctaType && ctaType !== 'breakup') {
      issues.push({
        sequence_index: seqIdx,
        email_index: emailIdx,
        severity: 'error',
        check: 'cta_ladder_email_4_type',
        detail: `Email 4 cta_type is "${ctaType}". Breakup emails must use "breakup" with no CTA.`,
      })
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Per-sequence checks
// ---------------------------------------------------------------------------

function checkDuplicateOpenings(
  emails: ReadonlyArray<{ body: string }>,
  seqIdx: number
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
        detail: `Emails ${duplicateIndices
          .sort((a, b) => a - b)
          .map((i) => i + 1)
          .join(', ')} share similar opening lines — vary them for engagement.`,
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
 *
 * V3 changes:
 *   - Per-position word caps (75 / 60 / 40) — supersedes the old flat 100 cap.
 *   - High-trust banned phrases (founder-to-founder, false scarcity, etc.).
 *   - Fabrication detector — flags client counts, "trusted by", named clients,
 *     and revenue figures not present in <case_studies>. Requires the
 *     `client` argument to provide case_studies. If client is omitted, the
 *     fabrication checks are skipped (preserves legacy behavior).
 *   - CTA ladder check — email 1 must not contain calendar links or time
 *     offers; email 4 must not contain any CTA.
 *   - Spintax requirement is now CONDITIONAL on the client's spintax_enabled
 *     setting (or the AOV tier default).
 */
export function checkCopyQuality(
  sequences: DraftSequences,
  client?: Pick<
    OnboardingClient,
    | 'case_studies'
    | 'spintax_enabled'
    | 'setup_fee'
    | 'recurring_fee'
    | 'voice_profile'
  >
): QualityCheckResult {
  const issues: QualityIssue[] = []

  // Determine whether spintax is expected for this client.
  // Default = true if no client provided (preserves legacy behavior for old
  // callers). When client is provided: explicit spintax_enabled wins, else
  // derive from AOV tier (high/enterprise -> false, low/mid -> true).
  let spintaxExpected = true
  if (client) {
    if (typeof client.spintax_enabled === 'boolean') {
      spintaxExpected = client.spintax_enabled
    } else {
      const tier = inferAovTier({
        setupFee: client.setup_fee,
        recurringFee: client.recurring_fee,
      })
      spintaxExpected = tier === 'low' || tier === 'mid'
    }
  }

  // Whether to score against the precision (high-trust) doctrine.
  const isHighTrust = client
    ? (() => {
        const tier = inferAovTier({
          setupFee: client.setup_fee,
          recurringFee: client.recurring_fee,
        })
        return tier === 'high' || tier === 'enterprise'
      })()
    : false

  const caseStudies = client?.case_studies

  for (let seqIdx = 0; seqIdx < sequences.sequences.length; seqIdx++) {
    const sequence = sequences.sequences[seqIdx]

    for (let emailIdx = 0; emailIdx < sequence.emails.length; emailIdx++) {
      const email = sequence.emails[emailIdx]
      const { subject_line, body, preview_text, step, cta_type } = email
      const effectiveStep = typeof step === 'number' ? step : emailIdx + 1

      // Per-position word cap (V3) — replaces the flat 100 cap.
      issues.push(...checkWordCount(body, effectiveStep, seqIdx, emailIdx))

      issues.push(
        ...checkSubjectLength(subject_line, seqIdx, emailIdx),
        ...checkSpamWords(body, seqIdx, emailIdx),
        ...checkStartsWithI(body, seqIdx, emailIdx),
        ...checkWeakOpening(body, seqIdx, emailIdx),
        ...checkMultipleCTAs(body, seqIdx, emailIdx),
        ...checkMultipleLinks(body, seqIdx, emailIdx),
        ...checkSubjectExclamation(subject_line, seqIdx, emailIdx),
        ...checkExcessiveExclamations(body, seqIdx, emailIdx),
        ...checkAllCaps(body, seqIdx, emailIdx),
        // Hard rules
        ...checkEmDashes(body, subject_line, preview_text, seqIdx, emailIdx),
        ...checkDoubleBraceSpintax(
          body,
          subject_line,
          preview_text,
          seqIdx,
          emailIdx
        ),
        ...checkPhantomCallback(body, sequence.emails, seqIdx, emailIdx),
        // V3 doctrine
        ...checkHighTrustBannedPhrases(body, subject_line, seqIdx, emailIdx),
        ...checkFabricatedClaims(body, caseStudies, seqIdx, emailIdx),
        ...checkCtaLadder(body, effectiveStep, cta_type, seqIdx, emailIdx),
        // Masterclass checks
        ...checkCorporateKillSignals(body, seqIdx, emailIdx),
        ...checkLlmIsms(body, subject_line, seqIdx, emailIdx),
        ...checkPsychologicalPrinciples(body, subject_line, seqIdx, emailIdx, {
          highTrust: isHighTrust,
          knownCaseStudyClients: caseStudies
            ?.filter((c) => c.is_named)
            .map((c) => c.client_name),
        }),
        ...checkSubjectLowercase(subject_line, seqIdx, emailIdx),
        ...checkBodyStartsWithI(body, seqIdx, emailIdx)
      )

      // Spintax checks ONLY if spintax is expected.
      if (spintaxExpected) {
        issues.push(
          ...checkInsufficientSpintax(body, seqIdx, emailIdx),
          ...checkNoSubjectSpintax(subject_line, seqIdx, emailIdx)
        )
      }
    }

    issues.push(...checkDuplicateOpenings(sequence.emails, seqIdx))
  }

  const passed = issues.every((issue) => issue.severity !== 'error')

  return { passed, issues }
}
