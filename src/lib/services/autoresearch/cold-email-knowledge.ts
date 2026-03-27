// Cold Email Copy Engine: Master Knowledge Base
// Distilled from a 3.5-hour cold email copywriting masterclass ($15M+ in outbound revenue)
// This file is the "program.md" equivalent — the immutable knowledge that guides all copy generation.
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
    ],
    template: 'I currently work with [client/type] in [their industry] to help them [do thing]. We\'ve done [specific number] in [timeframe].',
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
// AI USAGE BOUNDARIES (CRITICAL — what AI should and should NOT do)
// ---------------------------------------------------------------------------

export const AI_BOUNDARIES = {
  neverUseAiFor: [
    'Writing the entire email from scratch',
    'Generating the offer section',
    'Writing the social proof / who am I section',
    'Creating the CTA',
    'Replacing human copywriting judgment',
  ],
  useAiFor: [
    'Small templated variable insertion into pre-written templates',
    'Casualization of company names, locations, schools',
    'Data enrichment and lead scraping',
    'Suggesting variant phrasing for A/B tests (specific lines, not whole emails)',
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
}): CopyScore {
  const { subject, body, hasSocialProof, hasSpecificNumbers, hasOffer, hasCta, hasPersonalization } = params
  const fullText = `${subject} ${body}`.toLowerCase()

  const principlesPresent: PrincipleId[] = []

  // Check each principle
  if (hasOffer || fullText.includes('free') || fullText.includes('no cost') || fullText.includes('no charge')) {
    principlesPresent.push('give_first')
  }
  if (hasCta && (fullText.includes('just say yes') || fullText.includes('just reply') || fullText.includes('15 min'))) {
    principlesPresent.push('micro_commitments')
  }
  if (hasSocialProof && hasSpecificNumbers) {
    principlesPresent.push('social_proof')
  }
  if (fullText.includes('i work with') || fullText.includes('i help') || fullText.includes('i built') || fullText.includes('my team')) {
    principlesPresent.push('authority')
  }
  if (hasPersonalization || fullText.includes('fellow') || fullText.includes('i saw') || fullText.includes('noticed')) {
    principlesPresent.push('rapport')
  }
  if (fullText.includes('only') || fullText.includes('last') || fullText.includes('losing') || fullText.includes('wasting')) {
    principlesPresent.push('scarcity')
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
