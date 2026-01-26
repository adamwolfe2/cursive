/**
 * Claude AI Service
 * Cursive Platform
 *
 * Provides AI-powered enrichment, analysis, and content generation
 * using Anthropic's Claude API.
 */

import Anthropic from '@anthropic-ai/sdk'

// Lazy initialization to avoid issues during build
let anthropicClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

// ============================================================================
// TYPES
// ============================================================================

export interface CompanyAnalysis {
  summary: string
  industry: string
  businessModel: string
  targetMarket: string
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  keywords: string[]
  painPoints: string[]
  buyingSignals: string[]
  competitors: string[]
  idealOutreachTiming: string
  recommendedApproach: string
  confidenceScore: number
}

export interface LeadQualificationResult {
  score: number // 0-100
  tier: 'hot' | 'warm' | 'cold' | 'unqualified'
  reasons: string[]
  missingData: string[]
  nextBestAction: string
  idealContactMethod: 'email' | 'phone' | 'linkedin' | 'sms'
  personalizedOpener: string
  objectionHandlers: Record<string, string>
}

export interface EmailDraft {
  subject: string
  body: string
  callToAction: string
  followUpTiming: string
  alternativeSubjects: string[]
}

export interface CompanyResearchResult {
  companyName: string
  description: string
  industry: string
  products: string[]
  services: string[]
  targetCustomers: string
  companySize: string
  foundedYear: number | null
  headquarters: string | null
  keyPeople: Array<{
    name: string
    title: string
    linkedIn?: string
  }>
  recentNews: string[]
  techStack: string[]
  socialProfiles: {
    linkedin?: string
    twitter?: string
    facebook?: string
  }
  confidenceScore: number
}

// ============================================================================
// COMPANY ANALYSIS
// ============================================================================

/**
 * Analyze a company using AI to extract insights for sales
 */
export async function analyzeCompany(
  companyData: {
    name: string
    domain?: string
    description?: string
    industry?: string
    websiteContent?: string
  }
): Promise<CompanyAnalysis> {
  const client = getClient()

  const prompt = `You are a B2B sales intelligence analyst. Analyze this company and provide actionable sales insights.

Company Information:
- Name: ${companyData.name}
- Domain: ${companyData.domain || 'Unknown'}
- Industry: ${companyData.industry || 'Unknown'}
- Description: ${companyData.description || 'Not provided'}

${companyData.websiteContent ? `Website Content:\n${companyData.websiteContent.slice(0, 4000)}` : ''}

Provide a JSON response with the following structure:
{
  "summary": "2-3 sentence summary of the company",
  "industry": "Primary industry classification",
  "businessModel": "B2B, B2C, B2B2C, etc.",
  "targetMarket": "Who they sell to",
  "companySize": "startup|small|medium|large|enterprise",
  "keywords": ["relevant", "keywords", "for", "targeting"],
  "painPoints": ["likely", "pain", "points"],
  "buyingSignals": ["indicators", "they", "might", "buy"],
  "competitors": ["likely", "competitors"],
  "idealOutreachTiming": "Best time/situation to reach out",
  "recommendedApproach": "How to approach this company",
  "confidenceScore": 0.85
}

Respond ONLY with valid JSON, no additional text.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  if (!response.content || response.content.length === 0) {
    throw new Error('Empty response from Claude API')
  }

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  try {
    return JSON.parse(content.text) as CompanyAnalysis
  } catch {
    // If parsing fails, return a structured default
    return {
      summary: content.text.slice(0, 200),
      industry: companyData.industry || 'Unknown',
      businessModel: 'Unknown',
      targetMarket: 'Unknown',
      companySize: 'medium',
      keywords: [],
      painPoints: [],
      buyingSignals: [],
      competitors: [],
      idealOutreachTiming: 'During business hours',
      recommendedApproach: 'Professional email outreach',
      confidenceScore: 0.3,
    }
  }
}

// ============================================================================
// LEAD QUALIFICATION
// ============================================================================

/**
 * AI-powered lead qualification and scoring
 */
export async function qualifyLead(
  leadData: {
    companyName: string
    companyDomain?: string
    industry?: string
    companySize?: string
    contactName?: string
    contactTitle?: string
    contactEmail?: string
    location?: string
    technologies?: string[]
    intentSignals?: string[]
  },
  idealCustomerProfile: {
    targetIndustries: string[]
    targetCompanySize: string[]
    targetTitles: string[]
    targetLocations: string[]
    requiredTechnologies?: string[]
  }
): Promise<LeadQualificationResult> {
  const client = getClient()

  const prompt = `You are a B2B lead qualification expert. Score and qualify this lead against the Ideal Customer Profile (ICP).

Lead Information:
- Company: ${leadData.companyName}
- Domain: ${leadData.companyDomain || 'Unknown'}
- Industry: ${leadData.industry || 'Unknown'}
- Company Size: ${leadData.companySize || 'Unknown'}
- Contact: ${leadData.contactName || 'Unknown'}
- Title: ${leadData.contactTitle || 'Unknown'}
- Email: ${leadData.contactEmail || 'Unknown'}
- Location: ${leadData.location || 'Unknown'}
- Technologies: ${leadData.technologies?.join(', ') || 'Unknown'}
- Intent Signals: ${leadData.intentSignals?.join(', ') || 'None detected'}

Ideal Customer Profile:
- Target Industries: ${idealCustomerProfile.targetIndustries.join(', ')}
- Target Company Sizes: ${idealCustomerProfile.targetCompanySize.join(', ')}
- Target Titles: ${idealCustomerProfile.targetTitles.join(', ')}
- Target Locations: ${idealCustomerProfile.targetLocations.join(', ')}
- Required Technologies: ${idealCustomerProfile.requiredTechnologies?.join(', ') || 'None specified'}

Provide a JSON response:
{
  "score": 75,
  "tier": "warm",
  "reasons": ["Matches target industry", "Good title match"],
  "missingData": ["Phone number", "Company revenue"],
  "nextBestAction": "Send personalized email highlighting industry expertise",
  "idealContactMethod": "email",
  "personalizedOpener": "A personalized opening line for outreach",
  "objectionHandlers": {
    "price": "Response to price objection",
    "timing": "Response to timing objection",
    "competition": "Response to competition objection"
  }
}

Respond ONLY with valid JSON.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  if (!response.content || response.content.length === 0) {
    throw new Error('Empty response from Claude API')
  }

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  try {
    return JSON.parse(content.text) as LeadQualificationResult
  } catch {
    return {
      score: 50,
      tier: 'cold',
      reasons: ['Unable to fully analyze lead'],
      missingData: ['Full company data'],
      nextBestAction: 'Gather more information before outreach',
      idealContactMethod: 'email',
      personalizedOpener: `Hi ${leadData.contactName || 'there'}, I came across ${leadData.companyName} and wanted to connect.`,
      objectionHandlers: {},
    }
  }
}

// ============================================================================
// EMAIL GENERATION
// ============================================================================

/**
 * Generate personalized sales email using AI
 */
export async function generateSalesEmail(
  context: {
    senderName: string
    senderCompany: string
    senderProduct: string
    recipientName: string
    recipientTitle: string
    recipientCompany: string
    recipientIndustry?: string
    valueProposition: string
    callToAction: string
    tone: 'professional' | 'casual' | 'friendly' | 'urgent'
    previousInteractions?: string[]
  }
): Promise<EmailDraft> {
  const client = getClient()

  const prompt = `You are an expert B2B sales copywriter. Generate a personalized cold email.

Sender:
- Name: ${context.senderName}
- Company: ${context.senderCompany}
- Product/Service: ${context.senderProduct}

Recipient:
- Name: ${context.recipientName}
- Title: ${context.recipientTitle}
- Company: ${context.recipientCompany}
- Industry: ${context.recipientIndustry || 'Unknown'}

Value Proposition: ${context.valueProposition}
Desired CTA: ${context.callToAction}
Tone: ${context.tone}
${context.previousInteractions?.length ? `Previous Interactions: ${context.previousInteractions.join('; ')}` : ''}

Create a compelling email that:
1. Has a curiosity-driving subject line (under 50 chars)
2. Opens with a personalized hook about their company/role
3. Quickly establishes relevance and value
4. Has a clear, low-friction call to action
5. Is under 150 words

Respond with JSON:
{
  "subject": "Subject line",
  "body": "Full email body with proper formatting",
  "callToAction": "The specific CTA in the email",
  "followUpTiming": "When to follow up if no response",
  "alternativeSubjects": ["Alt subject 1", "Alt subject 2"]
}

Respond ONLY with valid JSON.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  if (!response.content || response.content.length === 0) {
    throw new Error('Empty response from Claude API')
  }

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  try {
    return JSON.parse(content.text) as EmailDraft
  } catch {
    return {
      subject: `Quick question about ${context.recipientCompany}`,
      body: `Hi ${context.recipientName},\n\nI noticed ${context.recipientCompany} and wanted to reach out about ${context.valueProposition}.\n\n${context.callToAction}\n\nBest,\n${context.senderName}`,
      callToAction: context.callToAction,
      followUpTiming: '3 business days',
      alternativeSubjects: [],
    }
  }
}

// ============================================================================
// COMPANY RESEARCH
// ============================================================================

/**
 * Research a company using AI analysis of available data
 */
export async function researchCompany(
  domain: string,
  websiteContent?: string,
  additionalContext?: string
): Promise<CompanyResearchResult> {
  const client = getClient()

  const prompt = `You are a business research analyst. Analyze available information about this company.

Domain: ${domain}

${websiteContent ? `Website Content:\n${websiteContent.slice(0, 6000)}` : 'No website content available.'}

${additionalContext ? `Additional Context:\n${additionalContext}` : ''}

Extract and infer as much information as possible. Provide a JSON response:
{
  "companyName": "Official company name",
  "description": "What the company does (2-3 sentences)",
  "industry": "Primary industry",
  "products": ["product1", "product2"],
  "services": ["service1", "service2"],
  "targetCustomers": "Who they sell to",
  "companySize": "Estimated size (startup/small/medium/large/enterprise)",
  "foundedYear": 2020,
  "headquarters": "City, State/Country",
  "keyPeople": [
    {"name": "John Doe", "title": "CEO", "linkedIn": "url if found"}
  ],
  "recentNews": ["Any recent developments mentioned"],
  "techStack": ["technologies", "they", "use"],
  "socialProfiles": {
    "linkedin": "url",
    "twitter": "url",
    "facebook": "url"
  },
  "confidenceScore": 0.75
}

For fields you cannot determine, use null or empty arrays. Respond ONLY with valid JSON.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  if (!response.content || response.content.length === 0) {
    throw new Error('Empty response from Claude API')
  }

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  try {
    return JSON.parse(content.text) as CompanyResearchResult
  } catch {
    return {
      companyName: domain.split('.')[0],
      description: 'Unable to analyze company',
      industry: 'Unknown',
      products: [],
      services: [],
      targetCustomers: 'Unknown',
      companySize: 'Unknown',
      foundedYear: null,
      headquarters: null,
      keyPeople: [],
      recentNews: [],
      techStack: [],
      socialProfiles: {},
      confidenceScore: 0.1,
    }
  }
}

// ============================================================================
// INTENT SIGNAL ANALYSIS
// ============================================================================

/**
 * Analyze signals to determine buying intent
 */
export async function analyzeIntentSignals(
  signals: Array<{
    type: string
    description: string
    timestamp: string
    source: string
  }>,
  companyContext: {
    name: string
    industry?: string
    size?: string
  }
): Promise<{
  intentScore: number
  category: 'high_intent' | 'medium_intent' | 'low_intent' | 'no_intent'
  analysis: string
  keySignals: string[]
  recommendedAction: string
  urgency: 'immediate' | 'soon' | 'standard' | 'low'
}> {
  const client = getClient()

  const signalsList = signals
    .map((s) => `- [${s.type}] ${s.description} (${s.source}, ${s.timestamp})`)
    .join('\n')

  const prompt = `You are a B2B buying intent analyst. Analyze these signals to determine purchase likelihood.

Company: ${companyContext.name}
Industry: ${companyContext.industry || 'Unknown'}
Size: ${companyContext.size || 'Unknown'}

Detected Signals:
${signalsList || 'No signals detected'}

Analyze the buying intent and respond with JSON:
{
  "intentScore": 75,
  "category": "high_intent",
  "analysis": "Brief analysis of why this score",
  "keySignals": ["Most important signal 1", "Signal 2"],
  "recommendedAction": "What to do next",
  "urgency": "immediate"
}

Score Guidelines:
- 80-100: High intent (actively evaluating solutions)
- 60-79: Medium intent (researching, aware of need)
- 40-59: Low intent (might have future need)
- 0-39: No intent (not a good fit now)

Respond ONLY with valid JSON.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  if (!response.content || response.content.length === 0) {
    throw new Error('Empty response from Claude API')
  }

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  try {
    return JSON.parse(content.text)
  } catch {
    return {
      intentScore: 30,
      category: 'low_intent',
      analysis: 'Unable to fully analyze intent signals',
      keySignals: [],
      recommendedAction: 'Gather more signals before outreach',
      urgency: 'low',
    }
  }
}

// ============================================================================
// CONVERSATION ANALYSIS
// ============================================================================

/**
 * Analyze email/conversation thread for insights
 */
export async function analyzeConversation(
  messages: Array<{
    from: 'us' | 'them'
    content: string
    timestamp: string
  }>,
  context: {
    companyName: string
    contactName: string
    dealStage?: string
  }
): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative'
  engagement: 'high' | 'medium' | 'low'
  objections: string[]
  interests: string[]
  nextSteps: string
  suggestedResponse: string
  dealHealth: number // 0-100
}> {
  const client = getClient()

  const conversationText = messages
    .map((m) => `[${m.from === 'us' ? 'Us' : context.contactName}]: ${m.content}`)
    .join('\n\n')

  const prompt = `You are a sales conversation analyst. Analyze this email thread.

Company: ${context.companyName}
Contact: ${context.contactName}
Deal Stage: ${context.dealStage || 'Unknown'}

Conversation:
${conversationText}

Provide insights as JSON:
{
  "sentiment": "positive",
  "engagement": "high",
  "objections": ["Objection they raised"],
  "interests": ["What they seem interested in"],
  "nextSteps": "What should happen next",
  "suggestedResponse": "A suggested response to send",
  "dealHealth": 75
}

Respond ONLY with valid JSON.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  if (!response.content || response.content.length === 0) {
    throw new Error('Empty response from Claude API')
  }

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  try {
    return JSON.parse(content.text)
  } catch {
    return {
      sentiment: 'neutral',
      engagement: 'medium',
      objections: [],
      interests: [],
      nextSteps: 'Continue engagement',
      suggestedResponse: 'Follow up with additional value',
      dealHealth: 50,
    }
  }
}
