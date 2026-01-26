// Campaign Reply Handling Functions
// Handles AI classification and response generation for email replies

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { quickClassify, type IntentCategory, type SuggestedAction } from '@/lib/services/ai/intent'

// Mock flag for development when API keys aren't available
const USE_MOCKS = !process.env.ANTHROPIC_API_KEY

// Lazy-initialized Anthropic client
let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

interface ReplyClassification {
  sentiment: 'positive' | 'negative' | 'neutral' | 'question' | 'not_interested' | 'out_of_office' | 'unsubscribe'
  intent_score: number
  confidence: number
  reasoning: string
  suggested_action: string
}

interface SuggestedResponse {
  subject?: string
  body: string
  tone: string
  confidence: number
}

// Handle incoming reply - classify and suggest response
export const processReply = inngest.createFunction(
  {
    id: 'campaign-process-reply',
    name: 'Process Campaign Reply',
    retries: 3,
  },
  { event: 'emailbison/reply-received' },
  async ({ event, step, logger }) => {
    const { reply_id, lead_email, from_email, subject, body, received_at } = event.data

    logger.info(`Processing reply ${reply_id} from ${from_email}`)

    // Step 1: Find the reply record
    const reply = await step.run('fetch-reply', async () => {
      const supabase = await createClient()

      // Try to find by ID first, then by email
      let query = supabase
        .from('email_replies')
        .select(`
          *,
          lead:leads!lead_id(
            id,
            first_name,
            last_name,
            company_name,
            job_title
          ),
          campaign:email_campaigns!campaign_id(
            id,
            name,
            client_profile
          ),
          email_send:email_sends!email_send_id(
            id,
            subject,
            body_text
          )
        `)

      if (reply_id && reply_id.match(/^[0-9a-f-]{36}$/i)) {
        query = query.eq('id', reply_id)
      } else {
        query = query.eq('from_email', from_email).order('received_at', { ascending: false }).limit(1)
      }

      const { data, error } = await query.single()

      if (error) {
        logger.warn(`Reply record not found: ${error.message}`)
        return null
      }

      return data
    })

    if (!reply) {
      logger.info('No reply record found to process')
      return { success: false, reason: 'reply_not_found' }
    }

    // Step 2: Classify the reply with AI
    const classification = await step.run('classify-reply', async () => {
      if (USE_MOCKS) {
        logger.info('[MOCK] Generating mock classification')
        return generateMockClassification(body, subject)
      }

      return await classifyWithClaude(body, subject, reply, logger)
    })

    // Step 3: Update reply with classification
    await step.run('update-classification', async () => {
      const supabase = await createClient()

      const { error } = await supabase
        .from('email_replies')
        .update({
          sentiment: classification.sentiment,
          intent_score: classification.intent_score,
          classification_confidence: classification.confidence,
          classification_metadata: {
            reasoning: classification.reasoning,
            suggested_action: classification.suggested_action,
            classified_via: USE_MOCKS ? 'mock' : 'claude',
          },
          classified_at: new Date().toISOString(),
        })
        .eq('id', reply.id)

      if (error) {
        throw new Error(`Failed to update classification: ${error.message}`)
      }

      logger.info(`Reply ${reply.id} classified as ${classification.sentiment} with intent ${classification.intent_score}`)
    })

    // Step 4: Generate suggested response for high-value replies
    let suggestedResponse: SuggestedResponse | null = null

    if (shouldGenerateResponse(classification)) {
      suggestedResponse = await step.run('generate-response', async () => {
        if (USE_MOCKS) {
          logger.info('[MOCK] Generating mock response suggestion')
          return generateMockResponse(classification, reply)
        }

        return await generateResponseWithClaude(classification, reply, logger)
      })

      // Update reply with suggested response
      await step.run('update-response', async () => {
        const supabase = await createClient()

        const { error } = await supabase
          .from('email_replies')
          .update({
            suggested_response: suggestedResponse?.body,
            suggested_response_metadata: {
              subject: suggestedResponse?.subject,
              tone: suggestedResponse?.tone,
              confidence: suggestedResponse?.confidence,
              generated_via: USE_MOCKS ? 'mock' : 'claude',
            },
            response_generated_at: new Date().toISOString(),
          })
          .eq('id', reply.id)

        if (error) {
          logger.warn(`Failed to update suggested response: ${error.message}`)
        }
      })
    }

    // Step 5: Update campaign lead status
    await step.run('update-campaign-lead', async () => {
      const supabase = await createClient()

      // Determine new status based on sentiment
      const statusMap: Record<string, string> = {
        positive: 'positive',
        question: 'replied',
        neutral: 'replied',
        negative: 'not_interested',
        not_interested: 'not_interested',
        unsubscribe: 'unsubscribed',
        out_of_office: 'replied',
      }

      const newStatus = statusMap[classification.sentiment] || 'replied'

      await supabase
        .from('campaign_leads')
        .update({
          status: newStatus,
          reply_sentiment: classification.sentiment,
          reply_intent_score: classification.intent_score,
          last_reply_id: reply.id,
          updated_at: new Date().toISOString(),
        })
        .eq('campaign_id', reply.campaign_id)
        .eq('lead_id', reply.lead_id)
    })

    return {
      success: true,
      reply_id: reply.id,
      classification,
      has_suggested_response: !!suggestedResponse,
    }
  }
)

// Batch process unclassified replies
export const batchProcessReplies = inngest.createFunction(
  {
    id: 'campaign-batch-process-replies',
    name: 'Batch Process Unclassified Replies',
    retries: 2,
  },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async ({ step, logger }) => {
    // Fetch unclassified replies
    const unclassifiedReplies = await step.run('fetch-unclassified', async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('email_replies')
        .select('id, from_email')
        .is('classified_at', null)
        .eq('status', 'new')
        .order('received_at', { ascending: true })
        .limit(50)

      if (error) {
        throw new Error(`Failed to fetch unclassified replies: ${error.message}`)
      }

      return data || []
    })

    logger.info(`Found ${unclassifiedReplies.length} unclassified replies`)

    if (unclassifiedReplies.length === 0) {
      return { success: true, processed: 0 }
    }

    // Queue processing for each reply
    await step.run('queue-processing', async () => {
      const events = unclassifiedReplies.map((reply) => ({
        name: 'emailbison/reply-received' as const,
        data: {
          reply_id: reply.id,
          lead_email: reply.from_email,
          from_email: reply.from_email,
          subject: '',
          body: '',
          received_at: new Date().toISOString(),
        },
      }))

      await inngest.send(events)
    })

    return {
      success: true,
      processed: unclassifiedReplies.length,
    }
  }
)

// Helper: Determine if we should generate a response suggestion
function shouldGenerateResponse(classification: ReplyClassification): boolean {
  // Generate responses for positive, questions, and neutral replies
  const generateFor = ['positive', 'neutral', 'question']
  return generateFor.includes(classification.sentiment) && classification.intent_score >= 3
}

// Helper: Generate mock classification for development
function generateMockClassification(body: string, subject: string): ReplyClassification {
  const lowerBody = body.toLowerCase()
  const lowerSubject = subject.toLowerCase()

  // Simple rule-based mock classification
  if (lowerBody.includes('interested') || lowerBody.includes('tell me more') || lowerBody.includes('sounds good')) {
    return {
      sentiment: 'positive',
      intent_score: 8,
      confidence: 0.85,
      reasoning: 'Reply contains positive interest indicators',
      suggested_action: 'Schedule a call or send more information',
    }
  }

  if (lowerBody.includes('not interested') || lowerBody.includes('no thanks') || lowerBody.includes('remove me')) {
    return {
      sentiment: 'not_interested',
      intent_score: 1,
      confidence: 0.9,
      reasoning: 'Reply contains explicit disinterest',
      suggested_action: 'Respect decision, mark as not interested',
    }
  }

  if (lowerBody.includes('unsubscribe') || lowerBody.includes('stop emailing')) {
    return {
      sentiment: 'unsubscribe',
      intent_score: 0,
      confidence: 0.95,
      reasoning: 'Reply requests unsubscription',
      suggested_action: 'Remove from all campaigns immediately',
    }
  }

  if (lowerBody.includes('out of office') || lowerBody.includes('vacation') || lowerBody.includes('will be back')) {
    return {
      sentiment: 'out_of_office',
      intent_score: 5,
      confidence: 0.9,
      reasoning: 'Auto-reply detected',
      suggested_action: 'Wait and follow up after return date',
    }
  }

  if (lowerBody.includes('?') || lowerBody.includes('how') || lowerBody.includes('what')) {
    return {
      sentiment: 'question',
      intent_score: 6,
      confidence: 0.75,
      reasoning: 'Reply contains questions',
      suggested_action: 'Answer questions and guide toward next step',
    }
  }

  return {
    sentiment: 'neutral',
    intent_score: 5,
    confidence: 0.6,
    reasoning: 'No clear positive or negative signals detected',
    suggested_action: 'Review manually and follow up appropriately',
  }
}

// Helper: Generate mock response suggestion
function generateMockResponse(
  classification: ReplyClassification,
  reply: any
): SuggestedResponse {
  const leadName = reply.lead?.first_name || 'there'

  const responses: Record<string, SuggestedResponse> = {
    positive: {
      subject: `Re: ${reply.subject || 'Following up'}`,
      body: `Hi ${leadName},

Thanks so much for your interest! I'd love to set up a quick call to discuss how we can help.

Would you have 15-20 minutes this week or next? Feel free to pick a time that works: [CALENDAR_LINK]

Looking forward to connecting!

Best,
[YOUR_NAME]`,
      tone: 'enthusiastic',
      confidence: 0.8,
    },
    question: {
      subject: `Re: ${reply.subject || 'Your questions'}`,
      body: `Hi ${leadName},

Great questions! Let me address those:

[Answer their specific questions here]

Would it be helpful to jump on a quick call to discuss further? I'm happy to walk through anything in more detail.

Best,
[YOUR_NAME]`,
      tone: 'helpful',
      confidence: 0.75,
    },
    neutral: {
      subject: `Re: ${reply.subject || 'Following up'}`,
      body: `Hi ${leadName},

Thanks for getting back to me. I wanted to make sure you had everything you needed to evaluate whether this might be a good fit.

Is there any specific information I can provide, or would a quick call be useful?

Best,
[YOUR_NAME]`,
      tone: 'professional',
      confidence: 0.7,
    },
  }

  return responses[classification.sentiment] || responses.neutral
}

// Helper: Classify with Claude AI (real implementation)
async function classifyWithClaude(
  body: string,
  subject: string,
  reply: any,
  logger: any
): Promise<ReplyClassification> {
  // First, try quick pattern matching for obvious cases
  const quickResult = quickClassify(body)
  if (quickResult) {
    logger.info(`[REAL] Quick classification matched: ${quickResult.category}`)
    // Map IntentCategory to our sentiment type
    const categoryToSentiment: Record<IntentCategory, ReplyClassification['sentiment']> = {
      'INTERESTED': 'positive',
      'CURIOUS': 'neutral',
      'QUESTION': 'question',
      'OBJECTION': 'neutral',
      'NOT_INTERESTED': 'not_interested',
      'UNSUBSCRIBE': 'unsubscribe',
      'OUT_OF_OFFICE': 'out_of_office',
      'WRONG_PERSON': 'not_interested',
    }
    const actionToSuggested: Record<SuggestedAction, string> = {
      'auto_reply': 'Schedule a call or send more information',
      'human_review': 'Review manually and respond appropriately',
      'ignore': 'No action needed',
      'unsubscribe': 'Remove from all campaigns immediately',
    }
    return {
      sentiment: categoryToSentiment[quickResult.category] || 'neutral',
      intent_score: quickResult.score,
      confidence: quickResult.confidence,
      reasoning: quickResult.reasoning,
      suggested_action: actionToSuggested[quickResult.suggestedAction] || 'Review manually',
    }
  }

  // For ambiguous cases, use Claude API
  logger.info('[REAL] Classifying with Claude API')
  const client = getAnthropicClient()

  // Build context from the original email if available
  const originalEmailContext = reply.email_send?.body_text
    ? `\nORIGINAL EMAIL WE SENT:\n${reply.email_send.body_text.substring(0, 500)}`
    : ''

  const prompt = `You are analyzing an email reply to a cold outreach campaign. Classify the reply sentiment and intent.

REPLY SUBJECT: ${subject || '(no subject)'}

REPLY BODY:
${body}
${originalEmailContext}

LEAD CONTEXT:
- Name: ${reply.lead?.first_name || 'Unknown'} ${reply.lead?.last_name || ''}
- Company: ${reply.lead?.company_name || 'Unknown'}
- Title: ${reply.lead?.job_title || 'Unknown'}

Classify this reply into ONE of these sentiments:
1. positive - Interested, wants more info, willing to talk (intent: 7-10)
2. question - Has specific questions, engaged but not committed (intent: 5-7)
3. neutral - Acknowledged but unclear intent (intent: 4-6)
4. not_interested - Explicit rejection or decline (intent: 1-3)
5. negative - Hostile, complaints, very negative tone (intent: 1-2)
6. out_of_office - Auto-reply, vacation, away message (intent: 0)
7. unsubscribe - Explicit unsubscribe or removal request (intent: 0)

Respond ONLY with valid JSON:
{
  "sentiment": "positive|question|neutral|not_interested|negative|out_of_office|unsubscribe",
  "intent_score": 0-10,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of classification",
  "suggested_action": "What to do next"
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    if (!response.content || response.content.length === 0 || response.content[0].type !== 'text') {
      logger.warn('Empty or invalid Claude response, falling back to mock')
      return generateMockClassification(body, subject)
    }

    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      logger.warn('No JSON in Claude response, falling back to mock')
      return generateMockClassification(body, subject)
    }

    const result = JSON.parse(jsonMatch[0])

    // Validate and sanitize the response
    const validSentiments = ['positive', 'negative', 'neutral', 'question', 'not_interested', 'out_of_office', 'unsubscribe']
    const sentiment = validSentiments.includes(result.sentiment) ? result.sentiment : 'neutral'

    return {
      sentiment: sentiment as ReplyClassification['sentiment'],
      intent_score: Math.max(0, Math.min(10, Number(result.intent_score) || 5)),
      confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.7)),
      reasoning: result.reasoning || 'AI classification',
      suggested_action: result.suggested_action || 'Review and respond appropriately',
    }
  } catch (error) {
    logger.error(`Claude API error during classification: ${error}`)
    return generateMockClassification(body, subject)
  }
}

// Helper: Generate response with Claude AI (real implementation)
async function generateResponseWithClaude(
  classification: ReplyClassification,
  reply: any,
  logger: any
): Promise<SuggestedResponse> {
  logger.info('[REAL] Generating response with Claude API')
  const client = getAnthropicClient()

  const leadName = reply.lead?.first_name || 'there'
  const companyName = reply.lead?.company_name || 'your company'
  const campaignName = reply.campaign?.name || ''

  // Get original email context
  const originalEmail = reply.email_send?.body_text || ''
  const replyBody = reply.body_text || reply.body_html || ''

  const toneGuidance = {
    positive: 'Be enthusiastic and move toward scheduling a call or demo. Keep momentum.',
    question: 'Be helpful and thorough in answering their questions. Provide clear next steps.',
    neutral: 'Be engaging but not pushy. Offer value and a clear but low-pressure next step.',
  }

  const prompt = `You are a professional sales representative responding to an email reply. Generate a personalized, authentic response.

THEIR REPLY:
${replyBody.substring(0, 1000)}

THEIR SENTIMENT: ${classification.sentiment} (intent score: ${classification.intent_score}/10)

LEAD INFO:
- Name: ${leadName}
- Company: ${companyName}
- Title: ${reply.lead?.job_title || 'Unknown'}

${originalEmail ? `ORIGINAL EMAIL WE SENT:\n${originalEmail.substring(0, 500)}\n` : ''}

TONE GUIDANCE: ${toneGuidance[classification.sentiment as keyof typeof toneGuidance] || 'Be professional and helpful.'}

Write a response that:
1. Acknowledges their reply naturally
2. Addresses any questions or concerns they raised
3. Provides value relevant to their situation
4. Includes a clear call-to-action (meeting, call, or next step)
5. Is concise (under 150 words)
6. Sounds human and authentic, not templated

DO NOT include:
- Email headers (To:, From:, Subject:)
- Formal greetings like "Dear" - use casual "Hi ${leadName},"
- Overly formal sign-offs - use simple "Best," or "Thanks,"
- Placeholder text like [YOUR_NAME] - leave signature area for user to complete

Respond with JSON:
{
  "subject": "Re: Original subject or appropriate response subject",
  "body": "The full email response body",
  "tone": "enthusiastic|helpful|professional|casual",
  "confidence": 0.0-1.0
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    if (!response.content || response.content.length === 0 || response.content[0].type !== 'text') {
      logger.warn('Empty Claude response for reply generation, using mock')
      return generateMockResponse(classification, reply)
    }

    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      logger.warn('No JSON in Claude response for reply generation, using mock')
      return generateMockResponse(classification, reply)
    }

    const result = JSON.parse(jsonMatch[0])

    return {
      subject: result.subject || `Re: ${reply.subject || 'Following up'}`,
      body: result.body || generateMockResponse(classification, reply).body,
      tone: result.tone || 'professional',
      confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.75)),
    }
  } catch (error) {
    logger.error(`Claude API error during response generation: ${error}`)
    return generateMockResponse(classification, reply)
  }
}
