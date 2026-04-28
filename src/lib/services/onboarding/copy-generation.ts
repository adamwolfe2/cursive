// Claude Email Copy Generation Service, V2
// Two-call pattern: Angle Selection -> Copy Writing with spintax
// Generates high-converting outbound email sequences with deliverability optimization

import Anthropic from '@anthropic-ai/sdk'
import type {
  OnboardingClient,
  EnrichedICPBrief,
  DraftSequences,
  AngleSelection,
  QualityIssue,
} from '@/types/onboarding'
import { checkSpendLimit, recordSpend } from '@/lib/services/api-spend-guard'

const MODEL = 'claude-sonnet-4-20250514'

// Sonnet pricing: $3/M input, $15/M output
const INPUT_COST_PER_TOKEN = 3.0 / 1_000_000
const OUTPUT_COST_PER_TOKEN = 15.0 / 1_000_000

// ---------------------------------------------------------------------------
// Lazy-initialized Anthropic client
// ---------------------------------------------------------------------------

let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

// ---------------------------------------------------------------------------
// CALL 1: Angle Selection System Prompt
// ---------------------------------------------------------------------------

const ANGLE_SELECTION_PROMPT = `You are a cold email strategist. Your job is to analyze the research on a client and their target prospects, then select the 3 strongest messaging angles for cold outbound email sequences.

Each angle must be fundamentally different — not just a different tone, but a different REASON the prospect should care. Think about it from the prospect's perspective: what would make ME stop and read this?

Consider these angle categories and select the 3 that are strongest for this specific ICP:

- Pain agitation: Lead with the problem they're experiencing, make them feel it, then offer relief
- Outcome/result: Lead with a specific result achieved for a similar company
- Contrarian/pattern interrupt: Challenge something they believe, open a curiosity gap
- Social proof/FOMO: Show them that peers/competitors are already doing this
- Authority/expertise: Demonstrate deep understanding of their world before pitching
- Question-led: Ask a question that's hard to ignore because it's so relevant
- Compliment + pivot: Acknowledge something they're doing well, then show how to amplify it
- Trigger event: Reference something happening in their market/company right now
- Direct challenge: Be blunt about a gap in their strategy (works for sophisticated buyers)
- Data/insight: Lead with a surprising stat or insight about their industry

Do NOT always pick Pain, Social Proof, and Direct. Actually think about which 3 are BEST for this specific prospect profile.

Output valid JSON only:
{
  "selected_angles": [
    {
      "angle_name": "short label",
      "angle_category": "one of the categories above",
      "core_insight": "the truth we are leveraging",
      "emotional_driver": "fear/curiosity/ambition/frustration/FOMO/ego",
      "proof_mechanism": "how we back it up — stat, case study, logic, social proof, authority",
      "sequence_arc": {
        "email_1_purpose": "what email 1 does in 1 sentence",
        "email_2_purpose": "what email 2 does",
        "email_3_purpose": "what email 3 does",
        "email_4_purpose": "what the breakup email does"
      },
      "why_this_works": "specific reasoning for this ICP"
    }
  ],
  "angles_considered_but_rejected": [
    {
      "angle": "name",
      "reason_rejected": "why it will not work for this audience"
    }
  ]
}`

// ---------------------------------------------------------------------------
// CALL 2: Copy Writing System Prompt
// ---------------------------------------------------------------------------

const COPY_WRITING_PROMPT = `You are an elite B2B cold email copywriter. You have written tens of thousands of cold emails and you know exactly what gets replies and what gets deleted. You are not a template machine. You are a strategist who writes emails that feel like they came from a thoughtful human who did their research.

YOUR RULES, VIOLATE NONE OF THESE:

THE OFFER (HIGHEST PRIORITY RULE):
- The user message includes a <service_offering> block. That is exactly what this client sells. Every email in every sequence must reinforce THAT offer. Not a generic version. Not an agency-revenue narrative. THAT specific offering.
- If <service_offering> says the client helps companies find intent-based audiences already searching for them, every sequence must be about THAT, not about partnership revenue, not about hourly billing replacement, not about generic growth.
- If you are about to write a sentence that does not reinforce the specific offer above, delete it and write a different one.

NO EM-DASHES, NO EN-DASHES (HARD DELIVERABILITY + HUMAN-FEEL RULE):
- Never use the em-dash character (—) anywhere. Subject, body, preview text, anywhere.
- Never use the en-dash character (–) anywhere.
- Use a comma, a period, parentheses, or two short sentences instead. Em-dashes are a known AI-generation tell that destroys reply rates.
- Hyphens inside compound words (state-of-the-art, B2B) are fine. Em-dash sentence breaks are not.

SEQUENCE COHERENCE RULES (NO PHANTOM CALLBACKS):
- You are writing a sequence of emails to ONE prospect. Each email must be coherent with the prior emails IN THE SAME SEQUENCE you are generating.
- DO NOT reference content that does not exist in earlier emails of THIS sequence. No "that creative waste comment," no "as we discussed," no "Following up on the revenue model conversation," no "your team's response to my last note."
- A follow-up may reference a topic raised in a prior step ONLY if that topic appears literally in the prior step's body. If you reference "creative waste," step 1 must actually mention creative waste.
- Email 2 should add NEW value (proof, data, story) on the SAME thread as email 1, not pretend a prior conversation happened.
- Email 3 may pivot to a different angle, but it cannot reference a "comment" or "reply" or "conversation" the prospect never made.
- Email 4 (breakup) is the only one allowed to reference "no response" or similar, because that is honest.

FORMAT RULES:
- Every email body is under 95 words. Not 100. Not 120. Under 95. Count them.
- Subject lines are 1-6 words. Never longer. Never include the company name in subject. Never use clickbait.
- Subject lines should feel lowercase, casual, and personal (e.g. "quick question", "audience precision", "worth 2 min?"). Capitalized clickbait subject lines hurt reply rates.
- Use {{firstName}} for personalization. Use {{companyName}} only when it reads naturally.
- No greetings like "Hi {{firstName}}," as the first line. The first line IS the hook. Open cold. Put "{{firstName}}," on its own line only if the tone calls for it, or weave the name into the opening naturally.
- No email signatures in the body. The sending platform handles that.
- No "Best regards", "Cheers", "Thanks", or sign-off fluff. End on the CTA or a short closer.
- One CTA per email. One. Not "book a call or reply or check out our site." Pick one.
- Short paragraphs. 1-2 sentences max per paragraph. White space is your friend.
- No bullet points in email 1. Ever. It looks like a template. Bullets are acceptable in email 2 or 3 for proof points only.

DELIVERABILITY RULES:
- No spam trigger words: free, guarantee, act now, limited time, click here, buy now, discount, offer, deal, congratulations, winner, urgent, expire
- No ALL CAPS words (except acronyms like CEO, SaaS, ROI)
- No exclamation marks in subject lines. Maximum one in the entire email body, and only if it reads naturally.
- No more than one link per email (the CTA link). Prefer no links in email 1, just ask for a reply.
- No images, no HTML formatting. Plain text only.
- Vary sentence length. Mix short punchy sentences with slightly longer ones.
- No identical opening across emails in the same sequence. Each email must start differently.

SPINTAX RULES:
- Use SINGLE-BRACE spintax format only: {option1|option2|option3}
- DOUBLE-BRACE {{ }} is reserved for merge tags ONLY (e.g. {{firstName}}, {{companyName}}). NEVER put a pipe inside double braces. {{quick q|hi}} is INVALID and WILL leak raw braces into the recipient's inbox.
- If a string contains a pipe (|), use SINGLE braces. Always.
- Every email MUST include spintax in at least 3 places:
  1. The subject line (provide 3-5 subject line variants in spintax)
  2. The opening line/hook (provide 2-3 opening variants)
  3. The CTA phrasing (provide 2-3 CTA variants)
- Additional spintax in the body for key phrases where natural variation exists
- Spintax options must all be roughly the same length and quality. Do not make one option clearly better, you are testing, not sandbagging.
- Spintax must read naturally for ALL combinations. Read each variant out loud. If any combination sounds awkward, fix it.
- DO NOT use spintax for {{firstName}} or {{companyName}}, those are merge tags, not spintax.
- Keep spintax segments short (2-8 words each). Do not spintax entire sentences.

COPY QUALITY RULES:
- The opening line must pass the "delete test": if you read ONLY the first line in a notification preview, would you open this email? If not, rewrite it.
- Never start with "I" as the first word. Start with the prospect, their world, or a provocative observation.
- Never say "I wanted to reach out", "I came across your company", "I noticed that", "I'd love to", "I think you'd be interested". These are invisible words that every cold email uses. Find a different way in.
- Never use "just", "actually", "honestly", "frankly", "to be honest", filler words that weaken the copy.
- Never use AI-tell words: "delve", "leverage", "elevate", "in today's fast-paced", "unlock", "harness", "navigate", "robust", "seamless", "cutting-edge". They scream AI-generated.
- Never mention your product name in email 1. Earn the right to pitch first.
- Never ask "Is this something you'd be interested in?", weak CTA. Be specific.
- The tone must match what the PROSPECT expects, not just what the client prefers.
- Reference specifics: industry names, common tools, known challenges, competitor dynamics.
- Every follow-up must add new value, shift the angle, or reframe, never just "following up."

SEQUENCE STRUCTURE:
- Email 1 (Day 0): The hook. Open the conversation. No pitch. Earn curiosity. Get the reply. NO callbacks to prior conversation, this is the first contact.
- Email 2 (Day 2-3): The proof. Back up email 1's hook with evidence: a specific result, a case study, a data point. Reference the SAME thread as email 1. Do not invent prior conversation. Acceptable openings: a fresh data point, a specific case study line ("Here is what happened with a similar X..."), a clarifying angle. NOT acceptable: "Following up on the X conversation," "that comment about Y," "your team's response."
- Email 3 (Day 5-7): The shift. Change the angle entirely. Catch people who did not resonate with the first angle. Open as if it is a new note from the same sender, not a reply to a phantom conversation.
- Email 4 (Day 10-14): The breakup. Short, human, low-pressure. This consistently gets the highest reply rates because it removes pressure. This is the ONLY email allowed to acknowledge no response ("haven't heard back, closing the loop").

OFFER ARCHITECTURE (use one of these patterns for the offer in each sequence):
- Revenue guarantee: "I will guarantee you {number} {outcome} in {days} days or you don't pay"
- Free work first: "I'll build you a {deliverable} at no cost. Only pay if you love it."
- Free asset: "Just send me {input}. I'll give you a free {deliverable}."
- Audit/assessment: "I'll run a full {type} audit on your {asset}. Completely free."
- Performance system: "I guarantee {number} {outcome} in {days} days. You don't pay unless we hit it."
- Rewrite/improvement: "Send me your last {number} {assets}. I'll rewrite them for free."

Match the offer type to the client's service and the prospect's decision-making level.

FOLLOW-UP RULES:
- Start with ONLY 2 emails in the initial test
- Follow-ups must be SHORT, simple pings, not newsletter-style
- Each follow-up needs a DIFFERENT subject line
- Reformulate the offer briefly, never repeat verbatim
- Human follow-up examples: "Hey {name}, checking in on this. TLDR: {offer}. Let me know."

PERSONALIZATION, COLD READING TECHNIQUE:
- Make statements that SEEM specific but apply to 80%+ of the target audience
- Combine one researched data point with a cold-read observation
- The prospect must think "wait, do I know this person?"
- NEVER use AI-sounding compliments like "love how passionate you are about X at Y"
- Casualize all company names: strip LLC/Inc/Corp, use common abbreviations

TEXT MESSAGE TEST:
- Before finalizing any email, read it as if it were a text message from a stranger
- If it feels like marketing or a mass email, rewrite it
- If it feels like something a real person would actually send to one person, it passes

EXAMPLE, Intent-Based Audience Sequence (the kind of offer this engine is being asked to write for):
SEQUENCE: 4 emails for a B2B agency-owner prospect.
EMAIL 1 SUBJECT: {audience targeting q|quick targeting question|worth 2 min?}
EMAIL 1 BODY (no callbacks, opens cold, on-message about intent-based audiences):
{{firstName}},
{Most agencies running paid|Teams running paid for clients|A lot of media buyers we talk to} are paying full CPM to reach audiences {who haven't shown a single buying signal|with zero intent data|that don't actually need the product yet}.
The audiences that are actually searching, comparing tools, hitting competitor sites, are usually invisible.
What if you could pull THOSE specific people into your retargeting and outbound, by name, before competitors do?
{Worth 2 min to walk through how it works?|Open to seeing the live data?|Curious to see how the matching works?}

EMAIL 2 SUBJECT: {a real example|how this works in practice|same creative, 3x reply}
EMAIL 2 BODY (proof, on the SAME thread, no phantom callback):
{{firstName}},
A {mid-market performance agency|growth agency similar in profile to {{companyName}}|75-person agency we worked with} ran the same creative against two audiences. Standard lookalike vs intent-matched.
Same spend. Same week. Same ads.
Intent-matched audience replied at 3.1x the rate.
The lift came from targeting {people already searching for the category|prospects with documented intent signals|buyers further down the funnel}, not from new creative.
{Want me to show you how the audiences are built?|Open to seeing the targeting layer?|Worth a quick walkthrough?}

EMAIL 3 SUBJECT: {one different angle|missed something|switching gears}
EMAIL 3 BODY (different angle, no phantom callback, on-message):
{{firstName}},
{Different angle|Switching gears|One more thought}: most of the data your DSPs use is 30-90 days stale.
By the time someone shows up in a lookalike, they have already bought (or churned).
{Real-time intent signals|Live searcher data|Same-day buying intent} change which audiences you target this week, not next quarter.
{Want to see what your live audience looks like?|Open to a live pull on your category?|Worth a quick look?}

EMAIL 4 SUBJECT: {closing the loop|last note|moving on}
EMAIL 4 BODY (breakup, the only place "no response" is allowed):
{{firstName}},
Haven't heard back so closing the loop here.
If intent-based audiences become a priority, the {door is open|inbox is open|note stays open}.

EXAMPLE, Pain Agitation Sequence for B2B SaaS Client Targeting VP Marketing:
{
  "step": 1,
  "delay_days": 0,
  "subject_line": "{quick q|{{companyName}} + outbound|thought on pipeline|worth 2 min?}",
  "preview_text": "Most B2B marketing teams are overpaying for leads that never convert.",
  "body": "{{firstName}},\\n\\n{Most B2B marketing teams|A lot of companies at your stage|Teams scaling past $5M ARR} are spending {40-60%|a huge chunk|the majority} of their pipeline budget on paid channels that keep getting more expensive.\\n\\nMeanwhile, {97% of their website visitors|almost all of their site traffic|the vast majority of people hitting their site} leave without ever being identified.\\n\\n{We help companies like {{companyName}} turn that invisible traffic into pipeline|There is a way to capture those visitors and turn them into outbound targets|What if you could identify and reach those visitors directly}.\\n\\n{Worth a quick conversation?|Open to hearing how it works?|Would it make sense to walk you through it?}",
  "word_count": 82,
  "purpose": "Agitate the paid channel cost problem and introduce identity resolution as the alternative",
  "why_it_works": "VP Marketing lives in the world of rising CPAs and shrinking budgets. Leading with the cost pressure they feel daily, then pivoting to the 97% stat, creates a curiosity gap.",
  "spintax_test_notes": "Testing whether leading with the overpaying angle or the invisible traffic angle gets more replies. Also testing CTA directness."
}

OUTPUT FORMAT, THIS IS EXACT:
{
  "sequences": [
    {
      "sequence_name": "string, descriptive name based on the angle",
      "angle": {
        "category": "string, from angle selection",
        "core_insight": "string",
        "emotional_driver": "string"
      },
      "strategy": "1-2 sentences explaining why this sequence will work for this audience",
      "emails": [
        {
          "step": 1,
          "delay_days": 0,
          "subject_line": "string, WITH SPINTAX, 3-5 variants",
          "preview_text": "string, first ~40 chars the prospect sees in inbox preview",
          "body": "string, full email body WITH SPINTAX, under 95 words per variant path",
          "word_count": "number, count of the longest variant path",
          "purpose": "string, what this email is trying to achieve",
          "why_it_works": "string, specific reasoning",
          "spintax_test_notes": "string, what you are testing with the spintax variants"
        }
      ]
    }
  ],
  "global_notes": {
    "deliverability_considerations": "string",
    "personalization_opportunities": "string",
    "ab_test_recommendations": "string",
    "scaling_notes": "string"
  }
}`

// ---------------------------------------------------------------------------
// Sanitizer: defensive cleanup of LLM output before storage
// ---------------------------------------------------------------------------
//
// Two issues we fix at write time even though the prompt forbids them:
//
// 1. Em-dashes (—) and en-dashes (–): hard rule, no exceptions. Replace with
//    a comma or period depending on context. Models still emit them sometimes
//    despite the prompt rule.
//
// 2. Double-brace spintax: {{quick q|hi|hey}} is invalid (the renderer skips
//    it because double braces are merge tags). Normalize to single braces
//    when there is a pipe inside. {{firstName}} (no pipe) stays as a merge
//    tag and is left alone.

function sanitizeText(text: string): string {
  if (!text) return text
  let s = text

  // Normalize double-brace spintax: {{a|b|c}} -> {a|b|c}. Only when there is
  // a pipe inside. Merge tags like {{firstName}} have no pipe, so they pass.
  s = s.replace(/\{\{([^{}]*\|[^{}]*)\}\}/g, '{$1}')

  // Strip em-dashes and en-dashes carefully:
  // 1. After sentence-end punctuation (".—", "!—", "?—") -> just a space.
  // 2. At the start of a line (leading whitespace + dash) -> remove (it was
  //    being used as a bullet or aside).
  // 3. Otherwise -> replace with ", ".
  s = s.replace(/([.!?])\s*[—–]\s*/g, '$1 ')
  s = s.replace(/(^|\n)\s*[—–]\s*/g, '$1')
  s = s.replace(/\s*[—–]\s*/g, ', ')
  // Collapse runs of spaces and any ", ," artifacts created by adjacency.
  s = s.replace(/ {2,}/g, ' ')
  s = s.replace(/,\s*,/g, ',')

  return s
}

function sanitizeSequences(seqs: DraftSequences): DraftSequences {
  return {
    ...seqs,
    sequences: seqs.sequences.map((seq) => ({
      ...seq,
      sequence_name: sanitizeText(seq.sequence_name),
      strategy: sanitizeText(seq.strategy),
      emails: seq.emails.map((email) => ({
        ...email,
        subject_line: sanitizeText(email.subject_line),
        preview_text: email.preview_text ? sanitizeText(email.preview_text) : email.preview_text,
        body: sanitizeText(email.body),
        purpose: email.purpose ? sanitizeText(email.purpose) : email.purpose,
      })),
    })),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim()
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '')
  cleaned = cleaned.replace(/\s*```\s*$/, '')
  return cleaned.trim()
}

function safeParseJSON<T>(raw: string, label: string): T {
  const cleaned = stripMarkdownFences(raw)

  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Fall through
  }

  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0]) as T
    } catch {
      // Fall through
    }
  }

  throw new Error(`${label}: Response is not valid JSON`)
}

// Retry transient Anthropic errors (5xx, 529 overload, 429 rate limit).
async function callAnthropicWithRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 3,
): Promise<T> {
  let lastErr: unknown = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      const status = err?.status ?? err?.response?.status
      const isRetryable = status === 429 || status === 503 || status === 529 || status >= 500
      if (!isRetryable || attempt === maxAttempts) {
        throw err
      }
      const backoffMs = Math.min(1000 * 2 ** (attempt - 1), 8000) + Math.floor(Math.random() * 500)
      // eslint-disable-next-line no-console
      console.warn(`[${label}] Anthropic ${status ?? 'unknown'}, retry ${attempt}/${maxAttempts - 1} in ${backoffMs}ms`)
      await new Promise((r) => setTimeout(r, backoffMs))
    }
  }
  throw lastErr
}

async function callClaude<T>(systemPrompt: string, userMessage: string, label: string, maxTokens = 8192): Promise<T> {
  const client = getAnthropicClient()

  await checkSpendLimit()

  const response = await callAnthropicWithRetry(
    () =>
      client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    label,
  )

  // Track spend
  const usage = response.usage
  if (usage) {
    const cost = usage.input_tokens * INPUT_COST_PER_TOKEN + usage.output_tokens * OUTPUT_COST_PER_TOKEN
    recordSpend(cost)
  }

  if (!response.content || response.content.length === 0) {
    throw new Error(`${label}: Claude API returned unexpected response structure`)
  }

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`${label}: Claude API returned empty content`)
  }

  return safeParseJSON<T>(textBlock.text, label)
}

// ---------------------------------------------------------------------------
// Build copy research context from enrichment data
// ---------------------------------------------------------------------------

function buildCopyResearchContext(icpBrief: EnrichedICPBrief): string {
  const cr = icpBrief.copy_research
  if (!cr) {
    // Fallback: no copy_research available (older enrichment)
    return `No detailed copy research available. Use the ICP brief messaging angles and buyer personas to inform copy decisions.`
  }

  return [
    '<prospect_psychology>',
    `Daily reality: ${cr.prospect_world.daily_reality}`,
    `Current approach: ${cr.prospect_world.current_approach}`,
    `Current tools they use: ${cr.prospect_world.current_tools.join(', ')}`,
    `Trigger events: ${cr.prospect_world.trigger_events.join(', ')}`,
    `Cost of doing nothing: ${cr.prospect_world.status_quo_cost}`,
    `Likely objections: ${cr.prospect_world.objections.join(', ')}`,
    `What winning looks like: ${cr.prospect_world.aspirations}`,
    '</prospect_psychology>',
    '',
    '<messaging_ammunition>',
    `Proof points: ${cr.messaging_ammunition.specific_proof_points.join(' | ')}`,
    `Social proof: ${cr.messaging_ammunition.social_proof_angles.join(' | ')}`,
    `Contrarian hooks: ${cr.messaging_ammunition.contrarian_hooks.join(' | ')}`,
    `Curiosity gaps: ${cr.messaging_ammunition.curiosity_gaps.join(' | ')}`,
    `Pattern interrupts: ${cr.messaging_ammunition.pattern_interrupts.join(' | ')}`,
    `FOMO angles: ${cr.messaging_ammunition.fear_of_missing_out.join(' | ')}`,
    '</messaging_ammunition>',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// CALL 1: Angle Selection
// ---------------------------------------------------------------------------

function buildAngleSelectionMessage(client: OnboardingClient, icpBrief: EnrichedICPBrief): string {
  const personas = icpBrief.buyer_personas
    .map((p) => `- ${p.title} (${p.seniority}, ${p.department}): Pain points: ${p.pain_points.join('; ')}`)
    .join('\n')

  const angles = icpBrief.messaging_angles
    .map((a) => `- ${a.angle_name}: ${a.hook} | Value prop: ${a.value_prop} | Proof: ${a.proof_point}`)
    .join('\n')

  const offering = icpBrief.service_offering || icpBrief.company_summary

  return [
    'Analyze this client and their target prospects, then select the 3 strongest messaging angles.',
    '',
    'CRITICAL: Every angle you pick must reinforce the service_offering below. Do NOT pick angles that drift into generic agency-revenue, partnership-income, or growth narratives unless THAT is literally what the client sells.',
    '',
    '<service_offering>',
    offering,
    '</service_offering>',
    '',
    '<client_company>',
    `Company: ${client.company_name}`,
    `Website: ${client.company_website}`,
    `Industry: ${client.industry}`,
    `What they sell (use THIS, not the company_summary, as the north star): ${offering}`,
    '</client_company>',
    '',
    '<target_prospects>',
    `Ideal buyer: ${icpBrief.ideal_buyer_profile}`,
    `Target industries: ${(client.target_industries || []).join(', ')}`,
    `Target titles: ${(client.target_titles || []).join(', ')}`,
    `Company sizes: ${(client.target_company_sizes || []).join(', ')}`,
    `Geography: ${(client.target_geography || []).join(', ')}`,
    '</target_prospects>',
    '',
    '<buyer_personas>',
    personas,
    '</buyer_personas>',
    '',
    '<existing_messaging_angles>',
    angles,
    '</existing_messaging_angles>',
    '',
    buildCopyResearchContext(icpBrief),
    '',
    '<competitive_landscape>',
    icpBrief.competitive_landscape.join(', '),
    '</competitive_landscape>',
    '',
    `Copy tone preference: ${client.copy_tone || 'Conversational'}`,
    `Primary CTA: ${client.primary_cta || 'Book a call'}`,
  ].join('\n')
}

async function selectAngles(client: OnboardingClient, icpBrief: EnrichedICPBrief): Promise<AngleSelection> {
  const userMessage = buildAngleSelectionMessage(client, icpBrief)
  return callClaude<AngleSelection>(ANGLE_SELECTION_PROMPT, userMessage, 'Angle Selection', 4096)
}

// ---------------------------------------------------------------------------
// CALL 2: Copy Writing
// ---------------------------------------------------------------------------

function buildCopyWritingMessage(
  client: OnboardingClient,
  icpBrief: EnrichedICPBrief,
  angleSelection: AngleSelection
): string {
  const cr = icpBrief.copy_research
  const toneCalibration = cr?.email_specific?.tone_calibration || client.copy_tone || 'Conversational'
  const wordsToAvoid = cr?.email_specific?.words_to_avoid?.join(', ') || 'standard spam trigger words'

  // Hard-prioritize service_offering. Fall back to company_summary for older
  // briefs where service_offering wasn't generated. This is THE message every
  // sequence must reinforce; surface it loudly.
  const offering = icpBrief.service_offering || icpBrief.company_summary

  return [
    'Write 3 cold email sequences for this Cursive AI client\'s outbound campaign.',
    '',
    '<service_offering>',
    'THIS is what the client sells. Every email in every sequence must reinforce THIS specific offer. Do not pivot to generic agency-revenue, partnership-income, or growth narratives.',
    offering,
    '</service_offering>',
    '',
    '<client_company>',
    `Company: ${client.company_name}`,
    `Website: ${client.company_website}`,
    `Service offering (THE message to reinforce): ${offering}`,
    `Company summary (context only, do not pivot to this): ${icpBrief.company_summary}`,
    `Brand voice: ${client.copy_tone || 'Conversational'}`,
    '</client_company>',
    '',
    '<target_prospects>',
    `Ideal buyer: ${icpBrief.ideal_buyer_profile}`,
    `Target industries: ${(client.target_industries || []).join(', ')}`,
    `Target titles: ${(client.target_titles || []).join(', ')}`,
    `Company sizes: ${(client.target_company_sizes || []).join(', ')}`,
    `Geography: ${(client.target_geography || []).join(', ')}`,
    '</target_prospects>',
    '',
    buildCopyResearchContext(icpBrief),
    '',
    '<selected_angles>',
    JSON.stringify(angleSelection.selected_angles, null, 2),
    '</selected_angles>',
    '',
    '<campaign_config>',
    `Sender name(s): ${client.sender_names || '(use generic sender)'}`,
    `Copy tone (client preference): ${client.copy_tone || 'Conversational'}`,
    `Tone calibration (for prospect): ${toneCalibration}`,
    `Primary CTA: ${client.primary_cta || 'Book a call'}`,
    client.calendar_link ? `Calendar link: ${client.calendar_link}` : '',
    `Words to avoid: ${wordsToAvoid}`,
    'Available personalization variables: {{firstName}}, {{companyName}}, {{title}}',
    '</campaign_config>',
    '',
    `Compliance notes: ${client.compliance_disclaimers || 'Standard CAN-SPAM compliance'}`,
    '',
    'Write one sequence per selected angle. Follow every rule in your system prompt. Include spintax in every email. Count your words and stay under 95.',
  ]
    .filter(Boolean)
    .join('\n')
}

async function writeCopy(
  client: OnboardingClient,
  icpBrief: EnrichedICPBrief,
  angleSelection: AngleSelection
): Promise<DraftSequences> {
  const userMessage = buildCopyWritingMessage(client, icpBrief, angleSelection)
  const raw = await callClaude<DraftSequences>(COPY_WRITING_PROMPT, userMessage, 'Copy Writing', 12000)

  // Validate structure
  if (!raw.sequences || !Array.isArray(raw.sequences) || raw.sequences.length === 0) {
    throw new Error('Claude returned no email sequences')
  }

  for (const seq of raw.sequences) {
    if (!seq.sequence_name || !Array.isArray(seq.emails) || seq.emails.length === 0) {
      throw new Error(`Invalid sequence structure: ${seq.sequence_name || 'unnamed'}`)
    }
    for (const email of seq.emails) {
      if (typeof email.step !== 'number' || !email.subject_line || !email.body) {
        throw new Error(`Invalid email in sequence "${seq.sequence_name}": missing step, subject_line, or body`)
      }
    }
  }

  // Sanitize before returning: strips em-dashes, normalizes double-brace spintax.
  const result = sanitizeSequences(raw)

  // Attach angle selection metadata
  return {
    ...result,
    angle_selection: angleSelection,
  }
}

// ---------------------------------------------------------------------------
// Auto-fix: Re-call Claude to fix quality issues
// ---------------------------------------------------------------------------

const FIX_PROMPT = `You are a cold email copy editor. The following cold email sequences have quality issues that must be fixed. Fix ONLY the specific issues listed. Do not rewrite emails that passed. Maintain all spintax. Stay under 95 words per email. Return the complete corrected sequences in the same JSON format.`

async function autoFixSequences(
  sequences: DraftSequences,
  issues: Array<{ sequence_index: number; email_index: number; check: string; detail: string }>
): Promise<DraftSequences> {
  const issueList = issues
    .map((i) => `Sequence ${i.sequence_index + 1}, Email ${i.email_index + 1}: ${i.check} — ${i.detail}`)
    .join('\n')

  const userMessage = [
    'Fix these quality issues in the email sequences:',
    '',
    'Issues:',
    issueList,
    '',
    'Original sequences:',
    JSON.stringify(sequences, null, 2),
  ].join('\n')

  const fixedRaw = await callClaude<DraftSequences>(FIX_PROMPT, userMessage, 'Copy Fix', 12000)
  const fixed = sanitizeSequences(fixedRaw)

  // Preserve metadata from original
  return {
    ...fixed,
    angle_selection: sequences.angle_selection,
    global_notes: fixed.global_notes || sequences.global_notes,
  }
}

// ---------------------------------------------------------------------------
// Regeneration prompt (with learning from previous issues)
// ---------------------------------------------------------------------------

function buildRegenerationMessage(
  client: OnboardingClient,
  icpBrief: EnrichedICPBrief,
  previousSequences: DraftSequences,
  feedback: string
): string {
  const qualityIssues = previousSequences.quality_check?.issues || []
  const qualitySection = qualityIssues.length > 0
    ? [
        '<quality_issues_from_previous_version>',
        qualityIssues.map((i) => `${i.check}: ${i.detail}`).join('\n'),
        '</quality_issues_from_previous_version>',
      ].join('\n')
    : ''

  return [
    'The previous email sequences were rejected. Generate completely new sequences that:',
    '1. Address the rejection feedback',
    '2. Fix all quality issues from the previous version',
    '3. Keep all spintax and deliverability rules',
    '4. Write FRESH copy with new hooks, new proof points, new angles.',
    '',
    '<rejection_feedback>',
    feedback,
    '</rejection_feedback>',
    '',
    qualitySection,
    '',
    '<previous_sequences>',
    JSON.stringify(previousSequences.sequences, null, 2),
    '</previous_sequences>',
    '',
    buildCopyWritingMessage(client, icpBrief, previousSequences.angle_selection || { selected_angles: [] }),
  ]
    .filter(Boolean)
    .join('\n')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate initial email sequences with the two-call pattern:
 * 1. Select angles based on research
 * 2. Write copy using selected angles
 *
 * Optionally runs quality checks and auto-fix (pass qualityChecker).
 */
export async function generateEmailSequences(
  client: OnboardingClient,
  icpBrief: EnrichedICPBrief,
  qualityChecker?: (sequences: DraftSequences) => { passed: boolean; issues: Array<{ sequence_index: number; email_index: number; severity: string; check: string; detail: string }> }
): Promise<DraftSequences> {
  // Call 1: Angle Selection
  const angleSelection = await selectAngles(client, icpBrief)

  // Call 2: Copy Writing
  let sequences = await writeCopy(client, icpBrief, angleSelection)

  // Quality check + auto-fix (if checker provided)
  if (qualityChecker) {
    const firstCheck = qualityChecker(sequences)
    sequences = {
      ...sequences,
      quality_check: { passed: firstCheck.passed, issues: firstCheck.issues as QualityIssue[] },
    }

    if (!firstCheck.passed) {
      const errorIssues = firstCheck.issues.filter((i) => i.severity === 'error')
      if (errorIssues.length > 0) {
        // Attempt auto-fix
        try {
          const fixed = await autoFixSequences(sequences, errorIssues)
          const recheck = qualityChecker(fixed)
          sequences = {
            ...fixed,
            quality_check: { passed: recheck.passed, issues: recheck.issues as QualityIssue[] },
          }
        } catch {
          // Auto-fix failed — keep original with quality issues noted
        }
      }
    }
  }

  return sequences
}

/**
 * Regenerate email sequences incorporating feedback on previous versions.
 */
export async function regenerateEmailSequences(
  client: OnboardingClient,
  icpBrief: EnrichedICPBrief,
  previousSequences: DraftSequences,
  feedback: string,
  qualityChecker?: (sequences: DraftSequences) => { passed: boolean; issues: Array<{ sequence_index: number; email_index: number; severity: string; check: string; detail: string }> }
): Promise<DraftSequences> {
  const userMessage = buildRegenerationMessage(client, icpBrief, previousSequences, feedback)
  const rawSequences = await callClaude<DraftSequences>(COPY_WRITING_PROMPT, userMessage, 'Copy Regeneration', 12000)

  // Sanitize: strip em-dashes, normalize double-brace spintax, before storage.
  const cleanSequences = sanitizeSequences(rawSequences)

  // Preserve angle selection from original (immutable)
  let sequences: DraftSequences = {
    ...cleanSequences,
    angle_selection: previousSequences.angle_selection,
  }

  // Quality check + auto-fix
  if (qualityChecker) {
    const check = qualityChecker(sequences)
    sequences = {
      ...sequences,
      quality_check: { passed: check.passed, issues: check.issues as QualityIssue[] },
    }

    if (!check.passed) {
      const errorIssues = check.issues.filter((i) => i.severity === 'error')
      if (errorIssues.length > 0) {
        try {
          const fixed = await autoFixSequences(sequences, errorIssues)
          const recheck = qualityChecker(fixed)
          sequences = {
            ...fixed,
            quality_check: { passed: recheck.passed, issues: recheck.issues as QualityIssue[] },
          }
        } catch {
          // Keep original with issues
        }
      }
    }
  }

  return sequences
}

// ---------------------------------------------------------------------------
// Per-email regeneration (portal self-serve feedback loop)
// ---------------------------------------------------------------------------
//
// The portal lets the client comment on a specific email step. When they
// click "Apply feedback", we pull the OPEN comments scoped to that email,
// hand them to Claude with the surrounding sequence as coherence context,
// and rewrite ONLY that one email. Every other email in the draft is
// untouched. The endpoint that calls this is responsible for atomically
// patching the email back into draft_sequences.
//
// Why a separate prompt:
//   - We do NOT want Claude rewriting the whole sequence again ($$ + risks
//     breaking the angle the client already accepted).
//   - We need to surface the prior + downstream emails as constraints so
//     callbacks ("as I mentioned in the last email") stay grounded.
//   - The output schema is a SINGLE email object, not the full sequences.

const SINGLE_EMAIL_REVISION_PROMPT = `You are an elite B2B cold email copywriter editing ONE email in a 4-step cold sequence based on direct client feedback. The client owns the brand and gave specific notes. Your job is to revise this single email to address every note while keeping the email coherent with the rest of the sequence.

YOUR HARD RULES:

THE OFFER:
- The user message includes a <service_offering> block. The revised email must reinforce THAT offer. Do not pivot to generic agency-revenue, partnership-income, or growth narratives.

NO EM-DASHES, NO EN-DASHES:
- Never use the em-dash character (—) anywhere. Use commas, periods, parentheses, or two short sentences instead.
- Never use the en-dash character (–) anywhere.
- This is a hard deliverability + human-feel rule. Em-dashes are a known AI tell.

SEQUENCE COHERENCE:
- The user message includes <prior_email> (the email immediately before this one in the sequence) and <downstream_emails> (every email AFTER this one). Your revision must stay coherent with both.
- If a downstream email references a topic, fact, or hook from this email, your revised email must keep that topic/fact/hook intact.
- Do NOT add new callbacks to conversations that did not happen. Only reference content that actually appears in <prior_email>. If this is email step 1 (no prior email), do not callback to anything.
- Do NOT change the core ANGLE of this email if a downstream email builds on it. The client wants the email rewritten, not the angle reworked.

FORMAT RULES:
- Email body under 95 words. Count them.
- Subject line 1-6 words, lowercase casual feel, no clickbait, no exclamation marks.
- Use {{firstName}} and {{companyName}} merge tags only where they read naturally.
- One CTA per email. Short paragraphs (1-2 sentences each). White space.

SPINTAX RULES:
- Use SINGLE-BRACE spintax format only: {option1|option2|option3}
- DOUBLE-BRACE {{ }} is reserved for merge tags ONLY (e.g. {{firstName}}). NEVER put a pipe inside double braces. {{quick q|hi}} is INVALID.
- The revised email MUST include spintax in the subject line (3-5 variants), the opening line (2-3 variants), and the CTA phrasing (2-3 variants). Match the structure of the original email if possible.
- Spintax options must read naturally for ALL combinations and be roughly equal length.

DELIVERABILITY:
- No spam trigger words: free, guarantee, act now, limited time, click here, buy now, discount, etc.
- No ALL CAPS words except acronyms (CEO, SaaS, ROI, B2B, etc.).

ADDRESSING THE FEEDBACK:
- The user message includes a <client_feedback> block with one or more comments from the client.
- You MUST address every distinct piece of feedback. If the client said "make it shorter", make it shorter. If they said "less salesy", rewrite to be less salesy. If they said "use 'audiences' instead of 'segments'", swap the term.
- If two pieces of feedback conflict, follow the more specific one and note the conflict in the why_it_works field.
- Treat the client's word choices as preferences, mirror them in the revised copy when natural.

OUTPUT FORMAT, EXACT:
{
  "step": <number, same as the email being revised>,
  "delay_days": <number, same as before unless feedback explicitly asks to change>,
  "subject_line": "<string, with single-brace spintax, 3-5 variants>",
  "preview_text": "<string, ~40 chars inbox preview>",
  "body": "<string, full email body with spintax, under 95 words per variant path>",
  "word_count": <number, count of the longest variant path>,
  "purpose": "<string, what this email is trying to achieve>",
  "why_it_works": "<string, specific reasoning AND a one-line summary of how you addressed each piece of feedback>",
  "spintax_test_notes": "<string, what you are testing with the spintax variants>"
}

Return ONLY the JSON object. No prose, no markdown fences, no preamble.`

interface OpenComment {
  body: string
  author_type: 'admin' | 'client' | string
  author_name?: string | null
  created_at?: string
}

function buildSingleEmailRevisionMessage(args: {
  client: OnboardingClient
  icpBrief: EnrichedICPBrief
  sequences: DraftSequences
  sequenceIndex: number
  emailStep: number
  comments: OpenComment[]
}): string {
  const { client, icpBrief, sequences, sequenceIndex, emailStep, comments } = args
  const sequence = sequences.sequences[sequenceIndex]
  if (!sequence) throw new Error(`Sequence index ${sequenceIndex} out of range`)
  const emails = [...sequence.emails].sort((a, b) => a.step - b.step)
  const targetIdx = emails.findIndex((e) => e.step === emailStep)
  if (targetIdx === -1) throw new Error(`Email step ${emailStep} not found in sequence ${sequenceIndex}`)
  const target = emails[targetIdx]
  const priorEmail = targetIdx > 0 ? emails[targetIdx - 1] : null
  const downstreamEmails = emails.slice(targetIdx + 1)

  const offering = icpBrief.service_offering || icpBrief.company_summary

  const feedbackBlock =
    comments.length === 0
      ? '(No comments provided. Improve the email overall while preserving its purpose and angle.)'
      : comments
          .map((c, i) => `${i + 1}. [${c.author_type}${c.author_name ? `: ${c.author_name}` : ''}] ${c.body}`)
          .join('\n')

  return [
    'Revise the targeted email below based on the client feedback. Keep the angle, keep the sequence coherent, and address every comment.',
    '',
    '<service_offering>',
    offering,
    '</service_offering>',
    '',
    '<client_company>',
    `Company: ${client.company_name}`,
    `Service offering (THE message to reinforce): ${offering}`,
    `Brand voice: ${client.copy_tone || 'Conversational'}`,
    `Primary CTA: ${client.primary_cta || 'Book a call'}`,
    '</client_company>',
    '',
    '<target_prospects>',
    `Ideal buyer: ${icpBrief.ideal_buyer_profile}`,
    `Target titles: ${(client.target_titles || []).join(', ')}`,
    '</target_prospects>',
    '',
    '<sequence_context>',
    `Sequence name: ${sequence.sequence_name}`,
    `Strategy: ${sequence.strategy}`,
    `This is email step ${target.step} of ${emails.length}.`,
    '</sequence_context>',
    '',
    priorEmail
      ? [
          '<prior_email>',
          `Step ${priorEmail.step} subject: ${priorEmail.subject_line}`,
          `Step ${priorEmail.step} body:`,
          priorEmail.body,
          '</prior_email>',
        ].join('\n')
      : '<prior_email>(none, this is the first email in the sequence)</prior_email>',
    '',
    '<email_to_revise>',
    `Step: ${target.step}`,
    `Delay days: ${target.delay_days}`,
    `Current subject line: ${target.subject_line}`,
    target.preview_text ? `Current preview text: ${target.preview_text}` : '',
    'Current body:',
    target.body,
    '</email_to_revise>',
    '',
    downstreamEmails.length > 0
      ? [
          '<downstream_emails>',
          'These come AFTER the email you are revising. Stay coherent with them, do not break callbacks they make to the email you are revising.',
          ...downstreamEmails.map((e) => `--- Step ${e.step} ---\nSubject: ${e.subject_line}\nBody:\n${e.body}`),
          '</downstream_emails>',
        ].join('\n')
      : '<downstream_emails>(none)</downstream_emails>',
    '',
    '<client_feedback>',
    'These are the OPEN comments from the client on this specific email. Address every one in your revision.',
    feedbackBlock,
    '</client_feedback>',
    '',
    'Return ONLY the JSON object for the revised single email. No prose, no markdown fences.',
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Revise ONE email in an existing sequence based on client feedback comments.
 * Returns just the revised email object, the caller is responsible for
 * splicing it back into draft_sequences atomically.
 *
 * Throws on Claude failure or invalid response shape.
 */
export async function regenerateSingleEmail(args: {
  client: OnboardingClient
  icpBrief: EnrichedICPBrief
  sequences: DraftSequences
  sequenceIndex: number
  emailStep: number
  comments: OpenComment[]
}): Promise<{
  step: number
  delay_days: number
  subject_line: string
  body: string
  preview_text?: string
  word_count?: number
  purpose: string
  why_it_works?: string
  spintax_test_notes?: string
}> {
  const userMessage = buildSingleEmailRevisionMessage(args)
  const raw = await callClaude<{
    step: number
    delay_days: number
    subject_line: string
    body: string
    preview_text?: string
    word_count?: number
    purpose?: string
    why_it_works?: string
    spintax_test_notes?: string
  }>(SINGLE_EMAIL_REVISION_PROMPT, userMessage, 'Single Email Revision', 4096)

  // Validate
  if (typeof raw.step !== 'number' || !raw.subject_line || !raw.body) {
    throw new Error('Single email revision response missing step, subject_line, or body')
  }
  if (raw.step !== args.emailStep) {
    // Defensive, Claude must keep the same step number
    raw.step = args.emailStep
  }

  // Sanitize: strip em-dashes, normalize double-brace spintax.
  return {
    step: raw.step,
    delay_days: typeof raw.delay_days === 'number' ? raw.delay_days : 0,
    subject_line: sanitizeText(raw.subject_line),
    body: sanitizeText(raw.body),
    preview_text: raw.preview_text ? sanitizeText(raw.preview_text) : undefined,
    word_count: raw.word_count,
    purpose: raw.purpose ? sanitizeText(raw.purpose) : '',
    why_it_works: raw.why_it_works ? sanitizeText(raw.why_it_works) : undefined,
    spintax_test_notes: raw.spintax_test_notes,
  }
}
