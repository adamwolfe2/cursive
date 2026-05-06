// Cold Email Copy Engine: Master Knowledge Base
// Two doctrines coexist in this file:
//
//   (A) HIGH-VOLUME OUTBOUND DOCTRINE — distilled from a 3.5-hour cold email
//       masterclass focused on commodity B2B SaaS at scale. Optimized for
//       TAM > 10K, 500+ sends per variant, free/guarantee offers. Use this
//       for low-AOV, transactional offerings where personalization at scale
//       is impossible.
//
//   (B) HIGH-TRUST PRECISION DOCTRINE — added 2026-05 after the volume
//       doctrine produced SDR-boilerplate output for $30K+ AOV creative and
//       consulting clients. Optimized for TAM < 1K, precision openers,
//       earned (not invented) social proof, escalating CTA ladder.
//
// The AOV_TIERS table maps each client to one doctrine. The copy pipeline
// reads the tier and uses the corresponding rule set.
//
// DO NOT let the AI agent modify this file. Human-curated only.

// ---------------------------------------------------------------------------
// THE 7 PSYCHOLOGICAL PRINCIPLES
// Every variant must leverage at least 4-5. Score against all 7.
// ---------------------------------------------------------------------------

export const PSYCHOLOGICAL_PRINCIPLES = [
  {
    id: 'give_first',
    name: 'Give First (Reciprocity)',
    description: 'Provide something of perceived value BEFORE asking for anything. Creates obligation that lowers resistance.',
    examples: ['free audit', 'insight about their business', 'custom asset', 'data point they didn\'t know'],
    weight: 'high' as const,
    checkQuestion: 'Does the email offer something of value before asking?',
  },
  {
    id: 'micro_commitments',
    name: 'Micro Commitments (Escalation Ladder)',
    description: 'Never ask for the big thing first. Start tiny, escalate naturally. reply yes -> watch asset -> take call -> close.',
    examples: ['reply yes to receive', 'quick 15-min chat', 'just say yes and I\'ll get started'],
    weight: 'medium' as const,
    checkQuestion: 'Is the ask small and natural? Does it escalate?',
  },
  {
    id: 'social_proof',
    name: 'Social Proof (Herd Consensus)',
    description: 'Use SPECIFIC numbers, name actual clients, MATCH reference group to prospect ICP.',
    examples: ['112 clients', '$4,892 last week', 'a few of the top 20 right now'],
    weight: 'high' as const,
    checkQuestion: 'Are there specific numbers, names, or results?',
  },
  {
    id: 'authority',
    name: 'Authority (Credibility Signaling)',
    description: 'Demonstrate hyper-relevant expertise. Match authority type to ICP. Signal confidence, no hedging.',
    examples: ['Google Partner badge for SMBs', 'work with [recognizable name]', 'built systems generating $X'],
    weight: 'medium' as const,
    checkQuestion: 'Is there credible expertise demonstrated?',
  },
  {
    id: 'rapport',
    name: 'Rapport (Shared Context)',
    description: 'Find shared context: cultural, career, geographic, interest-based. Mirror communication style.',
    examples: ['Fellow Portland founder', 'I saw you went to UCLA', 'tone matching their formality level'],
    weight: 'high' as const,
    checkQuestion: 'Is there shared context or casual tone?',
  },
  {
    id: 'scarcity',
    name: 'Scarcity (Urgency Creation)',
    description: 'Limit availability or create time pressure. Must be REAL constraints. Loss framing > gain framing.',
    examples: ['only taking 3 more clients this quarter', 'offer expires Friday', 'you\'re losing $X/month'],
    weight: 'medium' as const,
    checkQuestion: 'Is there legitimate urgency or loss framing?',
  },
  {
    id: 'shared_identity',
    name: 'Shared Identity (In-Group Signaling)',
    description: 'Use in-group language, industry jargon, platform-specific terms. Signal "I\'m one of you."',
    examples: ['CTR, subs, thumbs for YouTubers', 'same industry challenges', 'same stack/tools'],
    weight: 'high' as const,
    checkQuestion: 'Does it signal in-group membership?',
  },
] as const

export type PrincipleId = typeof PSYCHOLOGICAL_PRINCIPLES[number]['id']

// ---------------------------------------------------------------------------
// THE 4-STEP COPYWRITING FRAMEWORK
// Every cold email follows: Personalization -> Who Am I -> Offer -> CTA
// ---------------------------------------------------------------------------

export const FOUR_STEP_FRAMEWORK = {
  step1_personalization: {
    name: 'Personalization (Hook)',
    purpose: 'Get past the "is this spam?" filter. Buy 30 seconds of attention.',
    rules: [
      '1-2 sentences MAX. One sentence is ideal.',
      'Must NOT signal you are selling something.',
      'The reader must think: "Wait, do I know this person?"',
      'Must feel like something a real person would actually write.',
    ],
    coldReadingTechnique: 'Make statements that SEEM specific but apply to 80%+ of the target audience. Combine with ONE AI-scraped data point.',
    aiRole: 'AI handles ONLY small variable insertion (school, location, company name casualization). NEVER the full personalization sentence.',
    antiPatterns: [
      'Long over-researched openers that feel stalkerish',
      'Formatted variables with quotes or bold around scraped data',
      'Using full legal company names',
      'Obvious AI-generated compliment chains',
    ],
  },
  step2_who_am_i: {
    name: 'Who Am I + Why Should You Care',
    purpose: 'Answer: "Okay, not a scammer. But who IS this person?"',
    rules: [
      '1-2 sentences MAX.',
      'Combine social proof + in-group signaling in one compact statement.',
      // Fabrication guard, added 2026-05. The previous template was:
      // "We've done [specific number] in [timeframe]." That instruction made
      // Claude invent client counts and revenue figures when no real numbers
      // were available. Now: ONLY reference case studies that appear in the
      // <case_studies> block of the user message. If empty, this step
      // becomes a single in-group statement with no quantified claim.
      'NEVER invent client counts, revenue numbers, or named customers. Reference only the case studies provided in the <case_studies> block.',
      'If <case_studies> is empty: write the in-group signal without any quantified claim (e.g., "I work with launch-stage founders on their first-impression video"). No invented numbers.',
    ],
    template:
      'I work with [type/segment] on [thing]. {{if case_studies provided: a single quantified line lifted from one real case study}} {{else: omit the quantified claim entirely}}.',
  },
  step3_offer: {
    name: 'The Irresistible Proposition',
    purpose: 'Make saying "no" feel irrational.',
    formula: 'Conversion Rate = (Perceived ROI x Trust) / Friction',
    components: {
      result: 'QUANTIFIED, CLEAR, TIME-BOUND: "20 booked meetings in 60 days"',
      riskMitigation: '"I will do [X] in [Y time] or [Z risk reversal]"',
      frictionMinimization: '"Just 15 minutes of your time" / "I\'ll handle everything"',
    },
    rules: [
      'Never put pricing in cold emails for services.',
      'Match offer magnitude to prospect revenue level.',
      'Present as "trivially easy for me given my track record."',
    ],
  },
  step4_cta: {
    name: 'Call to Action',
    purpose: 'Minimize steps between "yes" and booked.',
    rules: [
      'Be SPECIFIC: include exact time, exact method.',
      'One step between "yes" and booked = maximum conversion.',
      'Each additional back-and-forth step leaks ~5-25% of leads.',
    ],
    antiPatterns: [
      '"Let me know your thoughts"',
      '"Would you be interested?"',
      'Open-ended questions with no specific next step',
    ],
    templates: [
      'How does 3:30pm today sound? I can give you a ring.',
      'Can I shoot this over? Just say yes and I\'ll have it in your inbox within 48 hours.',
      'Worth a 15-minute chat? Can ring you 10am today or Thursday.',
    ],
  },
} as const

// ---------------------------------------------------------------------------
// OFFER ARCHETYPES (for variant generation)
// ---------------------------------------------------------------------------

export const OFFER_ARCHETYPES = [
  {
    id: 'revenue_guarantee',
    name: 'Revenue Guarantee',
    template: 'I will guarantee you {number} {outcome} in the next {days} days or you don\'t pay. No strings. Just say yes and I\'ll get started.',
    bestFor: ['agencies', 'B2B services', 'lead gen'],
  },
  {
    id: 'free_work_first',
    name: 'Free Work First',
    template: 'I\'ll build you a {deliverable} at no cost. I\'ll pay for it all myself, do all the work upfront, and only if you like it will I ask you to work with me.',
    bestFor: ['software', 'creative services', 'consulting'],
  },
  {
    id: 'free_asset',
    name: 'Free Asset',
    template: 'Just send me {simple_input}. I\'ll give you a completely free {deliverable}. No strings attached.',
    bestFor: ['content', 'creative', 'coaching'],
  },
  {
    id: 'audit_assessment',
    name: 'Audit/Assessment',
    template: 'I\'ll run a full {type} audit on your {asset}. Show you exactly {pain_point}. Completely free. Just say yes.',
    bestFor: ['marketing agencies', 'SEO', 'tech consulting'],
  },
  {
    id: 'performance_system',
    name: 'Performance System',
    template: 'I\'ll build you a {system} that I guarantee will generate {number} {outcome} in {days} days. You don\'t pay a cent unless we hit it.',
    bestFor: ['lead gen', 'sales', 'performance marketing'],
  },
  {
    id: 'rewrite_improvement',
    name: 'Rewrite/Improvement',
    template: 'Send me your last {number} {assets}. I will rewrite them for free. Plus, I\'ll show you exactly why the new versions will convert better.',
    bestFor: ['copywriting', 'design', 'content'],
  },
] as const

// ---------------------------------------------------------------------------
// SUBJECT LINE PATTERNS
// ---------------------------------------------------------------------------

export const SUBJECT_LINE_PATTERNS = [
  { pattern: '{first_name}, you\'re wasting ${amount}/month', type: 'loss_frame' },
  { pattern: 'your {recent_content} and a formatting thought', type: 'curiosity' },
  { pattern: '{first_name}\'s blind spot', type: 'curiosity' },
  { pattern: 'been with you from the start', type: 'rapport' },
  { pattern: '{first_name} Q', type: 'curiosity' },
  { pattern: 'are you hiring?', type: 'pattern_interrupt' },
  { pattern: 'are you taking coaching clients?', type: 'pattern_interrupt' },
  { pattern: 'quick {first_name} question', type: 'curiosity' },
  { pattern: 'thought about {company} all week', type: 'rapport' },
  { pattern: '{mutual_connection} said to reach out', type: 'social_proof' },
] as const

export const SUBJECT_LINE_RULES = [
  'Lowercase preferred (signals casual, personal).',
  'Include personalization OR curiosity trigger.',
  'Loss-framing outperforms gain-framing.',
  'Must not reveal the full pitch (preserve curiosity gap).',
  'Under 60 characters.',
  'NO: "Quick question", "Quick collab", ALL CAPS, formal/corporate tone.',
] as const

// ---------------------------------------------------------------------------
// FOLLOW-UP RULES
// ---------------------------------------------------------------------------

export const FOLLOW_UP_RULES = {
  maxInitialSequence: 2,
  addThirdAfterReplyRate: 0.04, // Only add 3rd email after 4%+ reply rate
  templates: [
    'Hey {name}, checking in on this. TLDR: {one_sentence_offer}. Let me know.',
    'Hey {name}, just want to make sure this didn\'t get lost. Still happy to {offer}. No pressure.',
    'Hey {name}, quick ping on this. Still available to {action} if you\'re interested.',
  ],
  rules: [
    'Keep them SHORT. Simple pings, not newsletter-style.',
    'Different subject line for each follow-up.',
    'Reformulate the core offer briefly, don\'t repeat verbatim.',
  ],
} as const

// ---------------------------------------------------------------------------
// ITERATION FRAMEWORK (maps to autoresearch orchestrator)
// ---------------------------------------------------------------------------

export const ITERATION_FRAMEWORK = {
  elementRotation: [
    'subject',        // Highest leverage, test first
    'opening_line',   // Personalization/hook
    'who_am_i',       // Social proof statement
    'offer',          // Guarantee structure, outcome, timeframe
    'cta',            // Specific time vs open-ended
    'length',         // Short punchy vs detailed
    'tone',           // Casual vs professional vs bold
  ] as const,
  minimumSendsPerVariant: 500,
  statisticallyMeaninglessSends: 100,
  bigChangesEarlySmallChangesLate: {
    week1_2: 'Test FUNDAMENTALLY different approaches (3x different)',
    week3_4: 'Narrow to winning direction, test moderate variations (2x different)',
    week5_plus: 'Fine-tune: swap single lines, adjust subject, tweak personalization (0.5x different)',
  },
  tamMinimum: 10000, // Minimum total addressable market for valid testing
} as const

// ---------------------------------------------------------------------------
// AI USAGE BOUNDARIES
// ---------------------------------------------------------------------------
//
// This section was originally written for the masterclass doctrine where AI
// was assumed to be a junior assistant operating on hand-written templates.
// The Cursive pipeline operates Claude as the primary writer with a strict
// rule set, so the boundaries needed an honest update.
//
// What the AI does in the Cursive pipeline:
//   - Writes complete email sequences from a structured brief
//   - Constrained by the COPY_WRITING_PROMPT rule set (no fabrication, voice
//     profile adherence, CTA ladder, banned phrases)
//   - Subject to a 20+ check post-generation quality gate
//
// What the AI MUST NOT do:
//   - Invent quantified results, client counts, or named customers
//   - Override the voice_profile requested by the client
//   - Skip the CTA ladder (no calendar link in email 1)
//   - Use any phrase in HIGH_TRUST_BANNED_PHRASES

export const AI_BOUNDARIES = {
  // Hard prohibitions enforced by both prompt and post-generation checker.
  neverUseAiFor: [
    'Inventing quantified results or revenue figures not in <case_studies>',
    'Inventing client counts ("we work with 12 YC companies")',
    'Inventing named customers not provided in <case_studies>',
    'Overriding the voice_profile selected for the client',
    'Skipping CTA ladder (calendar link in email 1, no CTA in email 4 is allowed)',
    'Using any phrase in HIGH_TRUST_BANNED_PHRASES',
  ],
  // What the AI is responsible for in this pipeline.
  useAiFor: [
    'Generating full email sequences from a structured brief',
    'Selecting the most resonant angle from the angle library given the ICP',
    'Casualization of company names, locations, schools',
    'Data enrichment and lead scraping',
    'Suggesting variant phrasing for A/B tests (where spintax_enabled = true)',
    'Reply classification and sentiment analysis',
  ],
  casualizationTasks: [
    'Strip legal suffixes: LLC, Inc, Corp, Ltd, GmbH',
    'Convert long names to acronyms if commonly used',
    'Convert formal locations to neighborhood names',
    'Convert formal school names to casual abbreviations',
  ],
} as const

// ---------------------------------------------------------------------------
// SCORING RUBRIC (for copy quality checks)
// ---------------------------------------------------------------------------

export interface CopyScore {
  readonly principlesPresent: PrincipleId[]
  readonly score: number // 0-7
  readonly passesMinimum: boolean // score >= 4
  readonly isHighPerforming: boolean // score >= 6
  readonly checks: CopyCheckResult[]
}

export interface CopyCheckResult {
  readonly check: string
  readonly passed: boolean
  readonly note?: string
}

export const COPY_QUALITY_CHECKS = [
  'Passes "text message test" (feels personal, not mass)',
  'No corporate signals (no "hope this finds you well", no HTML, no logos)',
  'Personalization is 1-2 sentences max',
  'Social proof uses specific numbers',
  'Offer follows X in Y or Z formula',
  'CTA includes specific time/method',
  'No links in email body',
  'Subject line is lowercase, curiosity-driven or loss-framed',
  'Total length feels appropriate for one-to-one',
  'Contains at least one deliberate imperfection for authenticity',
  'Variables are casualized (no legal suffixes, no quoted formatting)',
  'Does NOT read like AI-generated copy',
] as const

export const LLM_ISM_RED_FLAGS = [
  'passionate about',
  'aligning with',
  'leveraging',
  'synergize',
  'streamline',
  'cutting-edge',
  'game-changer',
  'take it to the next level',
  'circle back',
  'deep dive',
  'unlock',
  'empower',
  'innovative solutions',
  'seamlessly',
  'holistic approach',
] as const

// ---------------------------------------------------------------------------
// KILL SIGNALS (corporate/spam signals to remove)
// ---------------------------------------------------------------------------

export const CORPORATE_KILL_SIGNALS = [
  'Hope this finds you well',
  'I hope this email finds you',
  'I wanted to reach out',
  'I came across your profile',
  'I\'d love to connect',
  'I noticed that you',
  'As a fellow',
  'Best regards',
  'Kind regards',
  'Warm regards',
  'Sincerely',
  'Looking forward to hearing from you',
  'Please don\'t hesitate to reach out',
  'At your earliest convenience',
  'Per our conversation',
  'Touching base',
  'Following up on our previous',
] as const

// ---------------------------------------------------------------------------
// HIGH-TRUST BANNED PHRASES (for high-AOV / founder-led offers)
// ---------------------------------------------------------------------------
//
// These appeared repeatedly in client copy that read as SDR boilerplate even
// after passing the original CORPORATE_KILL_SIGNALS check. They're not
// strictly corporate phrasing — they're the SECOND-WAVE clichés that
// templated outbound has burned into prospects' inboxes. For high-trust
// services, every one of these signals "this is a templated drip."

export const HIGH_TRUST_BANNED_PHRASES = [
  // Coined founder-talk clichés
  'founder-to-founder',
  'founder to founder',
  'operator-to-operator',
  'operator to operator',
  'founder tax',
  'operator tax',
  // Filler openers
  'just wanted to reach out',
  'reaching out because',
  'reaching out to',
  'I\'d love to',
  'I\'d be happy to',
  'I\'m reaching out',
  // Followup clichés
  'looping back',
  'circling back',
  'just bumping this',
  'bumping this up',
  'wanted to bump',
  'touching base',
  'wanted to circle back',
  // "Quick" filler
  'quick question', // banned as opener AND subject — the masterclass KB also flagged this
  'quick collab',
  'quick chat',
  // Signposting that signals templated copy
  'Here\'s why',
  'Here\'s the thing',
  'Here\'s what I\'m thinking',
  // Hyperbolic competitor-pricing language (sounds like a hard-pitch SDR)
  'absurd pricing',
  'absurd price',
  'ridiculous pricing',
  'ridiculous price',
  'absurdly expensive',
  // False scarcity (a hard-trust killer for high-AOV offers)
  '2 spots left',
  'two spots left',
  '3 spots left',
  'three spots left',
  'final slots',
  'final spots',
  'last spot',
  'last slot',
  'limited availability',
  'this week only',
  'this month only',
  'closing tomorrow',
  'taking only',
  'only taking',
  // Hedging filler
  'just checking',
  'just checking in',
  // "Hope" openers
  'hoping to connect',
  'hoping you\'re',
] as const

// Sentence-pattern bans (regex-based, applied separately from the substring
// match above). Each entry MUST be a regex that matches at sentence start
// only — otherwise legitimate prose triggers false positives.
export const HIGH_TRUST_BANNED_PATTERNS: ReadonlyArray<{ name: string; regex: RegExp }> = [
  { name: 'starts_with_heres_why', regex: /(^|\n|\.\s+)here'?s why\b/i },
  { name: 'starts_with_heres_the_thing', regex: /(^|\n|\.\s+)here'?s the thing\b/i },
  { name: 'starts_with_quick_question_opener', regex: /(^|\n)quick question[,.]/i },
] as const

// ---------------------------------------------------------------------------
// VOICE PROFILES (high-trust doctrine)
// ---------------------------------------------------------------------------
//
// A voice profile is a structured directive Claude receives in the user
// message. Each profile defines pronoun usage, sentence rhythm, signoff
// convention, and the kind of imperfection that makes the copy sound human.
//
// The profile is selected at onboarding (or auto-derived from AOV + intake
// signals) and overrides the legacy `copy_tone` enum where present.

export interface VoiceProfileSpec {
  readonly id: 'founder_direct' | 'agency_professional' | 'consultant_authoritative'
  readonly label: string
  readonly summary: string
  readonly pronoun: 'I' | 'we' | 'I (mostly)'
  readonly signoff: string
  readonly sentence_style: string
  readonly default_for: readonly string[]
  readonly avoid: readonly string[]
}

export const VOICE_PROFILES_KB: ReadonlyArray<VoiceProfileSpec> = [
  {
    id: 'founder_direct',
    label: 'Founder Direct',
    summary:
      'First-person singular. Short sentences. Casual but not bro-y. Signs with first name only — no role, no title. Writes like someone who does not need to prove anything because their work speaks for itself. Allows a small natural imperfection (a lowercase first letter after a line break, an em-clause replaced with a comma, a one-word sentence) to signal that a real human typed this.',
    pronoun: 'I',
    signoff: 'First name only on its own line. No "Best,", no "Thanks,", no role line.',
    sentence_style:
      'Mix of short fragments (3-7 words) and one slightly longer sentence per email (10-15 words). Avoid uniform mid-length sentences — that is the SDR rhythm.',
    default_for: ['solo founders', 'creative directors', 'consultants billing under their own name', 'agency owners under 10 employees'],
    avoid: [
      'corporate "we" unless genuinely a team',
      'titles in signature',
      'formal greeting ("Hi {{firstName}},") — the first line IS the hook',
      'sign-off phrases',
    ],
  },
  {
    id: 'agency_professional',
    label: 'Agency Professional',
    summary:
      'First-person plural where appropriate (the agency, the team). Polished, structured, but still warm. Signs with full name and role. One step above casual — closer to a thoughtful business correspondence than a text message. Used for established agencies with team capacity that want to signal scale and reliability.',
    pronoun: 'we',
    signoff: 'Full name + role on separate lines (e.g., "Sarah Chen\\nFounder, Apex Studios").',
    sentence_style:
      'Slightly longer sentences than founder_direct (10-18 words on average). Maintain crispness; do not lapse into corporate prose.',
    default_for: ['agencies with 10+ employees', 'production studios', 'mid-market service firms'],
    avoid: ['lapsing into formal/corporate phrasing', 'jargon', 'long paragraphs (still 1-2 sentences max)'],
  },
  {
    id: 'consultant_authoritative',
    label: 'Consultant Authoritative',
    summary:
      'First-person singular with confident framing. References frameworks, processes, or proprietary methodology naturally — never as a sales pitch. Signs with full name. Slightly more formal than founder_direct. Conveys "I have done this enough times to know how it ends."',
    pronoun: 'I (mostly)',
    signoff: 'Full name. Optionally a one-line credential under the name (no role-as-job-title — credential as proof).',
    sentence_style:
      'Confident assertions. Light technical vocabulary where it earns trust. No hedging. No "I think" / "perhaps" / "might."',
    default_for: ['solo consultants', 'fractional executives', 'frameworks-driven advisory firms'],
    avoid: ['corporate jargon disguised as expertise', 'overclaiming', 'arrogance — confidence comes from specificity, not volume'],
  },
] as const

// ---------------------------------------------------------------------------
// AOV TIERS (drives generation defaults)
// ---------------------------------------------------------------------------
//
// AOV (average order value) is the single best predictor of which doctrine
// applies. Below $5K: volume doctrine. $10K+: precision doctrine. The
// boundaries below are the inflection points where the rules genuinely change.

export interface AovTierSpec {
  readonly id: 'low' | 'mid' | 'high' | 'enterprise'
  readonly label: string
  readonly aov_range: string
  readonly doctrine: 'volume' | 'precision'
  readonly spintax_default: boolean
  readonly default_voice: 'founder_direct' | 'agency_professional' | 'consultant_authoritative'
  readonly default_angles: readonly string[]
  readonly avoid_angles: readonly string[]
  readonly cta_email_1: 'asset_offer' | 'reply_only' | 'calendar'
}

export const AOV_TIERS_KB: ReadonlyArray<AovTierSpec> = [
  {
    id: 'low',
    label: 'Low AOV (transactional)',
    aov_range: 'Under $5K ACV',
    doctrine: 'volume',
    spintax_default: true,
    default_voice: 'agency_professional',
    default_angles: ['pain_agitation', 'outcome_result', 'data_insight'],
    avoid_angles: ['compliment_pivot', 'quiet_proof'], // too slow at scale
    cta_email_1: 'reply_only',
  },
  {
    id: 'mid',
    label: 'Mid AOV',
    aov_range: '$5K – $15K',
    doctrine: 'volume',
    spintax_default: true,
    default_voice: 'agency_professional',
    default_angles: ['outcome_result', 'pain_agitation', 'specific_signal_observation'],
    avoid_angles: [],
    cta_email_1: 'reply_only',
  },
  {
    id: 'high',
    label: 'High AOV (high-trust)',
    aov_range: '$15K – $75K',
    doctrine: 'precision',
    spintax_default: false,
    default_voice: 'founder_direct',
    default_angles: ['specific_signal_observation', 'quiet_proof', 'curiosity_soft_question'],
    avoid_angles: ['direct_challenge', 'pain_agitation', 'social_proof_fomo'],
    cta_email_1: 'asset_offer',
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    aov_range: '$75K+',
    doctrine: 'precision',
    spintax_default: false,
    default_voice: 'consultant_authoritative',
    default_angles: ['specific_signal_observation', 'quiet_proof', 'mutual_pattern_recognition'],
    avoid_angles: ['direct_challenge', 'pain_agitation', 'social_proof_fomo', 'free_value_drop'],
    cta_email_1: 'asset_offer',
  },
] as const

/**
 * Infer AOV tier from setup_fee + recurring_fee. Conservative inference: we
 * use the LARGER of the two (a one-time $50K project counts as high-AOV even
 * if recurring is $0).
 */
export function inferAovTier(params: { setupFee?: number | null; recurringFee?: number | null }): 'low' | 'mid' | 'high' | 'enterprise' {
  const setup = params.setupFee ?? 0
  const recurring = params.recurringFee ?? 0
  // Treat recurring as 6 months of value to avoid undervaluing subscription
  // products. This matches how the masterclass framework prices "value of one
  // year of work" but kept tighter for cold outbound testing.
  const annualizedRecurring = recurring * 6
  const dealValue = Math.max(setup, annualizedRecurring)

  if (dealValue >= 75_000) return 'enterprise'
  if (dealValue >= 15_000) return 'high'
  if (dealValue >= 5_000) return 'mid'
  return 'low'
}

/**
 * Look up the rule set for a given AOV tier. Returns the spec object including
 * spintax default, default voice, default angles, etc.
 */
export function getAovTierSpec(tier: 'low' | 'mid' | 'high' | 'enterprise'): AovTierSpec {
  const spec = AOV_TIERS_KB.find((t) => t.id === tier)
  if (!spec) throw new Error(`Unknown AOV tier: ${tier}`)
  return spec
}

// ---------------------------------------------------------------------------
// CTA LADDER DOCTRINE
// ---------------------------------------------------------------------------
//
// The masterclass step4_cta says "minimize steps between yes and booked,"
// which correctly drives calendar links in email 1 for low-AOV / volume
// outbound. For high-trust services, that doctrine BURNS the cold contact —
// asking a Series A founder for a calendar slot in the first cold email
// signals "templated SDR drip" and gets archived.
//
// The CTA ladder is the high-trust counter-doctrine: trust must precede the
// ask. The first email earns the reply. The third email earns the call.

export const CTA_LADDER_DOCTRINE = {
  doctrine_summary:
    'For high-trust offers ($15K+ AOV): trust must precede the ask. Email 1 offers an asset (case study, video, useful insight). Email 2 mentions a call casually. Email 3 is the first time a calendar link appears. Email 4 is the breakup with no CTA.',

  email_1: {
    cta_type: 'asset_offer' as const,
    permitted_actions: [
      'Link to a case study, short video, or relevant content piece',
      'Offer to send the asset if they reply yes',
      'Reply-only — no link at all (often strongest)',
    ],
    forbidden_actions: [
      'Calendar link',
      'Any phrase that asks for a meeting ("worth a 15-min chat?")',
      'Any phrase that asks for a slot ("Thursday at 2pm?")',
    ],
    rationale:
      'Email 1 is first contact. Asking for time at first contact signals a templated drip. The asset offer is low-friction reciprocity that earns the reply.',
  },

  email_2: {
    cta_type: 'soft_call_mention' as const,
    permitted_actions: [
      'Continue the asset offer if email 1 was reply-only',
      'Casually mention a call as an option ("happy to jump on a quick call if it would be useful")',
      'Continue with proof — let the proof carry the email, with a soft optional ask',
    ],
    forbidden_actions: [
      'Direct calendar link with specific times',
      'Hard ask ("can we get on a call this week?")',
    ],
    rationale:
      'Email 2 builds on email 1 with proof. The soft call mention pre-frames the ladder. Still no hard ask — replies should outpace bookings at this step.',
  },

  email_3: {
    cta_type: 'calendar_link' as const,
    permitted_actions: [
      'Direct calendar link',
      'ONE specific time suggestion ("Thursday at 2pm or Friday morning works on my end")',
      'A clear ask',
    ],
    forbidden_actions: [
      'Multiple time options that read like a calendar paste',
      'Pressure language ("last chance", "this week only")',
    ],
    rationale:
      'Email 3 is where the calendar appears. By now the prospect has seen the case study, the proof, and the casual call mention. The direct ask reads as natural progression, not cold-pitch.',
  },

  email_4: {
    cta_type: 'breakup' as const,
    permitted_actions: [
      'Acknowledge no response honestly',
      'Leave the door open',
      'Sign off',
    ],
    forbidden_actions: [
      'ANY CTA',
      'Calendar link',
      'Asset offer',
      'Pressure language',
    ],
    rationale:
      'The breakup consistently gets the highest reply rate because it removes pressure. Adding a CTA inverts that effect.',
  },
} as const

// ---------------------------------------------------------------------------
// EXPANDED ANGLE LIBRARY (high-trust + volume doctrines combined)
// ---------------------------------------------------------------------------
//
// Each angle has a doctrine, an emotional driver, a typical use case, and an
// example opener. The angle selection prompt picks 3 angles given the AOV
// tier and the avoid_angles list — the avoid list is filtered out before
// selection.

export interface AngleSpec {
  readonly id: string
  readonly label: string
  readonly doctrine: 'volume' | 'precision' | 'both'
  readonly emotional_driver: string
  readonly when_to_use: string
  readonly example_opener: string
  readonly requires: readonly string[]
}

export const ANGLE_LIBRARY: ReadonlyArray<AngleSpec> = [
  // High-trust / precision angles
  {
    id: 'specific_signal_observation',
    label: 'Specific Signal Observation',
    doctrine: 'precision',
    emotional_driver: 'recognition + curiosity',
    when_to_use:
      'When a verifiable signal exists for this prospect (recent funding, stealth exit, key hire, public essay, product launch). Default for high-AOV email 1.',
    example_opener: '{{firstName}}, congratulations on the round. The next 90 days are the window where your market narrative either crystallizes into something powerful or gets defined by whoever talks loudest.',
    requires: ['prospect_signal'],
  },
  {
    id: 'quiet_proof',
    label: 'Quiet Proof',
    doctrine: 'precision',
    emotional_driver: 'aspiration + curiosity',
    when_to_use:
      'When a strong case study is available. Lead with the result without framing it as a pitch. Best for high-AOV / creative services.',
    example_opener: 'Adaptive launched six months ago with a film instead of a demo. 1.2M views. Revenue doubled that quarter. I made that film.',
    requires: ['case_studies'],
  },
  {
    id: 'curiosity_soft_question',
    label: 'Curiosity / Soft Question',
    doctrine: 'precision',
    emotional_driver: 'curiosity',
    when_to_use:
      'When you have a specific, sharp question that the prospect would want to know the answer to. Not "quick question" — a real, narrow, relevant question.',
    example_opener: '{{firstName}}, why is {{companyName}}\'s docs site outranking the homepage on Google?',
    requires: [],
  },
  {
    id: 'mutual_pattern_recognition',
    label: 'Mutual Pattern Recognition',
    doctrine: 'precision',
    emotional_driver: 'in-group + curiosity',
    when_to_use:
      'When a real pattern across similar companies is observable and the prospect would recognize it. NOT invented patterns.',
    example_opener: 'Most Series A founders I work with say the same thing six months after launch: they wish they\'d put more intention into the moment.',
    requires: ['case_studies'],
  },
  {
    id: 'free_value_drop',
    label: 'Free Value Drop',
    doctrine: 'precision',
    emotional_driver: 'reciprocity',
    when_to_use:
      'Lead with a useful insight or short piece of research about their space. No pitch. Reciprocity creates the obligation.',
    example_opener: '{{firstName}}, I pulled the launch films of every Series A AI co that raised in Q1. Three of them all hired the same studio. The other 14 used in-house decks. Wanted to share what I noticed.',
    requires: [],
  },
  {
    id: 'compliment_pivot',
    label: 'Compliment + Pivot',
    doctrine: 'precision',
    emotional_driver: 'recognition + curiosity',
    when_to_use:
      'When you can name a specific real thing the prospect did well, then show how to amplify it. Must be a real, specific compliment — not generic praise.',
    example_opener: 'Your seed announcement post got 2.3K likes — I noticed you wrote it yourself. Few founders do that anymore.',
    requires: [],
  },
  // Volume / commodity angles (still in the library, weighted DOWN for high-trust)
  {
    id: 'pain_agitation',
    label: 'Pain Agitation',
    doctrine: 'volume',
    emotional_driver: 'frustration',
    when_to_use:
      'For low-mid AOV. Lead with the problem they feel daily, agitate it, then offer relief. Burns trust at high-AOV.',
    example_opener: 'Most B2B marketing teams are spending 40-60% of pipeline budget on paid channels that get more expensive every quarter.',
    requires: [],
  },
  {
    id: 'outcome_result',
    label: 'Outcome / Result',
    doctrine: 'both',
    emotional_driver: 'ambition',
    when_to_use:
      'Lead with a specific result for a similar company. REQUIRES a real case study — the precision doctrine forbids fabricated outcomes.',
    example_opener: 'Adaptive went from 0 to 1.2M views in 90 days with one launch film.',
    requires: ['case_studies'],
  },
  {
    id: 'contrarian_pattern_interrupt',
    label: 'Contrarian / Pattern Interrupt',
    doctrine: 'both',
    emotional_driver: 'curiosity',
    when_to_use:
      'Challenge something the prospect believes. Works for sophisticated buyers who have heard every pitch.',
    example_opener: 'Most founders launch with a demo video. The demo is the worst possible first impression.',
    requires: [],
  },
  {
    id: 'social_proof_fomo',
    label: 'Social Proof / FOMO',
    doctrine: 'volume',
    emotional_driver: 'FOMO',
    when_to_use:
      'For volume outbound. AVOID for high-trust — fabricated social proof is the most common failure mode here.',
    example_opener: 'Three of the YC W26 companies in your batch are already running this.',
    requires: ['case_studies', 'multiple_named_clients'],
  },
  {
    id: 'authority_expertise',
    label: 'Authority / Expertise',
    doctrine: 'both',
    emotional_driver: 'trust',
    when_to_use: 'Demonstrate deep understanding of their world before pitching. Earned through specifics, not volume.',
    example_opener: 'I\'ve spent the last 4 years making launch films for $4M-$15M-raised AI companies. Here\'s the pattern I keep seeing.',
    requires: [],
  },
  {
    id: 'trigger_event',
    label: 'Trigger Event',
    doctrine: 'both',
    emotional_driver: 'urgency',
    when_to_use:
      'Reference something happening in their company or market right now. Subset of specific_signal_observation when the signal is time-sensitive.',
    example_opener: 'Saw the OpenAI Codex announcement this morning. The competitive window for AI coding tools just compressed by 6 months.',
    requires: [],
  },
  {
    id: 'data_insight',
    label: 'Data / Insight',
    doctrine: 'both',
    emotional_driver: 'curiosity',
    when_to_use:
      'Lead with a surprising stat or insight about their industry. Stats must be REAL — fabricated industry numbers are catchable and lethal to trust.',
    example_opener: 'AI companies that launch with a film convert at 2.3x the rate of companies that launch with a demo (n=47, public data).',
    requires: [],
  },
  {
    id: 'direct_challenge',
    label: 'Direct Challenge',
    doctrine: 'volume',
    emotional_driver: 'ego',
    when_to_use:
      'Be blunt about a gap. Only for highly sophisticated buyers and only after email 2+. AVOID at email 1 for high-trust offers — too aggressive.',
    example_opener: 'Your homepage hero is doing the opposite of what your seed deck promises.',
    requires: [],
  },
] as const

// ---------------------------------------------------------------------------
// Score a piece of copy against the rubric
// ---------------------------------------------------------------------------

export function scoreCopy(params: {
  readonly subject: string
  readonly body: string
  readonly hasSocialProof: boolean
  readonly hasSpecificNumbers: boolean
  readonly hasOffer: boolean
  readonly hasCta: boolean
  readonly hasPersonalization: boolean
  /**
   * When true, this email is for a high-AOV / precision-doctrine client. The
   * scorer relaxes "social_proof requires numbers" (the precision doctrine
   * uses one named case study, not a count) and tightens "give_first does NOT
   * mean free/guarantee" (those offers are inappropriate for $30K+ services).
   */
  readonly highTrust?: boolean
  /** Provided when highTrust = true to verify named clients are real. */
  readonly knownCaseStudyClients?: ReadonlyArray<string>
}): CopyScore {
  const { subject, body, hasSocialProof, hasSpecificNumbers, hasOffer, hasCta, hasPersonalization, highTrust, knownCaseStudyClients } = params
  const fullText = `${subject} ${body}`.toLowerCase()

  const principlesPresent: PrincipleId[] = []

  // give_first: for volume doctrine, "free" / "no cost" / "no charge" count.
  // For precision (high-trust), these signal the WRONG offer type — a $30K
  // service does not lead with "free." Instead, the asset offer in the CTA
  // ladder is the give_first action. We grant the principle if the email has
  // a legitimate offer signal OR opens with an observation/insight (which is
  // itself a form of giving first).
  if (highTrust) {
    const opensWithGive =
      /\b(noticed|saw|pulled|spent|read|watched|listened)\b/.test(body) ||
      /case study|video|asset/i.test(body)
    if (opensWithGive || hasOffer) principlesPresent.push('give_first')
  } else {
    if (hasOffer || fullText.includes('free') || fullText.includes('no cost') || fullText.includes('no charge')) {
      principlesPresent.push('give_first')
    }
  }

  if (hasCta && (fullText.includes('just say yes') || fullText.includes('just reply') || fullText.includes('15 min'))) {
    principlesPresent.push('micro_commitments')
  }

  // social_proof rules differ by doctrine.
  // Volume: requires explicit number (e.g., "112 clients").
  // Precision: a NAMED case study counts as social proof; counts do NOT count.
  // The previous version of this scorer awarded social_proof for any pattern
  // matching /\d+\s*(clients?|companies)/, which directly incentivized
  // fabricated numbers. The fix: in highTrust mode, social_proof is awarded
  // only when a named client from knownCaseStudyClients appears literally in
  // the body.
  if (highTrust) {
    if (knownCaseStudyClients && knownCaseStudyClients.length > 0) {
      const lowered = body.toLowerCase()
      const cited = knownCaseStudyClients.some((name) => name && lowered.includes(name.toLowerCase()))
      if (cited) principlesPresent.push('social_proof')
    }
    // If no case studies provided, social_proof is NOT scored — the absence
    // of a number is the right behavior, not a missing principle.
  } else {
    if (hasSocialProof && hasSpecificNumbers) principlesPresent.push('social_proof')
  }

  if (fullText.includes('i work with') || fullText.includes('i help') || fullText.includes('i built') || fullText.includes('my team')) {
    principlesPresent.push('authority')
  }
  if (hasPersonalization || fullText.includes('fellow') || fullText.includes('i saw') || fullText.includes('noticed')) {
    principlesPresent.push('rapport')
  }
  // scarcity: in volume mode, words like "only/last/losing/wasting" pass.
  // In precision mode, false-scarcity language is a kill signal — banned
  // explicitly elsewhere — so the scorer does NOT award scarcity for
  // precision-doctrine copy. Real time-windows (e.g., a funded company's
  // launch moment) carry scarcity implicitly through the situation, not the
  // language.
  if (!highTrust) {
    if (fullText.includes('only') || fullText.includes('last') || fullText.includes('losing') || fullText.includes('wasting')) {
      principlesPresent.push('scarcity')
    }
  }
  if (fullText.includes('like you') || fullText.includes('your space') || fullText.includes('in your industry')) {
    principlesPresent.push('shared_identity')
  }

  const checks: CopyCheckResult[] = []

  // Text message test
  const wordCount = body.split(/\s+/).length
  checks.push({
    check: 'Text message test',
    passed: wordCount <= 120 && !body.includes('</') && !body.includes('http'),
  })

  // Corporate signals
  const hasCorporateSignal = CORPORATE_KILL_SIGNALS.some(
    (signal) => fullText.includes(signal.toLowerCase())
  )
  checks.push({ check: 'No corporate signals', passed: !hasCorporateSignal })

  // LLM-isms
  const hasLlmIsm = LLM_ISM_RED_FLAGS.some(
    (flag) => fullText.includes(flag.toLowerCase())
  )
  checks.push({ check: 'No LLM-isms', passed: !hasLlmIsm })

  // Subject line
  const subjectIsLowercase = subject === subject.toLowerCase()
  const subjectLength = subject.length
  checks.push({
    check: 'Subject line quality',
    passed: subjectIsLowercase && subjectLength <= 60 && subjectLength >= 2,
  })

  // Word count
  checks.push({
    check: 'Word count in range',
    passed: wordCount >= 50 && wordCount <= 120,
    note: `${wordCount} words`,
  })

  // No links
  checks.push({
    check: 'No links in body',
    passed: !body.includes('http') && !body.includes('www.') && !body.includes('.com/'),
  })

  const score = principlesPresent.length

  return {
    principlesPresent,
    score,
    passesMinimum: score >= 4,
    isHighPerforming: score >= 6,
    checks,
  }
}
