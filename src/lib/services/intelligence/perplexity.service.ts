import { safeError } from '@/lib/utils/log-sanitizer'
import { fetchWithBackoff } from './rate-limiter'

export interface DeepResearchResult {
  brief: string
  keyFacts: string[]
  outreachAngle: string
  sources: string[]
  model: string
}

export async function deepResearchPerson(
  name: string,
  company: string,
  title: string,
  domain?: string,
): Promise<DeepResearchResult | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) return null

  const systemPrompt = `You are a B2B sales intelligence researcher. Given a person's name, company, and title, produce a concise intelligence dossier for a sales outreach team. Structure your response as JSON with these exact fields:
{
  "brief": "2-3 paragraph background on who this person is professionally",
  "keyFacts": ["fact 1", "fact 2", "fact 3", "fact 4", "fact 5"],
  "outreachAngle": "The single most compelling personalized outreach angle for this person",
  "sources": ["source url 1", "source url 2"]
}`

  const userPrompt = `Research this person for B2B outreach:
Name: ${name}
Company: ${company}
Title: ${title}
${domain ? `Domain: ${domain}` : ''}

Find: their professional background, what they care about, recent news/activity, pain points for their role, and the best outreach angle.`

  try {
    const res = await fetchWithBackoff('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.2,
        return_citations: true,
      }),
    }, 2)

    if (!res.ok) {
      const errText = await res.text()
      safeError('[Perplexity] API error', errText)
      return null
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    const citations = data.citations ?? []

    // Parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')
      const parsed = JSON.parse(jsonMatch[0])
      return {
        brief: parsed.brief ?? content,
        keyFacts: parsed.keyFacts ?? [],
        outreachAngle: parsed.outreachAngle ?? '',
        sources: [...(parsed.sources ?? []), ...citations].slice(0, 5),
        model: data.model ?? 'sonar',
      }
    } catch {
      // Fallback: return raw content as brief
      return {
        brief: content,
        keyFacts: [],
        outreachAngle: '',
        sources: citations.slice(0, 5),
        model: data.model ?? 'sonar',
      }
    }
  } catch (err) {
    safeError('[Perplexity] Error running deep research', err)
    return null
  }
}
