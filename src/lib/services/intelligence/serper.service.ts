import { safeError } from '@/lib/utils/log-sanitizer'
import { fetchWithBackoff } from './rate-limiter'

export interface NewsArticle {
  title: string
  url: string
  date: string
  snippet: string
  source: string
}

export async function getNewsMentions(name: string, company: string): Promise<NewsArticle[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return []

  try {
    const query = `"${name}" "${company}"`
    const res = await fetchWithBackoff('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 5 }),
    }, 2)

    if (!res.ok) return []
    const data = await res.json()

    return (data.news ?? []).slice(0, 5).map((a: any) => ({
      title: a.title ?? '',
      url: a.link ?? '',
      date: a.date ?? '',
      snippet: a.snippet ?? '',
      source: a.source ?? '',
    }))
  } catch (err) {
    safeError('[Serper] Error fetching news mentions', err)
    return []
  }
}
