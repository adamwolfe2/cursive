// Cold Email Best Practices Knowledge Base
// Curated database of cold email strategies, tips, and templates

import type { ColdEmailBestPractice, SpintaxTemplate } from './types'

/**
 * Core cold email best practices
 * These are used to train and guide the AI campaign builder
 */
export const COLD_EMAIL_BEST_PRACTICES: ColdEmailBestPractice[] = [
  // SUBJECT LINES
  {
    id: 'subject-1',
    category: 'subject_line',
    title: 'Keep subject lines under 50 characters',
    content:
      'Short subject lines have higher open rates. Mobile devices truncate at ~40 chars. Get to the point fast.',
    examples: [
      'Quick question about {{company}}',
      '{{firstName}}, saw your post',
      'Idea for {{company}}',
    ],
    doList: [
      'Use lowercase (feels personal)',
      'Include their name or company',
      'Create curiosity without clickbait',
    ],
    dontList: [
      "Use ALL CAPS or excessive punctuation!!!",
      'Include spam trigger words (free, guaranteed, act now)',
      'Make false promises',
    ],
    tags: ['subject', 'open-rate', 'deliverability'],
    priority: 10,
  },
  {
    id: 'subject-2',
    category: 'subject_line',
    title: 'Personalization in subject lines',
    content:
      'Subject lines with personalization (name, company, recent event) have 26% higher open rates.',
    examples: [
      '{{firstName}} - quick thought on {{recentNews}}',
      "Loved {{company}}'s approach to X",
      're: {{company}} + [Your Company]',
    ],
    doList: ['Reference something specific', 'Use merge tags correctly', 'Test variations'],
    dontList: ['Over-personalize (feels creepy)', 'Use generic personalization'],
    tags: ['subject', 'personalization', 'open-rate'],
    priority: 9,
  },
  {
    id: 'subject-3',
    category: 'subject_line',
    title: "Avoid spam trigger words",
    content:
      'Certain words trigger spam filters. Avoid: free, guarantee, act now, limited time, winner, congratulations, urgent.',
    examples: [],
    doList: ['Use natural language', 'Write like a colleague would'],
    dontList: [
      'Use promotional language',
      'Add RE: or FW: to fake replies',
      'Use excessive emojis',
    ],
    tags: ['subject', 'deliverability', 'spam'],
    priority: 10,
  },

  // OPENING LINES
  {
    id: 'opening-1',
    category: 'opening_line',
    title: 'Pattern-interrupt openers',
    content:
      'Start with something unexpected that breaks the typical cold email pattern. Avoid "I hope this email finds you well" at all costs.',
    examples: [
      'Saw your comment about X on LinkedIn - couldn\'t agree more.',
      'Quick question (I promise this isn\'t another generic pitch):',
      'Most {{jobTitle}}s I talk to are dealing with X. Sound familiar?',
    ],
    doList: [
      'Reference something specific to them',
      'Ask a thought-provoking question',
      'State a contrarian opinion',
    ],
    dontList: [
      'Use generic openers',
      "Start with 'My name is...'",
      "Lead with your company's story",
    ],
    tags: ['opening', 'engagement', 'personalization'],
    priority: 10,
  },
  {
    id: 'opening-2',
    category: 'opening_line',
    title: 'Research-based openers',
    content:
      'Reference something specific you found about them: recent podcast, article, company news, LinkedIn post. Shows you did your homework.',
    examples: [
      'Just listened to your episode on [Podcast] - your take on X was spot on.',
      "Congrats on the Series B! Sounds like you're scaling fast.",
      'Noticed {{company}} just expanded to {{location}} - exciting times.',
    ],
    doList: ['Be specific', 'Be genuine', 'Connect it to your reason for reaching out'],
    dontList: ['Fake familiarity', 'Use obviously templated compliments'],
    tags: ['opening', 'personalization', 'research'],
    priority: 9,
  },

  // BODY STRUCTURE
  {
    id: 'body-1',
    category: 'body_structure',
    title: 'Keep emails under 100 words',
    content:
      'Shorter emails get more replies. Aim for 50-100 words for initial emails, even shorter for follow-ups. Every word must earn its place.',
    examples: [],
    doList: [
      'Use short sentences',
      'Break into 2-3 short paragraphs',
      'Remove filler words',
    ],
    dontList: ['Write walls of text', 'Include your full company history', 'Over-explain'],
    tags: ['body', 'length', 'engagement'],
    priority: 10,
  },
  {
    id: 'body-2',
    category: 'body_structure',
    title: 'Focus on THEM, not you',
    content:
      'Use "you" more than "I" or "we". The email should be about their problems, not your solution. Lead with value.',
    examples: [
      'You might be dealing with X...',
      'Companies like yours typically see Y...',
      'If you\'re anything like other {{jobTitle}}s...',
    ],
    doList: ['Lead with their pain point', 'Show you understand their world', 'Offer insight'],
    dontList: [
      "Lead with 'I wanted to reach out...'",
      'List all your features',
      'Talk about awards',
    ],
    tags: ['body', 'value', 'engagement'],
    priority: 9,
  },
  {
    id: 'body-3',
    category: 'body_structure',
    title: 'One idea per email',
    content:
      "Don't try to say everything. Each email should have ONE clear purpose and ONE ask. Complexity kills replies.",
    examples: [],
    doList: ['Pick one angle', 'Make one clear ask', 'Save other points for follow-ups'],
    dontList: ['Cram multiple CTAs', 'Share your entire value prop', 'Attach documents'],
    tags: ['body', 'clarity', 'cta'],
    priority: 8,
  },

  // CTA
  {
    id: 'cta-1',
    category: 'cta',
    title: 'Low-friction CTAs',
    content:
      'Make it easy to say yes. Don\'t ask for a 30-min call right away. Start with a micro-commitment.',
    examples: [
      'Worth a quick chat?',
      'Open to learning more?',
      'Would a 2-min Loom be helpful?',
      'Mind if I share how we helped [similar company]?',
    ],
    doList: [
      'Make it easy to say yes',
      'Offer multiple response options',
      'Ask yes/no questions',
    ],
    dontList: [
      'Ask for 30 minutes immediately',
      'Send calendar links in first email',
      'Be vague about next steps',
    ],
    tags: ['cta', 'conversion', 'engagement'],
    priority: 10,
  },
  {
    id: 'cta-2',
    category: 'cta',
    title: 'Single CTA per email',
    content:
      'Multiple CTAs reduce response rates. Give them ONE clear action to take. Decision paralysis is real.',
    examples: [
      'Would Thursday or Friday work better for a quick call?',
      'Interested in seeing how this works?',
    ],
    doList: ['Be specific', 'Make it a question', 'Give binary choices'],
    dontList: ['Offer 5 different next steps', 'Be wishy-washy', 'End without an ask'],
    tags: ['cta', 'clarity', 'conversion'],
    priority: 9,
  },

  // FOLLOW-UPS
  {
    id: 'followup-1',
    category: 'followup',
    title: '3-4 follow-ups minimum',
    content:
      '80% of sales require 5+ touchpoints. Most people give up after 1-2. Follow up at least 3-4 times before moving on.',
    examples: [],
    doList: [
      'Space them 3-4 days apart',
      'Add new value each time',
      'Change the angle',
    ],
    dontList: [
      'Just bump the thread',
      'Be apologetic',
      'Send more than 1 per day',
    ],
    tags: ['followup', 'persistence', 'sequence'],
    priority: 9,
  },
  {
    id: 'followup-2',
    category: 'followup',
    title: 'Progressively shorter follow-ups',
    content:
      'Each follow-up should be shorter than the last. By email 3-4, you should be under 50 words.',
    examples: [
      "Hey {{firstName}}, any thoughts on my last note?",
      'Still interested in chatting about X?',
      'Should I close the loop on this?',
    ],
    doList: [
      'Keep it brief',
      'Assume they saw previous emails',
      'Add a new hook or angle',
    ],
    dontList: ['Repeat the entire first email', 'Be passive-aggressive', 'Give up too early'],
    tags: ['followup', 'length', 'sequence'],
    priority: 8,
  },
  {
    id: 'followup-3',
    category: 'followup',
    title: 'The breakup email',
    content:
      'Last email in sequence should be a "breakup" that creates FOMO. Often gets the highest reply rate.',
    examples: [
      "Haven't heard back, so I'll assume the timing isn't right. Feel free to reach out if things change.",
      'Closing the loop - should I check back in a few months instead?',
      "Looks like this isn't a priority right now. I'll stop reaching out, but my door's always open.",
    ],
    doList: ['Be gracious', 'Leave the door open', 'Create subtle FOMO'],
    dontList: ['Be guilt-trippy', 'Burn bridges', 'Actually disappear forever'],
    tags: ['followup', 'breakup', 'sequence'],
    priority: 8,
  },

  // DELIVERABILITY
  {
    id: 'deliverability-1',
    category: 'deliverability',
    title: 'Warm up new email accounts',
    content:
      'New email accounts need 2-4 weeks of warmup before sending at scale. Start with 10-20 emails/day, gradually increase.',
    examples: [],
    doList: [
      'Use warmup tools',
      'Start slow (10-20/day)',
      'Send to engaged recipients first',
    ],
    dontList: [
      'Blast from new accounts',
      'Send 100+ emails day one',
      'Ignore bounce rates',
    ],
    tags: ['deliverability', 'warmup', 'setup'],
    priority: 10,
  },
  {
    id: 'deliverability-2',
    category: 'deliverability',
    title: 'Avoid links in first email',
    content:
      'Links, especially tracking links, increase spam likelihood. Keep first touch link-free when possible.',
    examples: [],
    doList: [
      'Reply with links after engagement',
      'Use plain text when possible',
      'If needed, use 1 link max',
    ],
    dontList: [
      'Include tracking pixels',
      'Add multiple links',
      'Use URL shorteners',
    ],
    tags: ['deliverability', 'links', 'spam'],
    priority: 9,
  },

  // SPINTAX
  {
    id: 'spintax-1',
    category: 'spintax',
    title: 'Use spintax for uniqueness',
    content:
      'Spintax creates variations to avoid spam filters detecting identical emails. Use {option1|option2|option3} format.',
    examples: [
      '{Hey|Hi|Hello} {{firstName}},',
      'I {noticed|saw|came across} {your post|your article|something you wrote}',
      '{Would you be open to|Are you interested in|Any chance you\'d consider} a {quick call|brief chat|short conversation}?',
    ],
    doList: [
      'Vary greetings and transitions',
      'Create 2-3 options per phrase',
      'Keep meaning identical',
    ],
    dontList: [
      'Change core message',
      'Make options too different',
      'Overuse (becomes unreadable)',
    ],
    tags: ['spintax', 'deliverability', 'variation'],
    priority: 7,
  },

  // OFFER
  {
    id: 'offer-1',
    category: 'offer',
    title: 'Lead with value, not pitch',
    content:
      'Offer something valuable before asking for anything. A helpful insight, relevant resource, or interesting observation.',
    examples: [
      'We analyzed 100 companies in your space and found...',
      'Thought this benchmark data might be useful for {{company}}:',
      "Here's what we're seeing work for other {{industry}} companies:",
    ],
    doList: [
      'Share relevant insights',
      'Offer free audits/assessments',
      'Provide social proof',
    ],
    dontList: [
      'Lead with your pitch',
      'Ask for time without giving value',
      'Be transactional',
    ],
    tags: ['offer', 'value', 'positioning'],
    priority: 9,
  },
  {
    id: 'offer-2',
    category: 'offer',
    title: 'Make offers specific and time-bound',
    content:
      'Vague offers get ignored. Be specific about what they get and create urgency without being sleazy.',
    examples: [
      'Free 15-min audit of your current setup',
      'Complimentary benchmark report (usually $500)',
      'Exclusive access to our beta (only taking 10 companies this month)',
    ],
    doList: [
      'Quantify the value',
      'Add scarcity when genuine',
      'Make it tangible',
    ],
    dontList: [
      'Be vague ("let me know if interested")',
      'Fake urgency',
      'Over-promise',
    ],
    tags: ['offer', 'specificity', 'urgency'],
    priority: 8,
  },

  // PERSONALIZATION
  {
    id: 'personalization-1',
    category: 'personalization',
    title: 'Deep personalization beats mail merge',
    content:
      "Anyone can add {{firstName}}. Real personalization shows you've done research. Reference something unique to them.",
    examples: [
      'Your take on [specific topic] in [podcast/post] resonated...',
      "Noticed {{company}} just [specific event]...",
      'Saw you previously worked at [company] - we helped them with X...',
    ],
    doList: [
      'Reference specific content',
      'Connect to mutual interests',
      'Show genuine research',
    ],
    dontList: [
      'Rely only on basic merge tags',
      'Use generic compliments',
      'Be creepy-specific',
    ],
    tags: ['personalization', 'research', 'engagement'],
    priority: 9,
  },

  // TIMING
  {
    id: 'timing-1',
    category: 'timing',
    title: 'Best send times',
    content:
      'Tuesday-Thursday, 8-10am or 2-4pm in recipient timezone typically performs best. Test for your specific audience.',
    examples: [],
    doList: [
      'Send in their timezone',
      'Test different times',
      'Avoid Monday mornings and Friday afternoons',
    ],
    dontList: ['Send at midnight', 'Blast everyone at once', 'Ignore time zones'],
    tags: ['timing', 'send-time', 'optimization'],
    priority: 7,
  },
]

/**
 * Spintax templates for common phrases
 */
export const SPINTAX_TEMPLATES: SpintaxTemplate[] = [
  // Greetings
  {
    id: 'greet-1',
    category: 'greeting',
    original: 'Hey {{firstName}},',
    spintax: '{Hey|Hi|Hello} {{firstName}},',
    context: 'Casual, friendly greeting',
  },
  {
    id: 'greet-2',
    category: 'greeting',
    original: 'Hi {{firstName}},',
    spintax: '{Hi|Hello|Hey} {{firstName}},',
    context: 'Professional greeting',
  },

  // Opening transitions
  {
    id: 'open-1',
    category: 'opening',
    original: 'I noticed',
    spintax: '{I noticed|I saw|I came across}',
  },
  {
    id: 'open-2',
    category: 'opening',
    original: 'I wanted to reach out',
    spintax: '{I wanted to reach out|I thought I\'d reach out|Reaching out}',
  },

  // Transitions
  {
    id: 'trans-1',
    category: 'transition',
    original: 'That said,',
    spintax: '{That said,|With that in mind,|That being said,}',
  },
  {
    id: 'trans-2',
    category: 'transition',
    original: 'Because of this,',
    spintax: '{Because of this,|For that reason,|That\'s why}',
  },

  // CTAs
  {
    id: 'cta-1',
    category: 'cta',
    original: 'Would you be open to a quick call?',
    spintax:
      '{Would you be open to|Any interest in|Are you up for} {a quick call|a brief chat|hopping on a call}?',
  },
  {
    id: 'cta-2',
    category: 'cta',
    original: 'Worth exploring?',
    spintax: '{Worth exploring?|Worth a conversation?|Make sense to chat?}',
  },

  // Sign-offs
  {
    id: 'sign-1',
    category: 'signoff',
    original: 'Best,',
    spintax: '{Best,|Cheers,|Thanks,}',
  },
  {
    id: 'sign-2',
    category: 'signoff',
    original: 'Looking forward to hearing from you.',
    spintax:
      '{Looking forward to hearing from you.|Let me know what you think.|Hope to hear from you soon.}',
  },
]

/**
 * Get best practices by category
 */
export function getBestPracticesByCategory(
  category: ColdEmailBestPractice['category']
): ColdEmailBestPractice[] {
  return COLD_EMAIL_BEST_PRACTICES.filter((bp) => bp.category === category).sort(
    (a, b) => b.priority - a.priority
  )
}

/**
 * Get all best practices sorted by priority
 */
export function getAllBestPractices(): ColdEmailBestPractice[] {
  return [...COLD_EMAIL_BEST_PRACTICES].sort((a, b) => b.priority - a.priority)
}

/**
 * Get spintax templates by category
 */
export function getSpintaxTemplates(
  category?: SpintaxTemplate['category']
): SpintaxTemplate[] {
  if (category) {
    return SPINTAX_TEMPLATES.filter((t) => t.category === category)
  }
  return SPINTAX_TEMPLATES
}
