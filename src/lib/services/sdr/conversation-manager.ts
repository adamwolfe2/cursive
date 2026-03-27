/**
 * Conversation Manager
 * Manages conversation state machine and multi-turn intelligence for the AI SDR.
 */

import type { ConversationStage } from '@/types/sdr'
import { CONVERSATION_STAGE_TRANSITIONS } from '@/types/sdr'

// ---------------------------------------------------------------------------
// Stop words for keyword extraction
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'are',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'not',
  'no', 'so', 'if', 'then', 'than', 'that', 'this', 'these', 'those',
  'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your', 'he', 'she',
  'him', 'her', 'his', 'they', 'them', 'their', 'what', 'which', 'who',
  'how', 'when', 'where', 'why', 'all', 'each', 'every', 'any', 'few',
  'more', 'most', 'some', 'such', 'only', 'just', 'also', 'very',
  'about', 'up', 'out', 'get', 'got', 'its', 'let', 'like', 'well',
  'know', 'think', 'here', 'there', 'now', 'way', 'make', 'much',
  'said', 'say', 'hi', 'hey', 'hello', 'thanks', 'thank', 'please',
  'yes', 'yeah', 'sure', 'ok', 'okay', 'great', 'good', 're', 'im',
])

// ---------------------------------------------------------------------------
// Scheduling intent patterns
// ---------------------------------------------------------------------------

const SCHEDULING_PATTERNS = [
  'hop on a call',
  'jump on a call',
  'set up a call',
  'set up a meeting',
  'schedule a call',
  'schedule a meeting',
  'book a call',
  'book a meeting',
  'send me times',
  'send me your availability',
  'what times work',
  'what time works',
  "what's your calendar",
  "what's your availability",
  'when are you free',
  'when are you available',
  'free for a chat',
  'free for a call',
  'grab a time',
  'pick a time',
  'happy to chat',
  'happy to hop on',
  'love to chat',
  'love to hop on',
  "let's connect",
  "let's talk",
  'open to a quick call',
  'down for a call',
  'calendly',
  'cal.com',
]

// ---------------------------------------------------------------------------
// Meeting confirmation patterns
// ---------------------------------------------------------------------------

const MEETING_CONFIRMATION_PATTERNS = [
  'booked',
  'confirmed',
  'see you then',
  'see you at',
  'looking forward to the call',
  'looking forward to our call',
  'looking forward to the meeting',
  'meeting is set',
  'call is set',
  'on my calendar',
  'added to my calendar',
  'got it on the calendar',
  'calendar invite',
  'invite sent',
  'accepted the invite',
]

// ---------------------------------------------------------------------------
// Stage Transition Detection
// ---------------------------------------------------------------------------

interface StageTransitionResult {
  readonly newStage: ConversationStage
  readonly reason: string
}

export function detectStageTransition(params: {
  readonly currentStage: ConversationStage
  readonly replyBody: string
  readonly sentiment: string
  readonly intentScore: number
  readonly turnCount: number
}): StageTransitionResult | null {
  const { currentStage, replyBody, sentiment, intentScore, turnCount } = params

  // Terminal stages — no transitions allowed
  if (currentStage === 'closed' || currentStage === 'lost') {
    return null
  }

  // Negative / unsubscribe → lost (valid from any non-terminal stage)
  if (sentiment === 'negative' || sentiment === 'unsubscribe' || sentiment === 'not_interested') {
    const allowed = CONVERSATION_STAGE_TRANSITIONS[currentStage]
    if (allowed.includes('lost')) {
      return { newStage: 'lost', reason: `Prospect expressed ${sentiment}` }
    }
    return null
  }

  // Meeting confirmation → booked
  if (detectMeetingConfirmation(replyBody)) {
    const allowed = CONVERSATION_STAGE_TRANSITIONS[currentStage]
    if (allowed.includes('booked')) {
      return { newStage: 'booked', reason: 'Meeting confirmation detected' }
    }
    // If we can't go directly to booked, try scheduling first
    if (allowed.includes('scheduling')) {
      return { newStage: 'scheduling', reason: 'Scheduling signals detected before booking' }
    }
    return null
  }

  // Scheduling intent → scheduling
  if (detectSchedulingIntent(replyBody)) {
    const allowed = CONVERSATION_STAGE_TRANSITIONS[currentStage]
    if (allowed.includes('scheduling')) {
      return { newStage: 'scheduling', reason: 'Prospect expressed scheduling intent' }
    }
    return null
  }

  // High intent or questions with engagement → qualifying
  if (intentScore >= 6 && (sentiment === 'question' || sentiment === 'positive')) {
    const allowed = CONVERSATION_STAGE_TRANSITIONS[currentStage]
    if (allowed.includes('qualifying')) {
      return { newStage: 'qualifying', reason: `High-intent ${sentiment} reply (score: ${intentScore})` }
    }
  }

  // Any positive engagement from 'new' → engaged
  if (currentStage === 'new' && (sentiment === 'positive' || sentiment === 'question' || sentiment === 'neutral')) {
    const allowed = CONVERSATION_STAGE_TRANSITIONS[currentStage]
    if (allowed.includes('engaged')) {
      return { newStage: 'engaged', reason: `Prospect replied with ${sentiment} sentiment` }
    }
  }

  // Multi-turn engagement when already engaged → qualifying
  if (currentStage === 'engaged' && turnCount >= 2 && intentScore >= 4) {
    const allowed = CONVERSATION_STAGE_TRANSITIONS[currentStage]
    if (allowed.includes('qualifying')) {
      return { newStage: 'qualifying', reason: `Multi-turn engagement (${turnCount} turns, score: ${intentScore})` }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Escalation Detection
// ---------------------------------------------------------------------------

interface EscalationResult {
  readonly escalate: boolean
  readonly reason: string
}

export function shouldEscalate(params: {
  readonly turnCount: number
  readonly maxAiTurns: number
  readonly escalationAfterTurns: number
  readonly sentiment: string
  readonly confidence: number
}): EscalationResult {
  const { turnCount, maxAiTurns, escalationAfterTurns, sentiment, confidence } = params

  // Turn limit reached
  if (turnCount >= escalationAfterTurns) {
    return {
      escalate: true,
      reason: `AI turn limit reached (${turnCount}/${escalationAfterTurns})`,
    }
  }

  // Exceeds max AI turns — hard stop
  if (turnCount >= maxAiTurns) {
    return {
      escalate: true,
      reason: `Max AI turns exceeded (${turnCount}/${maxAiTurns})`,
    }
  }

  // Low confidence on reply generation
  if (confidence < 0.5) {
    return {
      escalate: true,
      reason: `Low confidence on reply generation (${confidence})`,
    }
  }

  // Repeated negative sentiment should trigger handoff
  if (sentiment === 'negative') {
    return {
      escalate: true,
      reason: 'Negative sentiment detected — human review recommended',
    }
  }

  return { escalate: false, reason: '' }
}

// ---------------------------------------------------------------------------
// Keyword Extraction
// ---------------------------------------------------------------------------

export function extractKeywords(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const words = cleaned.split(' ')

  const keywords = words
    .filter((word) => word.length >= 3)
    .filter((word) => !STOP_WORDS.has(word))

  // Deduplicate while preserving order
  const seen = new Set<string>()
  const unique: string[] = []
  for (const word of keywords) {
    if (!seen.has(word)) {
      seen.add(word)
      unique.push(word)
    }
  }

  return unique.slice(0, 20)
}

// ---------------------------------------------------------------------------
// Scheduling Intent Detection
// ---------------------------------------------------------------------------

export function detectSchedulingIntent(text: string): boolean {
  const lower = text.toLowerCase()
  return SCHEDULING_PATTERNS.some((pattern) => lower.includes(pattern))
}

// ---------------------------------------------------------------------------
// Meeting Confirmation Detection
// ---------------------------------------------------------------------------

export function detectMeetingConfirmation(text: string): boolean {
  const lower = text.toLowerCase()
  return MEETING_CONFIRMATION_PATTERNS.some((pattern) => lower.includes(pattern))
}
